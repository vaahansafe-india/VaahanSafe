import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  D1ReplacementRepository,
  D1StickerReplacementRepository,
  D1QrInventoryAdapter,
  resolvePublicEmergencyProfile,
} from "@vaahansafe/database";
import type { DatabaseClient } from "@vaahansafe/database";
import {
  createReplacementRequest,
  evaluateReplacementEligibility,
  executeAssignmentMigration,
  AssignmentMigrationPorts,
  ReplacementNotAllowedError,
} from "@vaahansafe/shipping";

describe("Phase 12 — QR Replacement Domain, IDOR Protection & Controlled Migration", () => {
  let db: DatabaseSync;
  let client: DatabaseClient;

  let replacementRepo: D1ReplacementRepository;
  let stickerReplacementRepo: D1StickerReplacementRepository;
  let inventoryAdapter: D1QrInventoryAdapter;
  let migrationPorts: AssignmentMigrationPorts;

  beforeEach(() => {
    db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");

    const cfD1Dir = path.resolve(__dirname, "../infrastructure/cloudflare/d1");
    const migrationsDir = path.join(cfD1Dir, "migrations");
    const files = [
      "0001_identity.sql",
      "0002_vehicle_emergency.sql",
      "0003_qr_inventory.sql",
      "0004_media_assets.sql",
      "0005_commerce_subscriptions.sql",
      "0006_notifications.sql",
      "0007_fulfilment_shipping_replacement.sql",
    ];

    for (const f of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, f), "utf8");
      db.exec(sql);
    }

    const seedPath = path.join(cfD1Dir, "seeds/dev.sql");
    const devSeed = fs.readFileSync(seedPath, "utf8");
    db.exec(devSeed);

    client = {
      async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
        return db.prepare(sql).all(...params) as T[];
      },
      async queryFirst<T>(sql: string, params: unknown[] = []): Promise<T | null> {
        const rows = db.prepare(sql).all(...params) as T[];
        return rows.length > 0 ? (rows[0] as T) : null;
      },
      async execute(sql: string, params: unknown[] = []): Promise<{ success: boolean }> {
        db.prepare(sql).run(...params);
        return { success: true };
      },
      async batch(operations: Array<{ sql: string; params?: unknown[] }>): Promise<boolean> {
        for (const op of operations) {
          db.prepare(op.sql).run(...(op.params || []));
        }
        return true;
      },
    };

    replacementRepo = new D1ReplacementRepository(client);
    stickerReplacementRepo = new D1StickerReplacementRepository(client);
    inventoryAdapter = new D1QrInventoryAdapter(client);

    migrationPorts = {
      findActiveAssignmentByQr: async (qrId: string) => {
        const row = await client.queryFirst<{ id: string; vehicle_id: string; user_id: string }>(
          `SELECT id, vehicle_id, user_id FROM qr_assignments WHERE qr_id = ? AND ended_at IS NULL`,
          [qrId]
        );
        return row ? { id: row.id, vehicleId: row.vehicle_id, userId: row.user_id } : null;
      },
      closeAssignment: async (assignmentId: string, endReason: string, endedAt: string) => {
        await client.execute(
          `UPDATE qr_assignments SET ended_at = ?, end_reason = ? WHERE id = ?`,
          [endedAt, endReason, assignmentId]
        );
      },
      createAssignment: async (assignment) => {
        const id = assignment.id || `qra_${crypto.randomUUID()}`;
        await client.execute(
          `INSERT INTO qr_assignments (id, qr_id, vehicle_id, user_id, assignment_type, assigned_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            id,
            assignment.qrId,
            assignment.vehicleId,
            assignment.userId,
            assignment.assignmentType,
            assignment.assignedAt,
          ]
        );
      },
      updateQrSticker: async (qrId: string, updates) => {
        await client.execute(
          `UPDATE qr_stickers SET
             status = COALESCE(?, status),
             replaced_by_qr_id = COALESCE(?, replaced_by_qr_id),
             updated_at = datetime('now')
           WHERE id = ?`,
          [updates.status ?? null, updates.replacedByQrId ?? null, qrId]
        );
      },
      saveStickerReplacementLink: async (link) => {
        await stickerReplacementRepo.save(link);
      },
      findStickerReplacementByRequestId: async (requestId: string) => {
        return stickerReplacementRepo.findByRequestId(requestId);
      },
      recordStatusHistory: async (entry) => {
        await inventoryAdapter.recordStatusHistory(entry);
      },
    };
  });

  describe("Ownership & IDOR Protection", () => {
    it("rejects replacement request when caller does not own the vehicle", () => {
      expect(() =>
        evaluateReplacementEligibility(
          {
            userId: "usr_demo_102", // Attacker
            vehicleOwnerUserId: "usr_demo_101", // Victim
            vehicleStatus: "ACTIVE",
            oldQrStatus: "ACTIVATED",
            hasOpenReplacementRequest: false,
          },
          "DAMAGED"
        )
      ).toThrow(ReplacementNotAllowedError);
    });

    it("requires step-up OTP if account was recently recovered", () => {
      const result = evaluateReplacementEligibility(
        {
          userId: "usr_demo_101",
          vehicleOwnerUserId: "usr_demo_101",
          vehicleStatus: "ACTIVE",
          oldQrStatus: "ACTIVATED",
          hasOpenReplacementRequest: false,
          isAccountRecentlyRecovered: true,
        },
        "LOST"
      );

      expect(result.isEligible).toBe(true);
      expect(result.riskLevel).toBe("HIGH");
      expect(result.requiresStepUp).toBe(true);
      expect(result.autoApprove).toBe(false);
    });
  });

  describe("Database Constraints: Uncontrolled Multiple Open Requests", () => {
    it("prevents multiple concurrent open replacement requests for the same QR", async () => {
      // Create first replacement request in REQUESTED state
      const req1 = createReplacementRequest({
        id: "rpr_first",
        userId: "usr_demo_101",
        vehicleId: "veh_demo_car",
        oldQrStickerId: "qr_active_001",
        reason: "DAMAGED",
        status: "REQUESTED",
      });
      await replacementRepo.save(req1);

      // Attempt to create a second open replacement request for the same old QR sticker
      const req2 = createReplacementRequest({
        id: "rpr_second",
        userId: "usr_demo_101",
        vehicleId: "veh_demo_car",
        oldQrStickerId: "qr_active_001",
        reason: "LOST",
        status: "REQUESTED",
      });

      // INVARIANT: Blocked by idx_replacement_active_old_qr
      await expect(replacementRepo.save(req2)).rejects.toThrow(/UNIQUE constraint failed/);

      // Verify findActiveByOldQrId locates the single open request
      const active = await replacementRepo.findActiveByOldQrId("qr_active_001");
      expect(active?.id).toBe("rpr_first");
    });
  });

  describe("Scenario C (Proof C): Replacement Processed Twice", () => {
    it("allocates exactly ONE new QR and returns identical link upon retry", async () => {
      const request = createReplacementRequest({
        id: "rpr_idempotent_test",
        userId: "usr_demo_101",
        vehicleId: "veh_demo_car",
        oldQrStickerId: "qr_active_001",
        reason: "DAMAGED",
        status: "APPROVED",
      });
      await replacementRepo.save(request);

      // Run 1: First migration execution
      const link1 = await executeAssignmentMigration(
        {
          replacementRequestId: request.id,
          oldQrStickerId: "qr_active_001",
          newQrStickerId: "qr_printed_002",
          vehicleId: "veh_demo_car",
          userId: "usr_demo_101",
          reason: "DAMAGED",
        },
        migrationPorts
      );

      expect(link1).toBeDefined();
      expect(link1.replacementRequestId).toBe(request.id);
      expect(link1.oldQrStickerId).toBe("qr_active_001");
      expect(link1.newQrStickerId).toBe("qr_printed_002");

      // Run 2: Retry migration with same request
      const link2 = await executeAssignmentMigration(
        {
          replacementRequestId: request.id,
          oldQrStickerId: "qr_active_001",
          newQrStickerId: "qr_printed_002",
          vehicleId: "veh_demo_car",
          userId: "usr_demo_101",
          reason: "DAMAGED",
        },
        migrationPorts
      );

      // Idempotency: exact same link returned
      expect(link2.id).toBe(link1.id);
      expect(link2.newQrStickerId).toBe("qr_printed_002");

      // Verify only ONE replacement link exists in the database
      const totalLinks = await client.queryFirst<{ cnt: number }>(
        `SELECT COUNT(*) as cnt FROM sticker_replacements WHERE replacement_request_id = ?`,
        [request.id]
      );
      expect(totalLinks?.cnt).toBe(1);

      // Verify only ONE active assignment exists for the vehicle
      const activeAssignments = await client.queryFirst<{ cnt: number }>(
        `SELECT COUNT(*) as cnt FROM qr_assignments WHERE vehicle_id = 'veh_demo_car' AND ended_at IS NULL`
      );
      expect(activeAssignments?.cnt).toBe(1);
    });
  });

  describe("Scenario D (Proof D): Old QR -> REPLACED, New QR -> CURRENT", () => {
    it("preserves historical assignments, updates old QR resolver to safe REPLACED, and maps new QR to vehicle", async () => {
      const request = createReplacementRequest({
        id: "rpr_proof_d",
        userId: "usr_demo_101",
        vehicleId: "veh_demo_car",
        oldQrStickerId: "qr_active_001",
        reason: "DAMAGED",
        status: "APPROVED",
      });
      await replacementRepo.save(request);

      // Pre-condition: Old QR is active and resolves emergency profile
      const preResolve = await resolvePublicEmergencyProfile(client, "7F3K9021");
      expect(preResolve.state).toBe("ACTIVE");
      expect(preResolve.profile?.approvedEmergencyContacts.length).toBeGreaterThan(0);

      // Execute migration to new sticker (qr_printed_002, public_id: 8M2P4510)
      await executeAssignmentMigration(
        {
          replacementRequestId: request.id,
          oldQrStickerId: "qr_active_001",
          newQrStickerId: "qr_printed_002",
          vehicleId: "veh_demo_car",
          userId: "usr_demo_101",
          reason: "DAMAGED",
        },
        migrationPorts
      );

      // Mark new sticker activated in lifecycle
      await client.execute(
        `UPDATE qr_stickers SET status = 'ACTIVATED', activated_at = datetime('now') WHERE id = 'qr_printed_002'`
      );

      // 1. INVARIANT: Old QR is NEVER deleted!
      const oldQrRow = await client.queryFirst<{ id: string; status: string; replaced_by_qr_id: string }>(
        `SELECT id, status, replaced_by_qr_id FROM qr_stickers WHERE id = 'qr_active_001'`
      );
      expect(oldQrRow).toBeDefined();
      expect(oldQrRow?.status).toBe("REPLACED");
      expect(oldQrRow?.replaced_by_qr_id).toBe("qr_printed_002");

      // 2. INVARIANT: Historical old assignment is preserved!
      const historicalOldAssignment = await client.queryFirst<{
        id: string;
        ended_at: string | null;
        end_reason: string | null;
      }>(`SELECT id, ended_at, end_reason FROM qr_assignments WHERE qr_id = 'qr_active_001'`);
      expect(historicalOldAssignment?.ended_at).not.toBeNull();
      expect(historicalOldAssignment?.end_reason).toBe("REPLACED");

      // 3. INVARIANT: New assignment is CURRENT with assignment_type = 'REPLACEMENT'
      const newAssignment = await client.queryFirst<{
        id: string;
        qr_id: string;
        vehicle_id: string;
        assignment_type: string;
        ended_at: string | null;
      }>(`SELECT id, qr_id, vehicle_id, assignment_type, ended_at FROM qr_assignments WHERE qr_id = 'qr_printed_002'`);
      expect(newAssignment).toBeDefined();
      expect(newAssignment?.vehicle_id).toBe("veh_demo_car");
      expect(newAssignment?.assignment_type).toBe("REPLACEMENT");
      expect(newAssignment?.ended_at).toBeNull();

      // 4. INVARIANT: Immutable audit linkage in sticker_replacements
      const auditLink = await stickerReplacementRepo.findByRequestId(request.id);
      expect(auditLink?.oldQrStickerId).toBe("qr_active_001");
      expect(auditLink?.newQrStickerId).toBe("qr_printed_002");
      expect(auditLink?.vehicleId).toBe("veh_demo_car");

      // 5. INVARIANT: Old QR resolver returns safe REPLACED state without emergency contacts!
      const postResolveOld = await resolvePublicEmergencyProfile(client, "7F3K9021");
      expect(postResolveOld.state).toBe("REPLACED");
      expect(postResolveOld.profile).toBeUndefined(); // Zero emergency contacts exposed!

      // 6. INVARIANT: New QR resolves current emergency profile!
      const postResolveNew = await resolvePublicEmergencyProfile(client, "8M2P4510");
      expect(postResolveNew.state).toBe("ACTIVE");
      expect(postResolveNew.profile?.vehicleDisplay).toContain("Hyundai Creta");
      expect(postResolveNew.profile?.approvedEmergencyContacts.length).toBeGreaterThan(0);
    });
  });

  describe("Partial Replacement Failure Recovery", () => {
    it("aborts migration without corrupting state if vehicle mismatch is detected", async () => {
      await expect(
        executeAssignmentMigration(
          {
            replacementRequestId: "rpr_invalid_veh",
            oldQrStickerId: "qr_active_001",
            newQrStickerId: "qr_printed_002",
            vehicleId: "veh_unrelated_foreign_vehicle",
            userId: "usr_demo_101",
            reason: "DAMAGED",
          },
          migrationPorts
        )
      ).rejects.toThrow(/vehicle mismatch/);

      // Verify old assignment is STILL ACTIVE and was not closed prematurely
      const assignment = await migrationPorts.findActiveAssignmentByQr("qr_active_001");
      expect(assignment).not.toBeNull();
      expect(assignment?.vehicleId).toBe("veh_demo_car");

      // Verify no sticker replacement link was created
      const link = await stickerReplacementRepo.findByRequestId("rpr_invalid_veh");
      expect(link).toBeNull();
    });
  });
});

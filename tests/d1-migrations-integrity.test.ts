import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";

describe("D1 Migrations Schema Integrity (0001–0003)", () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");

    const cfMigrationsDir = path.resolve(__dirname, "../infrastructure/cloudflare/d1/migrations");
    const migrationsDir = fs.existsSync(cfMigrationsDir)
      ? cfMigrationsDir
      : path.resolve(__dirname, "../database/migrations");
    const files = ["0001_identity.sql", "0002_vehicle_emergency.sql", "0003_qr_inventory.sql"];

    for (const f of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, f), "utf8");
      db.exec(sql);
    }
  });

  it("enforces uniqueness of public_id on qr_stickers", () => {
    db.exec(`
      INSERT INTO qr_batches (id, reference_code, quantity, status) 
      VALUES ('qrb_1', 'BAT-001', 10, 'PRINTED');
    `);

    db.exec(`
      INSERT INTO qr_stickers (id, public_id, visible_code, batch_id, status)
      VALUES ('qr_1', '7F3K9021', 'VS-7F3K-9021', 'qrb_1', 'PRINTED');
    `);

    // Attempt duplicate public_id
    expect(() => {
      db.exec(`
        INSERT INTO qr_stickers (id, public_id, visible_code, batch_id, status)
        VALUES ('qr_2', '7F3K9021', 'VS-8888-8888', 'qrb_1', 'PRINTED');
      `);
    }).toThrow(/UNIQUE constraint failed/);
  });

  it("enforces uniqueness of visible_code on qr_stickers", () => {
    db.exec(`
      INSERT INTO qr_batches (id, reference_code, quantity, status) 
      VALUES ('qrb_1', 'BAT-001', 10, 'PRINTED');
    `);

    db.exec(`
      INSERT INTO qr_stickers (id, public_id, visible_code, batch_id, status)
      VALUES ('qr_1', 'PUB001', 'VS-SAME-CODE', 'qrb_1', 'PRINTED');
    `);

    // Attempt duplicate visible_code
    expect(() => {
      db.exec(`
        INSERT INTO qr_stickers (id, public_id, visible_code, batch_id, status)
        VALUES ('qr_2', 'PUB002', 'VS-SAME-CODE', 'qrb_1', 'PRINTED');
      `);
    }).toThrow(/UNIQUE constraint failed/);
  });

  it("enforces foreign key rejection on missing batch", () => {
    expect(() => {
      db.exec(`
        INSERT INTO qr_stickers (id, public_id, visible_code, batch_id, status)
        VALUES ('qr_x', 'PUBX', 'VS-PUBX', 'nonexistent_batch', 'PRINTED');
      `);
    }).toThrow(/FOREIGN KEY constraint failed/);
  });

  it("supports account linking: multiple auth identities linked to single user", () => {
    db.exec(`
      INSERT INTO users (id, primary_phone, primary_email, full_name)
      VALUES ('usr_1', '+919876543210', 'user1@example.com', 'Test User');
    `);

    db.exec(`
      INSERT INTO auth_identities (id, user_id, provider, provider_subject, normalized_identifier)
      VALUES 
      ('aid_phone', 'usr_1', 'PHONE', '+919876543210', '+919876543210'),
      ('aid_google', 'usr_1', 'GOOGLE', 'google_sub_123456', 'user1@example.com');
    `);

    const identities = db.prepare("SELECT * FROM auth_identities WHERE user_id = ?").all("usr_1");
    expect(identities).toHaveLength(2);

    // Duplicate provider + provider_subject must fail
    expect(() => {
      db.exec(`
        INSERT INTO auth_identities (id, user_id, provider, provider_subject)
        VALUES ('aid_dup', 'usr_1', 'GOOGLE', 'google_sub_123456');
      `);
    }).toThrow(/UNIQUE constraint failed/);
  });

  it("enforces one-current-assignment invariant per QR sticker via partial unique index", () => {
    // Setup user, vehicle, batch, and sticker
    db.exec(`
      INSERT INTO users (id) VALUES ('usr_1');
      INSERT INTO vehicles (id, user_id, registration_number, registration_number_normalized, make, model)
      VALUES ('veh_1', 'usr_1', 'MH12AB1234', 'MH12AB1234', 'Tata', 'Nexon'),
             ('veh_2', 'usr_1', 'MH14CD5678', 'MH14CD5678', 'Maruti', 'Swift');
      INSERT INTO qr_batches (id, reference_code, quantity) VALUES ('qrb_1', 'BAT-01', 10);
      INSERT INTO qr_stickers (id, public_id, visible_code, batch_id) VALUES ('qr_1', 'PUB1', 'VS-1', 'qrb_1');
    `);

    // First active assignment (ended_at is NULL)
    db.exec(`
      INSERT INTO qr_assignments (id, qr_id, vehicle_id, user_id, assignment_type, assigned_at, ended_at)
      VALUES ('qra_1', 'qr_1', 'veh_1', 'usr_1', 'INITIAL', datetime('now'), NULL);
    `);

    // Second active assignment for the SAME QR must be rejected by partial unique index!
    expect(() => {
      db.exec(`
        INSERT INTO qr_assignments (id, qr_id, vehicle_id, user_id, assignment_type, assigned_at, ended_at)
        VALUES ('qra_2', 'qr_1', 'veh_2', 'usr_1', 'INITIAL', datetime('now'), NULL);
      `);
    }).toThrow(/UNIQUE constraint failed/);

    // Closing the first assignment (setting ended_at) allows a new active assignment
    db.exec(`UPDATE qr_assignments SET ended_at = datetime('now'), end_reason = 'TRANSFERRED' WHERE id = 'qra_1';`);

    expect(() => {
      db.exec(`
        INSERT INTO qr_assignments (id, qr_id, vehicle_id, user_id, assignment_type, assigned_at, ended_at)
        VALUES ('qra_2', 'qr_1', 'veh_2', 'usr_1', 'TRANSFER', datetime('now'), NULL);
      `);
    }).not.toThrow();
  });

  it("enforces one-current-assignment invariant per vehicle via partial unique index", () => {
    db.exec(`
      INSERT INTO users (id) VALUES ('usr_1');
      INSERT INTO vehicles (id, user_id, registration_number, registration_number_normalized, make, model)
      VALUES ('veh_1', 'usr_1', 'MH12AB1234', 'MH12AB1234', 'Tata', 'Nexon');
      INSERT INTO qr_batches (id, reference_code, quantity) VALUES ('qrb_1', 'BAT-01', 10);
      INSERT INTO qr_stickers (id, public_id, visible_code, batch_id) 
      VALUES ('qr_1', 'PUB1', 'VS-1', 'qrb_1'),
             ('qr_2', 'PUB2', 'VS-2', 'qrb_1');
    `);

    // Assign qr_1 to veh_1
    db.exec(`
      INSERT INTO qr_assignments (id, qr_id, vehicle_id, user_id, ended_at)
      VALUES ('qra_1', 'qr_1', 'veh_1', 'usr_1', NULL);
    `);

    // Assigning a second sticker (qr_2) to veh_1 while veh_1 already has an active sticker must FAIL!
    expect(() => {
      db.exec(`
        INSERT INTO qr_assignments (id, qr_id, vehicle_id, user_id, ended_at)
        VALUES ('qra_2', 'qr_2', 'veh_1', 'usr_1', NULL);
      `);
    }).toThrow(/UNIQUE constraint failed/);
  });

  it("enforces CHECK constraints on QR lifecycle status and contact priority", () => {
    db.exec(`
      INSERT INTO qr_batches (id, reference_code, quantity) VALUES ('qrb_1', 'BAT-01', 10);
    `);

    // Invalid QR status
    expect(() => {
      db.exec(`
        INSERT INTO qr_stickers (id, public_id, visible_code, batch_id, status)
        VALUES ('qr_bad', 'PUB_BAD', 'VS-BAD', 'qrb_1', 'NONEXISTENT_STATE');
      `);
    }).toThrow(/CHECK constraint failed/);

    // Invalid contact priority (< 1 or > 5)
    db.exec(`
      INSERT INTO users (id) VALUES ('usr_1');
      INSERT INTO vehicles (id, user_id, registration_number, registration_number_normalized, make, model)
      VALUES ('veh_1', 'usr_1', 'MH12AB1234', 'MH12AB1234', 'Tata', 'Nexon');
      INSERT INTO emergency_profiles (id, vehicle_id) VALUES ('emp_1', 'veh_1');
    `);

    expect(() => {
      db.exec(`
        INSERT INTO emergency_contacts (id, emergency_profile_id, name, relationship_label, phone, priority)
        VALUES ('emc_bad', 'emp_1', 'Bad Contact', 'Friend', '+919999999999', 10);
      `);
    }).toThrow(/CHECK constraint failed/);
  });
});

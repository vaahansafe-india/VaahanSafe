/**
 * Controlled QR Assignment Migration Service
 *
 * Atomically transitions vehicle emergency identity from a damaged/lost physical QR
 * to an eligible replacement sticker.
 *
 * INVARIANTS:
 * 1. Old QR is NEVER deleted.
 * 2. Historical assignments are preserved (old assignment ended with end_reason = 'REPLACED').
 * 3. Old public ID resolver safely returns REPLACED status with zero stale emergency contacts.
 * 4. Old-to-new linkage is immutably recorded in sticker_replacements.
 * 5. Idempotent: Processing the same replacement twice does not duplicate new assignments.
 */

export interface StickerReplacementLink {
  id: string;
  replacementRequestId: string;
  oldQrStickerId: string;
  newQrStickerId: string;
  vehicleId: string;
  reason: string;
  migratedAt: string;
  createdAt: string;
}

export interface AssignmentMigrationPorts {
  findActiveAssignmentByQr: (qrId: string) => Promise<{ id: string; vehicleId: string; userId: string } | null>;
  closeAssignment: (assignmentId: string, endReason: string, endedAt: string) => Promise<void>;
  createAssignment: (assignment: {
    id?: string;
    qrId: string;
    vehicleId: string;
    userId: string;
    assignmentType: "REPLACEMENT";
    assignedAt: string;
  }) => Promise<void>;
  updateQrSticker: (qrId: string, updates: { status?: string; replacedByQrId?: string }) => Promise<void>;
  saveStickerReplacementLink: (link: StickerReplacementLink) => Promise<void>;
  findStickerReplacementByRequestId: (requestId: string) => Promise<StickerReplacementLink | null>;
  recordStatusHistory: (entry: {
    qrId: string;
    fromStatus: string;
    toStatus: string;
    reasonCode: string;
    actorType: "SYSTEM" | "USER" | "ADMIN";
    actorId?: string;
    metadataJson?: string;
  }) => Promise<void>;
}

export interface ExecuteMigrationInput {
  replacementRequestId: string;
  oldQrStickerId: string;
  newQrStickerId: string;
  vehicleId: string;
  userId: string;
  reason: string;
  actorId?: string;
}

export async function executeAssignmentMigration(
  input: ExecuteMigrationInput,
  ports: AssignmentMigrationPorts
): Promise<StickerReplacementLink> {
  // 1. Idempotency check: has this replacement request already been migrated?
  const existingLink = await ports.findStickerReplacementByRequestId(input.replacementRequestId);
  if (existingLink) {
    return existingLink;
  }

  // 2. Locate active assignment for the old QR
  const oldAssignment = await ports.findActiveAssignmentByQr(input.oldQrStickerId);
  if (!oldAssignment) {
    throw new Error(
      `Cannot migrate: Old QR "${input.oldQrStickerId}" has no active vehicle assignment`
    );
  }

  if (oldAssignment.vehicleId !== input.vehicleId) {
    throw new Error(
      `Cannot migrate: Old assignment vehicle mismatch (expected "${input.vehicleId}", found "${oldAssignment.vehicleId}")`
    );
  }

  const now = new Date().toISOString();

  // 3. Close the old assignment with end_reason = 'REPLACED'
  await ports.closeAssignment(oldAssignment.id, "REPLACED", now);

  // 4. Create new replacement assignment
  await ports.createAssignment({
    qrId: input.newQrStickerId,
    vehicleId: input.vehicleId,
    userId: input.userId,
    assignmentType: "REPLACEMENT",
    assignedAt: now,
  });

  // 5. Update old QR sticker status to REPLACED (or LOST_DAMAGED if reason is LOST)
  // and link replaced_by_qr_id to the new sticker
  const oldTargetStatus = input.reason === "LOST" ? "LOST_DAMAGED" : "REPLACED";
  await ports.updateQrSticker(input.oldQrStickerId, {
    status: oldTargetStatus,
    replacedByQrId: input.newQrStickerId,
  });

  // 6. Record immutable old -> new audit link
  const link: StickerReplacementLink = {
    id: `srep_${crypto.randomUUID()}`,
    replacementRequestId: input.replacementRequestId,
    oldQrStickerId: input.oldQrStickerId,
    newQrStickerId: input.newQrStickerId,
    vehicleId: input.vehicleId,
    reason: input.reason,
    migratedAt: now,
    createdAt: now,
  };
  await ports.saveStickerReplacementLink(link);

  // 7. Append audit entries to qr_status_history
  await ports.recordStatusHistory({
    qrId: input.oldQrStickerId,
    fromStatus: "ACTIVATED",
    toStatus: oldTargetStatus,
    reasonCode: "REPLACED_BY_NEW_STICKER",
    actorType: "SYSTEM",
    actorId: input.actorId,
    metadataJson: JSON.stringify({
      newQrId: input.newQrStickerId,
      replacementRequestId: input.replacementRequestId,
    }),
  });

  await ports.recordStatusHistory({
    qrId: input.newQrStickerId,
    fromStatus: "PRINTED",
    toStatus: "PRINTED",
    reasonCode: "ALLOCATED_FOR_REPLACEMENT",
    actorType: "SYSTEM",
    actorId: input.actorId,
    metadataJson: JSON.stringify({
      oldQrId: input.oldQrStickerId,
      replacementRequestId: input.replacementRequestId,
    }),
  });

  return link;
}

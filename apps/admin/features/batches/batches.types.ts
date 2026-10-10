export type BatchChannel = "ONLINE_SYSTEM" | "OFFLINE_RETAIL";

export type BatchStatus =
  | "DRAFT"
  | "GENERATING"
  | "GENERATED"
  | "VALIDATED"
  | "PRINT_READY"
  | "PRINTED"
  | "RECEIVED"
  | "CLOSED"
  | "FAILED"
  | "QUARANTINED"
  | "VOIDED";

export interface BatchItem {
  id: string;
  reference: string;
  channel: BatchChannel;
  quantity: number;
  status: BatchStatus;
  manufacturerName: string | null;
  createdAt: string;
  updatedAt: string;
  generatedAt: string | null;
  printedAt: string | null;
  notes: string | null;
  createdBy: string | null;
  creatorEmail: string | null;
  generatedCount: number;
  validatedCount: number;
  printedCount: number;
  activationExportId?: string | null;
}

export interface BatchSummary {
  totalBatches: number;
  totalIdentities: number;
  draft: number;
  generating: number;
  printReady: number;
  printed: number;
  attention: number;
}

export interface BatchFilters {
  q: string;
  statuses: string[];
  channels: string[];
  print: "any" | "printed" | "not_printed" | "print_ready";
  sort:
    | "newest"
    | "oldest"
    | "quantity_desc"
    | "quantity_asc"
    | "recently_printed";
  from: string;
  to: string;
}

export interface BatchPage {
  rows: BatchItem[];
  nextCursor: string | null;
  totalMatching: number;
}

export interface CreateBatchInput {
  reference: string;
  channel: BatchChannel;
  quantity: number;
  manufacturerName?: string;
  notes?: string;
}

export interface BatchStickerSample {
  id: string;
  publicId: string;
  visibleCode: string;
  status: string;
  lifecycleState: string;
  hasSecret: boolean;
  createdAt: string;
}

export interface BatchDetail {
  batch: BatchItem;
  stickersSample: BatchStickerSample[];
  activationExport: {
    id: string;
    codeCount: number;
    createdAt: string;
    objectKey: string;
    ciphertextSha256: string;
  } | null;
  auditLogs: {
    id: string;
    action: string;
    reason: string;
    createdAt: string;
    actorEmail: string | null;
    afterSummary?: Record<string, unknown>;
  }[];
  printJobs: {
    id: string;
    reference: string;
    status: string;
    mode: string;
    quantity: number;
    createdAt: string;
  }[];
  allowedNextActions: string[];
  canGenerate: boolean;
  canValidate: boolean;
  canApprovePrint: boolean;
  canMarkPrinted: boolean;
  canReceive: boolean;
  canVoid: boolean;
}

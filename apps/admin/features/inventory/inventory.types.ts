export interface InventoryFilters {
  q: string;
  statuses: string[];
  lifecycles: string[];
  batch: string;
  channel: string;
  print: string;
  activation: string;
  custody: string;
  from: string;
  to: string;
  risk: string;
  sort: "newest" | "oldest";
}
export interface InventoryCursor {
  createdAt: string;
  id: string;
}
export interface InventoryRow {
  id: string;
  publicId: string;
  visibleCode: string;
  batchId: string | null;
  batchReference: string | null;
  channel: string | null;
  status: string;
  lifecycle: string;
  createdAt: string;
  activatedAt: string | null;
  printState: "RECORDED" | "UNRECORDED";
  printedAt: string | null;
  custodian: string | null;
  failedAttempts: number;
  replacementLinked: boolean;
}
export interface InventoryFacets {
  total: number;
  available: number;
  activated: number;
  blocked: number;
  replaced: number;
  statuses: { value: string; count: number }[];
  batches: { id: string; reference: string; count: number }[];
}
export interface InventoryPage {
  rows: InventoryRow[];
  nextCursor: string | null;
}
export type InventorySelection =
  | { mode: "ids"; ids: string[] }
  | { mode: "all"; token: string; count: number; excluded: string[] };
export interface StickerTemplate {
  version: string;
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  safeMm: number;
  qr: { x: number; y: number; size: number };
  scratch: { x: number; y: number; width: number; height: number };
  layout: "SINGLE";
}
export interface PrintJob {
  id: string;
  reference: string;
  mode: "PRINT" | "REPRINT";
  status: string;
  quantity: number;
  createdAt: string;
  expiresAt: string;
  reason: string;
}
export interface InventoryDetail {
  row: InventoryRow;
  template: StickerTemplate;
  history: {
    id: string;
    from: string | null;
    to: string;
    reason: string;
    at: string;
  }[];
  attempts: { outcome: string; count: number }[];
  scans: { total: number; lastAt: string | null; last24h: number };
  audit: {
    id: string;
    action: string;
    reason: string;
    at: string;
    scope: string;
  }[];
  prints: PrintJob[];
  activeAssignment: boolean;
  replacement: string | null;
  eligibility: { print: boolean; reprint: boolean; reason: string | null };
  safeSvg: string;
}

export type MaintenanceState =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface MaintenanceEntity {
  id: string;
  publicId: string;
  slug: string;
  title: string;
  description: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string | null;
  actualEnd?: string | null;
  state: MaintenanceState;
  affectedServiceSlugs: string[];
  createdAt: string;
  updatedAt: string;
}

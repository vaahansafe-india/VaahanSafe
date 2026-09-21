/**
 * Editorial Placement Domain Model
 *
 * Placements define semantic editorial slots on the Journal landing page:
 * HERO, LEAD, SECONDARY, PRIVACY_SPOTLIGHT, GUIDE_FEATURE, DARK_CHAPTER, LATEST_INDEX.
 */

export type EditorialPlacementSlot =
  | "HERO"
  | "LEAD"
  | "SECONDARY"
  | "PRIVACY_SPOTLIGHT"
  | "GUIDE_FEATURE"
  | "DARK_CHAPTER"
  | "LATEST_INDEX";

export interface EditorialPlacement {
  id: string;
  slot: EditorialPlacementSlot;
  articleId: string;
  priority: number;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
  updatedAt: string;
}

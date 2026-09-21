/**
 * Sticker Replacement Audit Repository Port
 */

import { StickerReplacementLink } from "../replacements/migration";

export interface StickerReplacementRepository {
  findById(id: string): Promise<StickerReplacementLink | null>;
  findByRequestId(requestId: string): Promise<StickerReplacementLink | null>;
  findByOldQrId(oldQrStickerId: string): Promise<StickerReplacementLink | null>;
  findByNewQrId(newQrStickerId: string): Promise<StickerReplacementLink | null>;
  save(link: StickerReplacementLink): Promise<void>;
}

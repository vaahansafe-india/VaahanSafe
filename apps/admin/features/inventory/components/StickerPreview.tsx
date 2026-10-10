import type { InventoryDetail } from "../inventory.types";
export function StickerPreview({
  detail,
  actualSize = false,
  compact = false,
}: {
  detail: InventoryDetail;
  actualSize?: boolean;
  compact?: boolean;
}) {
  const t = detail.template;
  return (
    <section className="inventory-sticker-spec">
      <div
        className={`inventory-sticker-stage ${actualSize ? "actual-size" : ""}`}
      >
        <div
          className="inventory-sticker-svg"
          dangerouslySetInnerHTML={{ __html: detail.safeSvg }}
        />
      </div>
      <p className="inventory-muted">
        Activation code concealed. Preview shows the scratch coating.
      </p>
      {compact && (
        <div className="record-sticker-caption">
          <span>
            {t.widthMm} × {t.heightMm} mm trim
          </span>
          <span>Single sticker</span>
          <span>Vector QR</span>
        </div>
      )}
      <details className="record-spec-details" open={!compact}>
        <summary>Manufacturing dimensions</summary>
        <dl className="inventory-spec-grid">
          <div>
            <dt>Trimmed sticker</dt>
            <dd>
              {t.widthMm} × {t.heightMm} mm
            </dd>
          </div>
          <div>
            <dt>Print layout</dt>
            <dd>Single sticker · 100%</dd>
          </div>
          <div>
            <dt>QR including quiet zone</dt>
            <dd>
              {t.qr.size} × {t.qr.size} mm
            </dd>
          </div>
          <div>
            <dt>QR position</dt>
            <dd>
              x {t.qr.x}, y {t.qr.y} mm
            </dd>
          </div>
          <div>
            <dt>Scratch area</dt>
            <dd>
              {t.scratch.width} × {t.scratch.height} mm
            </dd>
          </div>
          <div>
            <dt>Scratch position</dt>
            <dd>
              x {t.scratch.x}, y {t.scratch.y} mm
            </dd>
          </div>
          <div>
            <dt>Bleed / safe inset</dt>
            <dd>
              {t.bleedMm} / {t.safeMm} mm
            </dd>
          </div>
          <div>
            <dt>PDF artwork</dt>
            <dd>
              {t.widthMm + 2 * t.bleedMm} × {t.heightMm + 2 * t.bleedMm} mm
            </dd>
          </div>
        </dl>
        <small className="inventory-muted">
          {t.version} · Positions measured from the top-left of the trimmed
          sticker. Screen scale depends on your display.
        </small>
      </details>
    </section>
  );
}

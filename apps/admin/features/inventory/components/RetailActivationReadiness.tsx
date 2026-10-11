import Link from "next/link";
import type { InventoryDetail } from "../inventory.types";
import "../retail-readiness.css";

export function RetailActivationReadiness({
  detail,
}: {
  detail: InventoryDetail;
}) {
  const r = detail.row,
    printing = detail.prints.find((j) => j.status === "PRINTING"),
    completed = detail.prints.find((j) => j.mode === "PRINT" && j.status === "COMPLETED");
  if (
    r.channel !== "OFFLINE_RETAIL" ||
    r.activatedAt ||
    ![
      "INVENTORY",
      "PRINTED",
      "WITH_DISTRIBUTOR",
      "WITH_RETAILER",
      "SOLD",
    ].includes(r.status)
  )
    return null;
  return (
    <section id="retail-readiness" className="inventory-retail-readiness">
      <h3>Retail activation readiness</h3>
      <p>
        {r.status === "SOLD"
          ? "The retail sale is recorded. The customer must still verify the private activation code, their account and their vehicle before services are enabled."
          : r.status === "WITH_RETAILER"
            ? "The retailer has received this sticker. Record its completed retail sale before the customer can verify and activate it."
            : r.status === "WITH_DISTRIBUTOR" ? "The distributor holds this sticker. Transfer it to its verified retailer and record acknowledged receipt, then record the retail sale."
            : detail.stockRelease?.transferReady ? "This printed sticker is ready for distribution. Record Central inventory → Distributor, then Distributor → Retailer, followed by the retail sale."
            : "Printing alone does not make this sticker eligible for activation. Open its completed print job and release the verified stickers, then record distributor and retailer receipt followed by the retail sale."}
      </p>
      <div className="admin-actions">
        {r.printState === "UNRECORDED" && printing && (
          <Link
            className="admin-button"
            href={`/inventory/print-jobs/${printing.id}`}
          >
            Confirm physical printing
          </Link>
        )}
        {r.status !== "SOLD" && r.status !== "WITH_RETAILER" && (
          <>
            {r.status === "PRINTED" && !detail.stockRelease?.transferReady && completed && <Link className="admin-button primary" href={`/inventory/print-jobs/${completed.id}`}>Release verified printed stock</Link>}
            {r.batchReference && (
              <Link
                className="admin-button"
                href={`/batches?q=${encodeURIComponent(r.batchReference)}`}
              >
                Review batch readiness
              </Link>
            )}
            <Link className="admin-button" href="/transfers">
              Review stock transfers
            </Link>
          </>
        )}
        {r.status === "WITH_RETAILER" && (
          <Link className="admin-button" href="/retailers">
            Record retail sale
          </Link>
        )}
      </div>
    </section>
  );
}

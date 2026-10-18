import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getCustomerReplacement } from "@/lib/replacement-service";
import { ReplacementActivation } from "./ReplacementActivation";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await getAuthenticatedCustomer();
  if (!auth) redirect("/login");
  if (!auth.phoneVerified) redirect("/onboarding/phone");
  const { id } = await params;
  let r;
  try {
    r = await getCustomerReplacement(auth.session.id, id);
  } catch {
    return (
      <main className="mx-auto max-w-2xl space-y-5 p-6">
        <h1 className="font-serif text-3xl">Replacement unavailable</h1>
        <p>We couldn’t load this request right now. Please try again.</p>
        <Link href="/qr/replace">Back to replacements</Link>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Link href="/qr/replace" className="text-sm text-muted-foreground">
        ← Replacements
      </Link>
      <header>
        <p className="font-mono text-xs text-muted-foreground">{r.reference}</p>
        <h1 className="mt-3 font-serif text-3xl">Your replacement QR</h1>
        <p className="mt-3 text-muted-foreground">
          {r.vehicle} · {r.oldCode} → {r.newCode || "Awaiting allocation"}
        </p>
      </header>
      <div className="space-y-4 rounded-xl border border-border bg-card p-6">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <dt>Request</dt>
          <dd>{r.status.replaceAll("_", " ")}</dd>
          <dt>Payment</dt>
          <dd>{r.payment || "Paid replacement order required"}</dd>
          <dt>Order</dt>
          <dd>{r.orderNumber || "Not allocated"}</dd>
          <dt>Shipment</dt>
          <dd>{r.shipment?.replaceAll("_", " ") || "Not dispatched"}</dd>
        </dl>
        {!r.payment &&
          !["REJECTED", "CANCELLED", "COMPLETED"].includes(r.status) && (
            <Link
              href={`/orders/new?product=PROD_QR_REPLACEMENT&vehicle=${encodeURIComponent(r.vehicleId)}`}
              className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm text-primary-foreground"
            >
              Purchase replacement kit
            </Link>
          )}
      </div>
      {r.activatedAt ? (
        <div className="rounded-xl border border-border p-6">
          <h2 className="font-serif text-2xl">Replacement activated</h2>
          <p className="mt-3 text-muted-foreground">
            Your replacement is connected to the existing vehicle and safety
            profile. The original QR remains retired.
          </p>
          <Link href="/qr" className="mt-4 inline-flex text-primary">
            Open my QR →
          </Link>
        </div>
      ) : r.canActivate ? (
        <ReplacementActivation id={r.id} />
      ) : (
        <div className="rounded-xl border border-border p-6">
          <h2 className="font-serif text-2xl">
            {["REJECTED", "CANCELLED"].includes(r.status)
              ? "Request closed"
              : "Waiting for the next step"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Replacement activation requires an approved request, verified
            payment, original QR retirement and carrier-confirmed delivery. We
            preserve your vehicle profile and history during this transition.
          </p>
        </div>
      )}
    </main>
  );
}

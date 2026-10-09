import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import { NewOrderCheckout, type SavedAddress } from "./NewOrderCheckout";

export const metadata: Metadata = {
  title: "Checkout — Order QR Kit — VaahanSafe",
  description:
    "Complete your order for genuine VaahanSafe physical QR safety kits.",
};

interface NewOrderPageProps {
  searchParams: Promise<{
    product?: string;
    vehicle?: string;
  }>;
}

export default async function NewOrderPage({
  searchParams,
}: NewOrderPageProps) {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    redirect("/login");
  }

  const { product: productCodeParam, vehicle: vehicleIdParam } =
    await searchParams;
  const db = getAuthoritativeDatabaseClient();

  // Resolve the requested kit and its current price from the authoritative catalog.
  const targetCode = productCodeParam || "PROD_QR_STICKER_INDIVIDUAL";
  const products = await db.query<{
    id: string;
    code: string;
    name: string;
    description: string;
    price_minor: number;
    currency: string;
  }>(
    `SELECT id, code, name, description, price_minor, currency
     FROM products
     WHERE (code = ? OR id = ?) AND product_type = 'PHYSICAL_QR_STICKER' AND status = 'ACTIVE'
     LIMIT 1`,
    [targetCode, targetCode],
  );

  const productRow = products[0];
  if (
    !productRow ||
    !Number.isSafeInteger(productRow.price_minor) ||
    productRow.price_minor <= 0 ||
    productRow.currency !== "INR"
  ) {
    return (
      <main className="mx-auto max-w-xl px-4 py-12">
        <section className="space-y-4 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            QR kit checkout
          </p>
          <h1 className="font-serif text-2xl text-foreground">
            This kit is temporarily unavailable
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We couldn’t load this kit’s current price. Please try again shortly
            or choose another kit.
          </p>
          <Link
            href="/qr/buy"
            className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Back to QR kits
          </Link>
        </section>
      </main>
    );
  }

  const product = {
    id: productRow.id,
    code: productRow.code,
    name: productRow.name,
    description: productRow.description,
    priceMinor: productRow.price_minor,
    priceFormatted: new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: productRow.price_minor % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(productRow.price_minor / 100),
    currency: productRow.currency,
  };

  // 2. Fetch Vehicle details if parameter is passed
  let vehicleData: {
    id: string;
    plate: string;
    maskedPlate: string;
    make: string;
    model: string;
    type: string;
  } | null = null;

  if (vehicleIdParam) {
    const vehicles = await db.query<{
      id: string;
      registration_number: string;
      make: string;
      model: string;
      vehicle_type: string;
    }>(
      `SELECT id, registration_number, make, model, vehicle_type
       FROM vehicles
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [vehicleIdParam, auth.user.id],
    );

    const v = vehicles[0];
    if (v) {
      const reg = v.registration_number;
      const masked =
        reg.length > 4 ? `${reg.slice(0, 4)}••••${reg.slice(-2)}` : reg;
      vehicleData = {
        id: v.id,
        plate: reg,
        maskedPlate: masked,
        make: v.make,
        model: v.model,
        type: v.vehicle_type,
      };
    }
  }

  // 3. Fetch User's Saved Addresses from D1
  const savedAddresses = await db.query<SavedAddress>(
    `SELECT id, recipient_name, phone, line1, line2, city, state, postal_code, is_default
     FROM addresses
     WHERE user_id = ?
     ORDER BY is_default DESC, created_at DESC`,
    [auth.user.id],
  );

  return (
    <NewOrderCheckout
      product={product}
      vehicle={vehicleData}
      savedAddresses={savedAddresses}
      defaultContact={{
        name: auth.user.name || "",
        phone: auth.user.phone || "",
        email: auth.user.email || undefined,
      }}
    />
  );
}

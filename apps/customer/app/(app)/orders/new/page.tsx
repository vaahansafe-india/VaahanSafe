import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import { NewOrderCheckout, type SavedAddress } from "./NewOrderCheckout";

export const metadata: Metadata = {
  title: "Checkout — Order QR Kit — VaahanSafe",
  description: "Complete your order for genuine VaahanSafe physical QR safety kits.",
};

interface NewOrderPageProps {
  searchParams: Promise<{
    product?: string;
    vehicle?: string;
  }>;
}

export default async function NewOrderPage({ searchParams }: NewOrderPageProps) {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    redirect("/login");
  }

  const { product: productCodeParam, vehicle: vehicleIdParam } = await searchParams;
  const db = getAuthoritativeDatabaseClient();

  // 1. Fetch Product from D1
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
     WHERE (code = ? OR product_type = 'PHYSICAL_QR_STICKER') AND status = 'ACTIVE'
     LIMIT 1`,
    [targetCode]
  );

  const productRow = products[0] || {
    id: "prod_qr_sticker_kit",
    code: "PROD_QR_STICKER_INDIVIDUAL",
    name: "VaahanSafe Automotive Safety Kit",
    description: "2x UV-Laminated Weatherproof Physical QR Stickers with Cryptographic Safety Routing.",
    price_minor: 49900,
    currency: "INR",
  };

  const product = {
    id: productRow.id,
    code: productRow.code,
    name: productRow.name,
    description: productRow.description,
    priceMinor: productRow.price_minor,
    priceFormatted: `₹${(productRow.price_minor / 100).toFixed(0)}`,
    currency: productRow.currency || "INR",
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
      [vehicleIdParam, auth.user.id]
    );

    const v = vehicles[0];
    if (v) {
      const reg = v.registration_number;
      const masked = reg.length > 4 ? `${reg.slice(0, 4)}••••${reg.slice(-2)}` : reg;
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
    [auth.user.id]
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

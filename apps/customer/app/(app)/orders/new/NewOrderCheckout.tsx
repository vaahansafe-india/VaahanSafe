"use client";

import * as React from "react";
import Script from "next/script";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  Lock,
  Sparkles,
  MapPin,
  Building,
  Plus,
  AlertCircle,
  Car,
} from "lucide-react";
import { createOrderAndCashfreeSession } from "./actions";

declare global {
  interface Window {
    Cashfree?: (config: { mode: "sandbox" | "production" }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: "_self" | "_blank" | "_top";
      }) => Promise<unknown>;
    };
  }
}

export interface SavedAddress {
  id: string;
  recipient_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  is_default: number;
}

export interface NewOrderCheckoutProps {
  product: {
    id: string;
    code: string;
    name: string;
    description: string;
    priceMinor: number;
    priceFormatted: string;
    currency: string;
  };
  vehicle?: {
    id: string;
    plate: string;
    maskedPlate: string;
    make: string;
    model: string;
    type: string;
  } | null;
  savedAddresses: SavedAddress[];
  defaultContact: {
    name: string;
    phone: string;
    email?: string;
  };
}

export function NewOrderCheckout({
  product,
  vehicle,
  savedAddresses,
  defaultContact,
}: NewOrderCheckoutProps) {
  const [useExistingAddress, setUseExistingAddress] = React.useState<boolean>(
    savedAddresses.length > 0
  );
  const [selectedAddressId, setSelectedAddressId] = React.useState<string>(
    savedAddresses[0]?.id || ""
  );

  // New Address form state
  const [recipientName, setRecipientName] = React.useState(defaultContact.name || "");
  const [phone, setPhone] = React.useState(defaultContact.phone || "");
  const [line1, setLine1] = React.useState("");
  const [line2, setLine2] = React.useState("");
  const [landmark, setLandmark] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [postalCode, setPostalCode] = React.useState("");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const addressInput = useExistingAddress && selectedAddressId
        ? { addressId: selectedAddressId }
        : {
            recipientName,
            phone,
            line1,
            line2,
            landmark,
            city,
            state,
            postalCode,
          };

      const res = await createOrderAndCashfreeSession(
        product.code,
        vehicle?.id || null,
        addressInput
      );

      if (!res.success || !res.paymentSessionId) {
        setErrorMessage(res.error || "Unable to initiate payment session. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Check if Cashfree SDK is available
      if (typeof window.Cashfree === "function") {
        const cashfree = window.Cashfree({
          mode: res.cashfreeMode || "sandbox",
        });

        // Launch authoritative Cashfree hosted checkout
        await cashfree.checkout({
          paymentSessionId: res.paymentSessionId,
          redirectTarget: "_self",
        });
      } else {
        // Fallback redirection to status check if script failed to load
        window.location.href = `/orders/checkout-status?order_id=${res.orderId}`;
      }
    } catch (err: any) {
      console.error("Payment initiation error:", err);
      setErrorMessage(
        "A connection issue occurred while loading Cashfree checkout. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Cashfree v3 Production & Sandbox SDK */}
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        strategy="afterInteractive"
      />

      <div className="space-y-8 pb-16">
        {/* Navigation Breadcrumb */}
        <Link
          href="/qr/buy"
          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-[#cc785c]"
        >
          <VaahanIcon name="arrow-left" size={13} aria-hidden="true" />
          <span>Back to Kit Selection</span>
        </Link>

        {/* Page Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
              FINAL CHECKOUT &bull; STEP 02
            </div>
            <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              Delivery & Payment
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              Provide your delivery address to dispatch your genuine UV-laminated QR kit. Payments are securely processed via Cashfree.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 font-mono text-xs">
            <Lock className="size-3.5 text-emerald-500" />
            <span className="text-muted-foreground">Cashfree Gateway:</span>
            <span className="font-bold text-foreground">256-Bit SSL</span>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left 7 Columns: Delivery Address Form */}
          <div className="space-y-6 lg:col-span-7">
            {/* Address Selection or Creation Card */}
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-[#cc785c]" />
                  <h2 className="font-serif text-lg font-medium text-foreground">
                    Shipping Address
                  </h2>
                </div>

                {savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUseExistingAddress(!useExistingAddress)}
                    className="font-mono text-xs font-semibold text-[#cc785c] hover:underline"
                  >
                    {useExistingAddress ? "+ Enter New Address" : "Select Saved Address"}
                  </button>
                )}
              </div>

              {useExistingAddress && savedAddresses.length > 0 ? (
                <div className="mt-4 space-y-3">
                  <div className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    Saved Addresses
                  </div>
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`cursor-pointer rounded-xl border p-4 transition-all ${
                          isSelected
                            ? "border-[#cc785c] bg-[#cc785c]/5 ring-1 ring-[#cc785c]"
                            : "border-border hover:border-border/80 bg-background"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 text-xs">
                            <div className="font-bold text-foreground flex items-center gap-2">
                              <span>{addr.recipient_name}</span>
                              <span className="font-mono font-normal text-muted-foreground">
                                &bull; {addr.phone}
                              </span>
                            </div>
                            <p className="text-muted-foreground">
                              {addr.line1}
                              {addr.line2 ? `, ${addr.line2}` : ""}
                            </p>
                            <p className="text-muted-foreground">
                              {addr.city}, {addr.state} — {addr.postal_code}
                            </p>
                          </div>
                          <div
                            className={`size-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? "border-[#cc785c] bg-[#cc785c] text-white"
                                : "border-border"
                            }`}
                          >
                            {isSelected && <div className="size-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        Recipient Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        Mobile Number (Courier SMS Updates) *
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="10-digit mobile number"
                        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      House / Flat / Building / Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={line1}
                      onChange={(e) => setLine1(e.target.value)}
                      placeholder="e.g. Flat 402, Royal Palms, Link Road"
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        Area / Sector / Locality
                      </label>
                      <input
                        type="text"
                        value={line2}
                        onChange={(e) => setLine2(e.target.value)}
                        placeholder="e.g. Bandra West"
                        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="e.g. Near HDFC Bank"
                        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Mumbai"
                        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="e.g. Maharashtra"
                        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        PIN Code *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="6-digit PIN"
                        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Courier Delivery Notice */}
            <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
              <Truck className="size-4 text-[#cc785c] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-foreground">Dispatched via India Post / Bluedart</span>:
                Tracking number will be sent via SMS and WhatsApp once dispatched. Expected arrival within 3 to 5 business days across India.
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Order Summary & Cashfree Payment Gate */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-6 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <h3 className="font-serif text-lg font-medium text-foreground">
                  Order Summary
                </h3>
                <span className="rounded-full bg-[#cc785c]/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#cc785c]">
                  GENUINE KIT
                </span>
              </div>

              {/* Product Info */}
              <div className="space-y-3">
                <div className="font-bold text-sm text-foreground">
                  {product.name}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {product.description}
                </p>

                {vehicle && (
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-border/80 bg-muted/30 px-3.5 py-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <Car className="size-4 text-[#cc785c]" />
                      <span className="text-muted-foreground">Linked Vehicle:</span>
                    </div>
                    <span className="font-mono font-bold text-foreground">
                      {vehicle.maskedPlate || vehicle.plate}
                    </span>
                  </div>
                )}
              </div>

              {/* Inclusions checklist */}
              <div className="border-t border-border pt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  <span>2x Weatherproof Automotive Stickers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  <span>Instant SMS & WhatsApp Emergency Relay</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  <span>Private Owner Voice Shield (Zero Number Exposure)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  <span>Digital QR Pass Unlocked Upon Payment</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-border pt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Kit Subtotal</span>
                  <span className="font-mono font-medium text-foreground">{product.priceFormatted}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Tracked Courier Delivery</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">FREE</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Applicable GST (18%)</span>
                  <span className="font-mono text-muted-foreground">Included</span>
                </div>
                <div className="border-t border-border pt-3 flex items-baseline justify-between">
                  <span className="font-serif text-base font-medium text-foreground">Total Payable</span>
                  <span className="font-mono text-2xl font-bold text-foreground">
                    {product.priceFormatted}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full h-12 items-center justify-center gap-2 rounded-xl bg-[#cc785c] font-mono text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[#b5654b] shadow-xs disabled:opacity-50"
              >
                <Sparkles className="size-4" />
                <span>{isSubmitting ? "Opening Cashfree Gateway..." : `Pay ${product.priceFormatted} with Cashfree`}</span>
              </button>

              <div className="space-y-2 text-center">
                <div className="font-mono text-[10px] text-muted-foreground flex items-center justify-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  <span>Powered by Cashfree Payments &bull; UPI, Cards, Netbanking</span>
                </div>
                <p className="text-[10px] text-muted-foreground/80">
                  By confirming, you agree to the VaahanSafe Hardware Fulfillment & Safety Terms.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

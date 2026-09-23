"use client";

import * as React from "react";
import Script from "next/script";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  Sparkles,
  MapPin,
  AlertCircle,
  Car,
  LocateFixed,
  Navigation,
  Loader2,
} from "lucide-react";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import {
  getIndianStates,
  getDistrictsForState,
  resolvePincodeData,
  reverseGeocodeLocation,
} from "@/lib/india-states-districts";
import { createOrderAndPaymentSession } from "./actions";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      close: () => void;
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

  // Location detection & verification states
  const [isDetectingLocation, setIsDetectingLocation] = React.useState(false);
  const [isResolvingPin, setIsResolvingPin] = React.useState(false);
  const [detectionStatus, setDetectionStatus] = React.useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const allStates = React.useMemo(() => getIndianStates(), []);
  const districtOptions = React.useMemo(() => getDistrictsForState(state), [state]);

  const handleStateChange = (newState: string) => {
    setState(newState);
    // If current city is not in the new state's districts, reset it
    const newDistricts = getDistrictsForState(newState);
    if (city && !newDistricts.some((d) => d.toLowerCase() === city.toLowerCase())) {
      setCity("");
    }
  };

  const handlePostalCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPostalCode(clean);

    if (clean.length === 6) {
      setIsResolvingPin(true);
      try {
        const res = await resolvePincodeData(clean);
        if (res) {
          if (res.state) {
            setState(res.state);
          }
          if (res.district) {
            setCity(res.district);
          }
          if (res.landmark && !landmark) {
            setLandmark(res.landmark);
          }
          setDetectionStatus({
            type: "success",
            message: `PIN ${clean} verified: ${res.district ? `${res.district}, ` : ""}${res.state}${res.landmark ? ` • ${res.landmark}` : ""}`,
          });
        }
      } catch {
        // network/timeout error
      } finally {
        setIsResolvingPin(false);
      }
    }
  };

  const handleDetectLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setDetectionStatus({
        type: "error",
        message: "Geolocation is not supported by your browser. Please enter your address manually.",
      });
      return;
    }

    setIsDetectingLocation(true);
    setDetectionStatus({
      type: "info",
      message: "Requesting location access from your device...",
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await reverseGeocodeLocation(latitude, longitude);

          if (res && (res.state || res.city || res.pincode)) {
            if (res.state) setState(res.state);
            if (res.district || res.city) setCity(res.district || res.city);
            if (res.pincode) setPostalCode(res.pincode);
            if (res.locality && !line2) setLine2(res.locality);
            if (res.road && !line1) setLine1(res.road);
            if (res.landmark && !landmark) setLandmark(res.landmark);

            const locationParts = [
              res.district || res.city || "",
              res.state,
              res.pincode,
            ].filter(Boolean).join(", ");

            const landmarkText = res.landmark ? ` • ${res.landmark}` : "";

            setDetectionStatus({
              type: "success",
              message: `Location detected: ${locationParts}${landmarkText}`.trim(),
            });
          } else {
            setDetectionStatus({
              type: "info",
              message: "Coordinates detected. Please select your State and District from the dropdowns below.",
            });
          }
        } catch {
          setDetectionStatus({
            type: "error",
            message: "Failed to reverse geocode location. Please select your State and District manually.",
          });
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        setIsDetectingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          setDetectionStatus({
            type: "error",
            message: "Location permission was denied. Please select your State and District manually.",
          });
        } else {
          setDetectionStatus({
            type: "error",
            message: "Unable to detect GPS position. Please select your State and District manually.",
          });
        }
      },
      {
        timeout: 10000,
        enableHighAccuracy: true,
      }
    );
  };

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

      const res = await createOrderAndPaymentSession(
        product.code,
        vehicle?.id || null,
        addressInput
      );

      if (!res.success || !res.orderId) {
        setErrorMessage(res.error || "Unable to initiate payment session. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Check if Razorpay Standard Checkout SDK is available
      if (typeof window.Razorpay === "function" && res.razorpay) {
        const rzp = new window.Razorpay({
          key: res.razorpay.keyId,
          amount: res.razorpay.amount,
          currency: res.razorpay.currency || "INR",
          name: res.razorpay.name || "VaahanSafe",
          description: res.razorpay.description || "VaahanSafe QR Safety Kit",
          order_id: res.razorpay.orderId,
          prefill: res.razorpay.prefill,
          theme: {
            color: "#CC785C",
          },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              setIsSubmitting(true);
              // Authoritative server-side verification of Razorpay checkout callback
              const verifyRes = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: res.orderId,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                window.location.href = `/orders/checkout-status?order_id=${res.orderId}`;
              } else {
                setErrorMessage(verifyData.error || "Payment verification pending. Reconciling transaction...");
                window.location.href = `/orders/checkout-status?order_id=${res.orderId}`;
              }
            } catch {
              window.location.href = `/orders/checkout-status?order_id=${res.orderId}`;
            }
          },
          modal: {
            ondismiss: () => {
              setIsSubmitting(false);
              setErrorMessage("Payment Not Completed — Your order has not been marked as paid.");
            },
          },
        });

        rzp.open();
      } else {
        // Fallback redirection to status check if script failed to load or in non-browser testing
        window.location.href = `/orders/checkout-status?order_id=${res.orderId}`;
      }
    } catch (err: any) {
      console.error("Payment initiation error:", err);
      setErrorMessage(
        "A connection issue occurred while opening secure checkout. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Razorpay Standard Checkout SDK */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
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
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
            FINAL CHECKOUT &bull; STEP 02
          </div>
          <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Delivery & Payment
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Provide your delivery address to dispatch your genuine UV-laminated QR kit. Payments are securely processed via Razorpay.
          </p>
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
                  {/* Location Auto-Detection Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/20 p-3 sm:p-3.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#cc785c]/10 text-[#cc785c]">
                        <Navigation className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-foreground">
                          Location Detection &amp; Auto-Fill
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Auto-detect via GPS or enter your 6-digit PIN code
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isDetectingLocation}
                      className="inline-flex h-9 sm:h-10 items-center justify-center gap-2 rounded-xl border border-[#cc785c]/40 bg-[#cc785c]/10 px-3.5 sm:px-4 font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#cc785c] hover:bg-[#cc785c] hover:text-white transition-all disabled:opacity-50 cursor-pointer shrink-0 shadow-2xs"
                    >
                      {isDetectingLocation ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin shrink-0" />
                          <span>Detecting GPS...</span>
                        </>
                      ) : (
                        <>
                          <LocateFixed className="size-3.5 shrink-0" />
                          <span>Use Current Location</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Feedback Status Pill */}
                  {detectionStatus && (
                    <div
                      className={`flex items-center justify-between gap-2 rounded-xl px-3.5 py-2 text-xs font-medium ${
                        detectionStatus.type === "success"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                          : detectionStatus.type === "error"
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                          : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {detectionStatus.type === "success" ? (
                          <CheckCircle2 className="size-3.5 shrink-0" />
                        ) : (
                          <AlertCircle className="size-3.5 shrink-0" />
                        )}
                        <span className="truncate">{detectionStatus.message}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDetectionStatus(null)}
                        className="text-xs opacity-70 hover:opacity-100 cursor-pointer shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  )}

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
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                        State *
                      </label>
                      <SearchableCombobox
                        options={allStates}
                        value={state}
                        onChange={handleStateChange}
                        placeholder="Select state..."
                        searchPlaceholder="Search 28 states & 8 UTs..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                        District / City *
                      </label>
                      <SearchableCombobox
                        options={districtOptions}
                        value={city}
                        onChange={setCity}
                        placeholder={state ? "Select district..." : "Select State first..."}
                        searchPlaceholder={
                          state ? `Search districts in ${state}...` : "Type city or select state..."
                        }
                        allowCustom
                        required
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                          PIN Code *
                        </label>
                        {isResolvingPin && (
                          <span className="flex items-center gap-1 font-mono text-[10px] text-[#cc785c]">
                            <Loader2 className="size-2.5 animate-spin" />
                            <span>Auto-lookup...</span>
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={postalCode}
                        onChange={handlePostalCodeChange}
                        placeholder="6-digit PIN"
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
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

          {/* Right 5 Columns: Order Summary & Razorpay Payment Gate */}
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
                <span>{isSubmitting ? "Preparing Secure Payment..." : `Pay ${product.priceFormatted} Securely`}</span>
              </button>

              <div className="space-y-2 text-center">
                <div className="font-mono text-[10px] text-muted-foreground flex items-center justify-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  <span>Secured by Razorpay &bull; UPI, Cards, NetBanking, Wallets</span>
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

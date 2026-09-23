"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type { FinancialDocumentData } from "@/lib/payments-types";
import { parseUtcDate } from "@/lib/datetime";

interface FinancialDocumentProps {
  data: FinancialDocumentData;
  className?: string;
}

export function FinancialDocument({ data, className = "" }: FinancialDocumentProps) {
  const formattedIssueDate = data.issuedAt
    ? new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(parseUtcDate(data.issuedAt) || new Date(data.issuedAt))
    : "—";

  const formattedPaidDate = data.paidAt
    ? new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(parseUtcDate(data.paidAt) || new Date(data.paidAt))
    : null;

  return (
    <div
      className={`financial-document bg-[#FAF9F5] dark:bg-[#151413] text-[#141413] dark:text-[#f4f4f5] p-4 sm:p-8 md:p-10 border border-[#E6DFD8] dark:border-[#2b2824] rounded-2xl shadow-sm relative overflow-hidden font-sans print:bg-white print:text-black print:border-neutral-300 print:shadow-none print:p-6 print:rounded-none transition-colors ${className}`}
    >
      {/* Registration Marks / Geometric Precision Rails */}
      <div className="pointer-events-none absolute inset-0 opacity-25 dark:opacity-40 print:hidden">
        <div className="absolute left-3 sm:left-6 top-3 sm:top-6 h-3 w-3 border-l border-t border-[#cc785c]" />
        <div className="absolute right-3 sm:right-6 top-3 sm:top-6 h-3 w-3 border-r border-t border-[#cc785c]" />
        <div className="absolute left-3 sm:left-6 bottom-3 sm:bottom-6 h-3 w-3 border-l border-b border-[#cc785c]" />
        <div className="absolute right-3 sm:right-6 bottom-3 sm:bottom-6 h-3 w-3 border-r border-b border-[#cc785c]" />
      </div>

      {/* 1. DOCUMENT TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-[#E6DFD8] dark:border-[#2b2824] pb-6 print:border-neutral-300">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#cc785c]" />
            <span className="font-mono text-xs uppercase tracking-[0.24em] font-bold text-[#cc785c]">
              VaahanSafe
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#141413] dark:text-[#f4f4f5] print:text-black">
            Vehicle Safety Identity Platform
          </h2>
          <p className="text-xs text-[#6C6A64] dark:text-[#a1a1aa] print:text-neutral-600">
            Cloudflare D1 Verified Authoritative Commercial Ledger
          </p>
        </div>

        <div className="text-left sm:text-right font-mono pt-3 sm:pt-0 border-t sm:border-t-0 border-[#E6DFD8]/60 dark:border-[#2b2824]/60">
          <div className="text-xs uppercase tracking-[0.2em] text-[#6C6A64] dark:text-[#a1a1aa] print:text-neutral-600">
            {data.documentType === "INVOICE" ? "COMMERCIAL INVOICE" : "PAYMENT RECEIPT"}
          </div>
          <div className="text-base sm:text-lg font-bold text-[#141413] dark:text-[#f4f4f5] mt-0.5 print:text-black">
            {data.documentNumber}
          </div>
          <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-[#5db8a6]/15 dark:bg-[#5db8a6]/20 px-2 py-0.5 text-[10px] font-semibold text-[#1e7668] dark:text-[#5db8a6] print:bg-neutral-100 print:border print:border-neutral-300 print:text-black">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />
            <span>AUTHORITATIVE {data.status}</span>
          </div>
        </div>
      </div>

      {/* 2. DOCUMENT METADATA GRID */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 py-4 border-b border-[#E6DFD8] dark:border-[#2b2824] text-xs font-mono print:border-neutral-300">
        <div className="min-w-0">
          <span className="text-[10px] uppercase text-[#6C6A64] dark:text-[#a1a1aa] block print:text-neutral-600">Date Issued</span>
          <span className="font-semibold text-[#141413] dark:text-[#f4f4f5] print:text-black truncate block">{formattedIssueDate}</span>
        </div>
        <div className="min-w-0">
          <span className="text-[10px] uppercase text-[#6C6A64] dark:text-[#a1a1aa] block print:text-neutral-600">Payment Date</span>
          <span className="font-semibold text-[#141413] dark:text-[#f4f4f5] print:text-black truncate block">{formattedPaidDate || "Pending"}</span>
        </div>
        <div className="min-w-0">
          <span className="text-[10px] uppercase text-[#6C6A64] dark:text-[#a1a1aa] block print:text-neutral-600">Order Ref</span>
          <span className="font-semibold text-[#141413] dark:text-[#f4f4f5] print:text-black truncate block" title={data.orderNumber}>{data.orderNumber}</span>
        </div>
        <div className="min-w-0">
          <span className="text-[10px] uppercase text-[#6C6A64] dark:text-[#a1a1aa] block print:text-neutral-600">Gateway Provider</span>
          <span className="font-semibold text-[#141413] dark:text-[#f4f4f5] print:text-black truncate block">
            {data.gatewayReference
              ? data.gatewayReference.startsWith("pay_") || data.gatewayReference.startsWith("order_")
                ? `Razorpay (${data.gatewayReference.slice(-6)})`
                : `Gateway (${data.gatewayReference.slice(-6)})`
              : "Razorpay"}
          </span>
        </div>
      </div>

      {/* 3. PARTIES (BILL TO / SERVICE ASSIGNMENT) */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-[#E6DFD8] dark:border-[#2b2824] pb-6 print:border-neutral-300">
        {/* Customer / Billing Destination */}
        <div className="space-y-1.5 text-xs">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#6C6A64] dark:text-[#a1a1aa] print:text-neutral-600">
            Billed &amp; Fulfilled To
          </div>
          {data.billingAddress ? (
            <div className="space-y-0.5 leading-relaxed text-[#3D3D3A] dark:text-[#d4d4d8] print:text-neutral-800">
              <div className="font-semibold text-[#141413] dark:text-[#f4f4f5] text-sm print:text-black">
                {data.billingAddress.recipientName}
              </div>
              <div>{data.billingAddress.line1}</div>
              {data.billingAddress.line2 && <div>{data.billingAddress.line2}</div>}
              <div>
                {data.billingAddress.city}, {data.billingAddress.state} - {data.billingAddress.postalCode}
              </div>
              <div>Phone: +91 {data.billingAddress.phone}</div>
            </div>
          ) : (
            <div className="text-[#6C6A64] dark:text-[#a1a1aa] italic print:text-neutral-500">
              Configured account billing identity on file
            </div>
          )}
        </div>

        {/* Assigned Vehicle & QR Hardware */}
        <div className="space-y-1.5 text-xs">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#6C6A64] dark:text-[#a1a1aa] print:text-neutral-600">
            Vehicle &amp; Safety Service Connection
          </div>
          {data.vehicle ? (
            <div className="space-y-1.5 rounded-xl border border-[#E6DFD8] dark:border-[#2b2824] bg-[#F5F0E8]/70 dark:bg-[#1c1b18] p-3 font-mono text-xs print:bg-neutral-50 print:border-neutral-200">
              <div className="flex flex-wrap items-baseline justify-between gap-1">
                <span className="text-[#6C6A64] dark:text-[#a1a1aa] text-[11px] print:text-neutral-600 shrink-0">Registered Vehicle</span>
                <span className="font-bold text-[#141413] dark:text-[#f4f4f5] print:text-black text-right font-mono">{data.vehicle.plateNumber}</span>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-1 text-[11px] text-[#6C6A64] dark:text-[#a1a1aa] print:text-neutral-600">
                <span className="shrink-0">Make / Model</span>
                <span className="text-[#141413] dark:text-[#f4f4f5] print:text-black text-right">{data.vehicle.makeModel}</span>
              </div>
              {data.qrSticker && (
                <div className="flex flex-wrap items-baseline justify-between gap-1 pt-1.5 border-t border-[#E6DFD8] dark:border-[#2b2824] text-[11px] print:border-neutral-200">
                  <span className="text-[#6C6A64] dark:text-[#a1a1aa] print:text-neutral-600 shrink-0">QR Identity Code</span>
                  <span className="font-bold text-[#cc785c] text-right font-mono">{data.qrSticker.visibleCode}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-[#6C6A64] dark:text-[#a1a1aa] italic print:text-neutral-500">
              Hardware pending initial vehicle binding
            </div>
          )}
        </div>
      </div>

      {/* 4. ITEMIZED FINANCIAL TABLE */}
      <div className="mt-6 space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-[#6C6A64] dark:text-[#a1a1aa] print:text-neutral-600">
          Purchased Hardware &amp; Services
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E6DFD8] dark:border-[#2b2824] font-mono text-[10px] uppercase text-[#6C6A64] dark:text-[#a1a1aa] print:border-neutral-300 print:text-neutral-600">
                <th className="py-2 pr-4">Description</th>
                <th className="py-2 px-4 text-center">Qty</th>
                <th className="py-2 px-4 text-right">Rate</th>
                <th className="py-2 pl-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DFD8]/60 dark:divide-[#2b2824]/80 print:divide-neutral-200">
              {data.items.length > 0 ? (
                data.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-[#141413] dark:text-[#f4f4f5] print:text-black">{item.name}</div>
                      <div className="font-mono text-[10px] text-[#6C6A64] dark:text-[#a1a1aa] print:text-neutral-600">
                        Type: {item.itemType}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-[#141413] dark:text-[#f4f4f5] print:text-black">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-4 font-mono text-right text-[#141413] dark:text-[#f4f4f5] print:text-black">
                      ₹{(item.unitPriceMinor / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 pl-4 font-mono font-semibold text-right text-[#141413] dark:text-[#f4f4f5] print:text-black">
                      ₹{(item.totalPriceMinor / 100).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-3 pr-4">
                    <div className="font-medium text-[#141413] dark:text-[#f4f4f5] print:text-black">VaahanSafe Automotive Safety Kit</div>
                    <div className="font-mono text-[10px] text-[#6C6A64] dark:text-[#a1a1aa] print:text-neutral-600">Individual Vehicle Sticker</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-center text-[#141413] dark:text-[#f4f4f5] print:text-black">1</td>
                  <td className="py-3 px-4 font-mono text-right text-[#141413] dark:text-[#f4f4f5] print:text-black">
                    ₹{(data.totalMinor / 100).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 pl-4 font-mono font-semibold text-right text-[#141413] dark:text-[#f4f4f5] print:text-black">
                    ₹{(data.totalMinor / 100).toLocaleString("en-IN")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. FINANCIAL TOTALS LEDGER */}
      <div className="mt-6 flex justify-end border-t border-[#E6DFD8] dark:border-[#2b2824] pt-4 print:border-neutral-300">
        <div className="w-full sm:w-72 space-y-2 text-xs font-mono">
          <div className="flex justify-between text-[#6C6A64] dark:text-[#a1a1aa] print:text-neutral-600">
            <span>Subtotal</span>
            <span>₹{(data.subtotalMinor / 100).toLocaleString("en-IN")}</span>
          </div>

          {data.discountMinor > 0 && (
            <div className="flex justify-between text-[#1e7668] dark:text-[#5db8a6] print:text-emerald-700">
              <span>Discount</span>
              <span>-₹{(data.discountMinor / 100).toLocaleString("en-IN")}</span>
            </div>
          )}

          <div className="flex justify-between text-[#6C6A64] dark:text-[#a1a1aa] print:text-neutral-600">
            <span>Shipping / Delivery</span>
            <span>{data.shippingMinor > 0 ? `₹${(data.shippingMinor / 100).toLocaleString("en-IN")}` : "FREE"}</span>
          </div>

          {/* Only render tax row if actual tax was charged / recorded */}
          {data.taxMinor > 0 && (
            <div className="flex justify-between text-[#6C6A64] dark:text-[#a1a1aa] print:text-neutral-600">
              <span>Taxes</span>
              <span>₹{(data.taxMinor / 100).toLocaleString("en-IN")}</span>
            </div>
          )}

          <div className="border-t border-[#141413]/20 dark:border-white/20 pt-2 flex justify-between font-bold text-sm text-[#141413] dark:text-[#f4f4f5] print:border-neutral-400 print:text-black">
            <span>Total Confirmed</span>
            <span className="text-[#cc785c]">
              ₹{(data.totalMinor / 100).toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* 6. DOCUMENT FOOTER & LEGAL DISCLAIMER */}
      <div className="mt-8 pt-6 border-t border-[#E6DFD8] dark:border-[#2b2824] text-[10px] text-[#6C6A64] dark:text-[#a1a1aa] space-y-1.5 leading-relaxed print:border-neutral-300 print:text-neutral-600">
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono uppercase">
          <span>VAAHANSAFE // FINANCIAL RECORD</span>
          <span>SECURE PROTOCOL 2.0</span>
        </div>
        <p>
          This is a computer-generated authoritative commercial document issued by VaahanSafe. Verified via server-signed gateway cryptographic proof. No physical signature is required.
        </p>
      </div>
    </div>
  );
}

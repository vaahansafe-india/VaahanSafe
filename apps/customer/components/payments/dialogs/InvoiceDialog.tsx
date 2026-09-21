"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogTitle, Button } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";
import { FinancialDocument } from "../document/FinancialDocument";
import type { PaymentRecordItem, FinancialDocumentData } from "@/lib/payments-types";

interface InvoiceDialogProps {
  payment: PaymentRecordItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceDialog({ payment, isOpen, onClose }: InvoiceDialogProps) {
  if (!payment) return null;

  const documentData: FinancialDocumentData = {
    documentType: "INVOICE",
    documentNumber: `INV-${payment.orderNumber.replace("VS-ORD-", "")}`,
    issuedAt: payment.createdAt,
    paidAt: payment.confirmedAt,
    orderNumber: payment.orderNumber,
    status: payment.status === "SUCCESS" ? "PAID" : "PENDING",
    billingAddress: payment.billingAddress,
    items: payment.lineItems,
    subtotalMinor: payment.subtotalMinor,
    discountMinor: payment.discountMinor,
    shippingMinor: payment.shippingMinor,
    taxMinor: payment.taxMinor,
    totalMinor: payment.totalMinor,
    currency: payment.currency,
    paymentMethod: payment.paymentMethod,
    gatewayReference: payment.providerPaymentId,
    vehicle: payment.vehicle,
    qrSticker: payment.qrSticker,
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card border border-border shadow-2xl font-sans rounded-2xl [&>button.absolute]:hidden">
        {/* EXTERNAL MODAL TOOLBAR (Hidden in Print) */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-card text-foreground border-b border-border print:hidden">
          <div className="flex items-center gap-2">
            <VaahanIcon name="receipt" size={16} className="text-[#cc785c]" />
            <DialogTitle className="font-mono text-xs uppercase tracking-wider text-foreground">
              Official Document / {documentData.documentNumber}
            </DialogTitle>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs gap-1.5 h-8 px-3 shadow-sm transition-colors"
            >
              <VaahanIcon name="download" size={12} />
              <span>Print / Save PDF</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-border bg-background hover:bg-muted text-foreground font-mono text-xs h-8 px-3 transition-colors"
            >
              <VaahanIcon name="close" size={12} />
              <span>Close</span>
            </Button>
          </div>
        </div>

        {/* DOCUMENT PREVIEW CONTAINER */}
        <div className="max-h-[80vh] overflow-y-auto p-3 sm:p-6 bg-muted/40 dark:bg-black/40 print:p-0 print:max-h-none print:overflow-visible print:bg-white">
          <FinancialDocument data={documentData} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

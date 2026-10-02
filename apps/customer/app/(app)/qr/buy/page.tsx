import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerPageView } from "./CustomerPageView";
import { CustomerPageLoading } from "@/components/query/CustomerPageState";

export const metadata: Metadata = {
  title: "Buy QR Safety Kit — VaahanSafe Automotive Hardware",
  description:
    "Order genuine VaahanSafe physical QR stickers with industrial UV lamination and tamper protection.",
};

export default function CustomerPage() {
  return <Suspense fallback={<CustomerPageLoading />}><CustomerPageView /></Suspense>;
}

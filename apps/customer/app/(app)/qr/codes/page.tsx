import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerPageView } from "./CustomerPageView";
import { CustomerPageLoading } from "@/components/query/CustomerPageState";

export const metadata: Metadata = {
  title: "QR Codes Registry — VaahanSafe Automotive Safety",
  description:
    "Manage up to two vehicles on each activated VaahanSafe ID.",
};

export default function CustomerPage() {
  return <Suspense fallback={<CustomerPageLoading />}><CustomerPageView /></Suspense>;
}

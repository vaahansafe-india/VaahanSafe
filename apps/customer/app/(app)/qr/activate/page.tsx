import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerPageView } from "./CustomerPageView";
import { CustomerPageLoading } from "@/components/query/CustomerPageState";

export const metadata: Metadata = {
  title: "Activate Retail QR — VaahanSafe Automotive Safety",
  description:
    "Link a retail scratch card or dealer sticker pack to your vehicle safety identity.",
};

export default function CustomerPage() {
  return <Suspense fallback={<CustomerPageLoading />}><CustomerPageView /></Suspense>;
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerPageView } from "./CustomerPageView";
import { CustomerPageLoading } from "@/components/query/CustomerPageState";

export const metadata: Metadata = {
  title: "My QR Hub — VaahanSafe QR Identity Center",
  description:
    "Authoritative vehicle QR safety identity, physical UV sticker tracking, digital pass, and lifecycle services.",
};

export default function CustomerPage() {
  return <Suspense fallback={<CustomerPageLoading />}><CustomerPageView /></Suspense>;
}

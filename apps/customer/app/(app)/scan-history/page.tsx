import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerPageView } from "./CustomerPageView";
import { CustomerPageLoading } from "@/components/query/CustomerPageState";

export const metadata: Metadata = {
  title: "Scan Intelligence & Security Logs — VaahanSafe",
  description:
    "Review verified passerby encounters, emergency contact relays, and public safety view resolutions connected to your vehicle passes.",
};

export default function CustomerPage() {
  return <Suspense fallback={<CustomerPageLoading />}><CustomerPageView /></Suspense>;
}

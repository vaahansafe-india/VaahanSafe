import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerPageView } from "./CustomerPageView";
import { CustomerPageLoading } from "@/components/query/CustomerPageState";

export const metadata: Metadata = {
  title: "Vehicles — VaahanSafe Vehicle Identity Registry",
  description:
    "Manage your registered vehicles, view active QR assignments, configure emergency projection, and audit safety relationships.",
};

export default function CustomerPage() {
  return <Suspense fallback={<CustomerPageLoading />}><CustomerPageView /></Suspense>;
}

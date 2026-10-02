import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerPageView } from "./CustomerPageView";
import { CustomerPageLoading } from "@/components/query/CustomerPageState";

export const metadata: Metadata = {
  title: "Service & Coverage Center — VaahanSafe",
  description:
    "See the services connected to your vehicle identities, manage your plan, and understand what is currently enabled.",
};

export default function CustomerPage() {
  return <Suspense fallback={<CustomerPageLoading />}><CustomerPageView /></Suspense>;
}

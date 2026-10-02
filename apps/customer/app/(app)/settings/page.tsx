import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerPageView } from "./CustomerPageView";
import { CustomerPageLoading } from "@/components/query/CustomerPageState";

export const metadata: Metadata = {
  title: "Account & Control Center — VaahanSafe",
  description: "Manage your personal identity, verified mobile number, active sessions, and public safety projection privacy.",
};

export default function CustomerPage() {
  return <Suspense fallback={<CustomerPageLoading />}><CustomerPageView /></Suspense>;
}

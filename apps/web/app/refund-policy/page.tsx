import type { Metadata } from "next";
import { PolicyPage } from "../../components/marketing/policy-page";

export const metadata: Metadata = { title: "Refund Policy | VaahanSafe", description: "Automatic refunds are not currently available. Read the current purchase policy and how to request an order or payment review." };

export default function Page() {
  return <PolicyPage policy="refund" />;
}

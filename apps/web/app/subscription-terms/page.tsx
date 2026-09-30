import type { Metadata } from "next";
import { PolicyPage } from "../../components/marketing/policy-page";

export const metadata: Metadata = { title: "Subscription Terms | VaahanSafe", description: "Understand optional plan features, billing periods, renewal, expiry and cancellation." };

export default function Page() {
  return <PolicyPage policy="subscription" />;
}

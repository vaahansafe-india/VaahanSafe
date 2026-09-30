import type { Metadata } from "next";
import { PolicyPage } from "../../components/marketing/policy-page";

export const metadata: Metadata = { title: "Cookie Policy | VaahanSafe", description: "Essential VaahanSafe session cookies, browser choices and privacy information." };

export default function Page() {
  return <PolicyPage policy="cookies" />;
}

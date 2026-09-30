import type { Metadata } from "next";
import { PolicyPage } from "../../components/marketing/policy-page";

export const metadata: Metadata = { title: "Shipping & Replacement Policy | VaahanSafe", description: "Shipping stages, tracking, delivery problems and authorized QR replacement guidance." };

export default function Page() {
  return <PolicyPage policy="shipping" />;
}

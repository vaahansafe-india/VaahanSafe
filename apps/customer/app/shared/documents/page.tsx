import type { Metadata } from "next";
import { SharedDocument } from "@/features/document-vault/SharedDocument";
export const metadata: Metadata = {
  title: "Shared document — VaahanSafe",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function SharedDocumentPage() {
  return <SharedDocument />;
}

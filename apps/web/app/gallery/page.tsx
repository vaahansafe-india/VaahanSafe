import type { Metadata } from "next";
import { PublicPage } from "../../components/marketing/public-page";
import { publicPages } from "../../lib/public-pages";
export const metadata: Metadata = { title: "QR Placement Gallery | VaahanSafe", description: publicPages.gallery.description };
export default function Page() { return <PublicPage content={publicPages.gallery} />; }

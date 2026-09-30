import type { Metadata } from "next";
import { PublicPage } from "../../components/marketing/public-page";
import { publicPages } from "../../lib/public-pages";
export const metadata: Metadata = { title: "Safety & Privacy | VaahanSafe", description: publicPages.safety.description };
export default function Page() { return <PublicPage content={publicPages.safety} />; }

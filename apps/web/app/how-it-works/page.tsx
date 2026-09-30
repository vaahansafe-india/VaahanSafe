import type { Metadata } from "next";
import { PublicPage } from "../../components/marketing/public-page";
import { publicPages } from "../../lib/public-pages";
export const metadata: Metadata = { title: "How It Works | VaahanSafe", description: publicPages.how.description };
export default function Page() { return <PublicPage content={publicPages.how} />; }

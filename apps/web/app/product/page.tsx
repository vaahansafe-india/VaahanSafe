import type { Metadata } from "next";
import { PublicPage } from "../../components/marketing/public-page";
import { publicPages } from "../../lib/public-pages";
export const metadata: Metadata = { title: "Product | VaahanSafe", description: publicPages.product.description };
export default function Page() { return <PublicPage content={publicPages.product} />; }

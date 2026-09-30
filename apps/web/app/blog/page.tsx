import type { Metadata } from "next";
import { getAllBlogPosts, getFeaturedBlogPost } from "@vaahansafe/content";
import { BlogIndexClient } from "../../components/blog/BlogIndexClient";
import { SiteHeader } from "../../components/marketing/site-header";
import { SiteFooter } from "../../components/marketing/site-footer";

export const metadata: Metadata = {
  title: "Journal | Vehicle Safety, QR Placement & Privacy | VaahanSafe",
  description: "Explore VaahanSafe articles on vehicle safety, QR placement, privacy and the practical details of managing a vehicle identity.",
};

export default function BlogIndexPage() {
  const posts = getAllBlogPosts();
  return <div className="vs-page"><SiteHeader /><main id="main-content" className="vs-page-main">
    <section className="vs-page-hero"><div className="vs-container"><span className="vs-kicker">VAAHANSAFE JOURNAL / FIELD NOTES</span><h1>A little knowledge.<br /><em>A more considered journey.</em></h1><p>Ideas and practical guides for understanding your vehicle’s QR identity, choosing what to share and keeping the next step clear.</p></div></section>
    <section className="vs-page-body"><div className="vs-container"><div className="vs-journal-intro"><p className="vs-page-intro">From the placement of a sticker to the boundary between a private account and a public scan, the details matter. Explore one topic at a time, then use our product guides to put it into practice.</p><p>Published articles explain a topic in depth. They complement the product documentation; your account shows the services and status available to you.</p></div><BlogIndexClient initialPosts={posts} featuredPost={getFeaturedBlogPost()} /></div></section>
  </main><SiteFooter /></div>;
}

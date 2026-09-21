import { getPublishedArticles } from "@vaahansafe/content";

export async function GET() {
  const articles = getPublishedArticles();

  const siteUrl = "https://blog.vaahansafe.com";

  const rssItemsXml = articles
    .map((article) => {
      const articleUrl = `${siteUrl}/articles/${article.slug}`;
      const pubDate = new Date(article.publishedAt).toUTCString();

      return `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <description><![CDATA[${article.deck || article.excerpt}]]></description>
      <pubDate>${pubDate}</pubDate>
      <category>${article.category}</category>
      <author>${article.author.name}</author>
    </item>`;
    })
    .join("\n");

  const rssFeedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>VaahanSafe Journal</title>
    <link>${siteUrl}</link>
    <description>Ideas and practical knowledge for safer vehicle connections. Field notes on roadside emergency protocols, optical QR identity, and zero-exposure privacy.</description>
    <language>en-IN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
${rssItemsXml}
  </channel>
</rss>`;

  return new Response(rssFeedXml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

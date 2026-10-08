# Search and feed discovery

All eight app surfaces expose the following endpoints:

| Endpoint | Behavior |
| --- | --- |
| `/robots.txt` | Canonical crawler instructions, using the surface indexing policy. |
| `/robot.txt` | Permanent 308 redirect to `/robots.txt`. |
| `/sitemap.xml` | Canonical XML sitemap. |
| `/sites.xml` | Permanent 308 redirect to `/sitemap.xml`. |
| `/rss.xml` | Public feed, or a permanent redirect to the Journal feed. |

Web lists actual public pages and official guide routes, excluding development, authentication, search, and legacy redirect pages. It uses the production canonical `www.vaahansafe.com` host. Static pages do not receive invented modification timestamps.

Blog discovery reads published, non-future articles from the existing Supabase journal repository. Sitemaps include live article/category routes and RSS contains the latest 50 publications. Discovery does not fall back to authored seed content when a provider fails or returns no publications.

Status discovery reads the public incident archive from the existing Cloudflare monitoring repository. It includes the four public status pages and incident URLs. Its RSS feed contains actual incident reports and updates; an empty archive is a valid empty feed, not a fabricated operational update.

Customer, activation, QR, admin, and API retain `Disallow: /` and empty sitemaps. Their RSS endpoints redirect to the public Journal. No user, vehicle, activation credential, order, or resolver identity is enumerated. Robots instructions supplement existing session and authorization enforcement; they do not provide access control. Session middleware permits only the five exact discovery endpoints.

Vercel Preview and Development deployments disable sitemap enumeration and crawler discovery on all surfaces. Live RSS uses UTF-8, XML escaping, Dublin Core creator metadata, real publication/update dates, a self link, and five-minute shared caching. Provider failures return a non-cacheable, retryable 503 for feeds; sitemap failures propagate rather than returning fabricated content.

No new secrets, database migrations, provider integrations, or packages are required. Deployment must publish these source changes; redeploying an older Git revision only updates that revision's environment variables.

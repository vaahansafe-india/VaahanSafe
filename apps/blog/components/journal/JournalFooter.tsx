import Link from "next/link";
import { getWebUrl, getStatusUrl } from "@vaahansafe/config";
import { JOURNAL_CATEGORIES } from "@vaahansafe/content";

export function JournalFooter() {
  const webUrl = getWebUrl();
  return (
    <footer className="journal-footer">
      <div className="journal-container">
        <div className="journal-footer-grid">
          <div className="journal-footer-intro">
            <p className="journal-label">VaahanSafe / The Journal</p>
            <h2 className="journal-section-title mt-4 max-w-sm">
              A little knowledge.
              <br />
              <em>A safer journey.</em>
            </h2>
            <p className="journal-muted mt-4 max-w-sm text-sm leading-7">
              Practical reading on vehicle safety, privacy, and the connections
              that matter on the road.
            </p>
            <Link
              href="/guides"
              prefetch={false}
              className="journal-text-link mt-2"
            >
              Find a practical guide <span aria-hidden="true">→</span>
            </Link>
          </div>
          <nav aria-label="Footer journal topics">
            <h3 className="journal-label mb-3">Explore</h3>
            <ul>
              {JOURNAL_CATEGORIES.map((category) => (
                <li key={category.slug}>
                  <Link prefetch={false} href={`/category/${category.slug}`}>
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="VaahanSafe resources">
            <h3 className="journal-label mb-3">Stay connected</h3>
            <ul>
              <li>
                <a href={webUrl}>VaahanSafe website ↗</a>
              </li>
              <li>
                <a href={`${webUrl}/how-it-works`}>How it works</a>
              </li>
              <li>
                <a href={`${webUrl}/privacy`}>Privacy policy</a>
              </li>
              <li>
                <a href={`${webUrl}/terms`}>Terms of service</a>
              </li>
              <li>
                <a href={getStatusUrl()}>Service status ↗</a>
              </li>
              <li>
                <a href="/rss.xml">Journal RSS feed</a>
              </li>
            </ul>
          </nav>
        </div>
        <div className="journal-footer-bottom">
          <span>
            © {new Date().getFullYear()} VaahanSafe. All rights reserved.
          </span>
          <span>Vehicle safety. Identity. Privacy.</span>
        </div>
      </div>
    </footer>
  );
}

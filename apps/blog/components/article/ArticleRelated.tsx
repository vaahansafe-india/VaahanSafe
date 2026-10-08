import type { BlogPost } from "@vaahansafe/content";
import { StoryCard } from "../journal/StoryCard";

export function ArticleRelated({
  articles,
}: {
  articles: readonly BlogPost[];
}) {
  if (!articles.length) return null;
  return (
    <section className="journal-section" aria-labelledby="related-title">
      <p className="journal-label">Keep reading</p>
      <h2 id="related-title" className="journal-section-title mt-3 mb-8">
        A few more perspectives.
      </h2>
      <div className="journal-grid">
        {articles.map((article) => (
          <StoryCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  );
}

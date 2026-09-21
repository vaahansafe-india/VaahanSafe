import { ALL_HELP_ARTICLES, HelpArticle } from "./help-content";

export interface SearchResult {
  article: HelpArticle;
  score: number;
  matchedOn: "title" | "keyword" | "summary" | "category" | "step";
}

/**
 * Searches the local article index across titles, summaries, keywords, categories, and step contents.
 * Returns ranked results with highest relevance first.
 */
export function searchHelpArticles(query: string): SearchResult[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  const terms = cleanQuery.split(/\s+/).filter((t) => t.length > 1);
  if (terms.length === 0) return [];

  const results: SearchResult[] = [];

  for (const article of ALL_HELP_ARTICLES) {
    let score = 0;
    let matchedOn: SearchResult["matchedOn"] = "summary";

    const titleLower = article.title.toLowerCase();
    const summaryLower = article.summary.toLowerCase();
    const categoryLower = article.categoryTitle.toLowerCase();
    const keywordsLower = article.keywords.map((k) => k.toLowerCase());

    // Exact title match (Highest weight)
    if (titleLower.includes(cleanQuery)) {
      score += 100;
      matchedOn = "title";
    }

    // Term-by-term scoring
    for (const term of terms) {
      if (titleLower.includes(term)) {
        score += 30;
        matchedOn = "title";
      }

      // Keyword match
      if (keywordsLower.some((k) => k.includes(term))) {
        score += 25;
        if (matchedOn !== "title") matchedOn = "keyword";
      }

      // Category match
      if (categoryLower.includes(term)) {
        score += 15;
        if (matchedOn !== "title" && matchedOn !== "keyword") matchedOn = "category";
      }

      // Summary match
      if (summaryLower.includes(term)) {
        score += 10;
      }

      // Steps match
      for (const s of article.steps) {
        if (s.title.toLowerCase().includes(term) || s.instruction.toLowerCase().includes(term)) {
          score += 5;
          if (matchedOn === "summary") matchedOn = "step";
        }
      }
    }

    if (score > 0) {
      results.push({ article, score, matchedOn });
    }
  }

  // Sort descending by score
  return results.sort((a, b) => b.score - a.score);
}

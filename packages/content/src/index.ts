/**
 * @vaahansafe/content
 * Unified, canonical content package for VaahanSafe Journal & Educational Guides
 */

export * from "./types";
export * from "./categories";
export * from "./articles";
export * from "./queries";
export * from "./domain/article";
export * from "./domain/placement";
export * from "./media-resolver";
export * from "./services/slug.service";
export * from "./services/reading-time.service";

export interface IContentService {
  getPosts(category?: string): Promise<import("./types").BlogPost[]>;
  getPostBySlug(slug: string): Promise<import("./types").BlogPost | null>;
}

export class InMemoryContentService implements IContentService {
  async getPosts(category?: string): Promise<import("./types").BlogPost[]> {
    const { getBlogPostsByCategory } = await import("./queries");
    return getBlogPostsByCategory(category || "All");
  }

  async getPostBySlug(slug: string): Promise<import("./types").BlogPost | null> {
    const { getBlogPostBySlug } = await import("./queries");
    return getBlogPostBySlug(slug) || null;
  }
}

import type {
  BlogPost,
  ArticleMediaRole,
  PublicEditorialMedia,
  EditorialFrame,
} from "./types";

/**
 * Authoritative Server-Side Media Resolver for VaahanSafe Journal
 *
 * INVARIANTS:
 * 1. Article A Media !== Article B Media by default.
 * 2. An article without assigned media NEVER borrows another article's image.
 * 3. An article without assigned media resolves to a designed editorial fallback (isFallback: true, src: undefined).
 * 4. Hero media !== Thumbnail media !== OG media by definition.
 * 5. Deterministic resolution: no Math.random(), no modulo rotation.
 */

const GLOBAL_JOURNAL_OG_FALLBACK =
  "https://assets.vaahansafe.com/journal/og-journal-fallback.jpg";

export interface PublicEditorialOgMedia {
  src: string;
  isFallback: boolean;
}

/**
 * Resolves specific media for an article by explicit role (HERO, THUMBNAIL, OG, INLINE, DIAGRAM).
 */
export function resolveArticleMedia(
  article?: BlogPost,
  role: ArticleMediaRole = "HERO"
): PublicEditorialMedia {
  if (!article) {
    return {
      alt: "VaahanSafe Journal",
      role,
      aspectRatio: "16/10",
      frame: "OFFSET_LANDSCAPE",
      isFallback: true,
      src: undefined,
    };
  }

  // 1. Direct explicit role mapping (supporting mediaRoles or media dict)
  const roleMedia: any =
    article.mediaRoles?.[role] ||
    (article as any).media?.[role] ||
    (article as any).media?.[role.toLowerCase()];

  const rawSrc = roleMedia?.src || roleMedia?.url;
  if (roleMedia && rawSrc) {
    return {
      src: rawSrc,
      alt: roleMedia.alt || roleMedia.altText || article.title,
      caption: roleMedia.caption,
      aspectRatio: roleMedia.aspectRatio || (role === "THUMBNAIL" ? "4/3" : "16/10"),
      frame: roleMedia.frame || (role === "THUMBNAIL" ? "CROPPED_DETAIL" : "OFFSET_LANDSCAPE"),
      focalPoint: roleMedia.focalPoint,
      role,
      isFallback: false,
    };
  }

  // 2. HERO role legacy / direct assignment
  if (role === "HERO") {
    if (article.heroMedia && article.heroMedia.src) {
      return {
        ...article.heroMedia,
        role: "HERO",
        isFallback: false,
        alt: article.heroMedia.alt || article.title,
      };
    }

    if (article.featuredImageUrl) {
      return {
        src: article.featuredImageUrl,
        alt: article.title,
        role: "HERO",
        aspectRatio: "16/10",
        frame: "OFFSET_LANDSCAPE",
        isFallback: false,
      };
    }
  }

  // 3. THUMBNAIL role fallback to previewMedia if explicitly defined
  if (role === "THUMBNAIL" && article.previewMedia && article.previewMedia.src) {
    return {
      ...article.previewMedia,
      role: "THUMBNAIL",
      isFallback: false,
      alt: article.previewMedia.alt || article.title,
    };
  }

  // 4. Default aspect ratio and frame by role
  let defaultFrame: EditorialFrame = "OFFSET_LANDSCAPE";
  let defaultRatio = "16/10";
  if (role === "THUMBNAIL") {
    defaultFrame = "CROPPED_DETAIL";
    defaultRatio = "4/3";
  } else if (role === "OG") {
    defaultFrame = "FULL_BLEED";
    defaultRatio = "1200/630";
  } else if (role === "DIAGRAM") {
    defaultFrame = "INSET_TECHNICAL";
    defaultRatio = "16/9";
  }

  // 5. Authentic Editorial Fallback (Never borrow another article's image)
  return {
    alt: article.title,
    role,
    aspectRatio: defaultRatio,
    frame: defaultFrame,
    isFallback: true,
    src: undefined,
  };
}

/**
 * Resolves preview media for cards, registries, and streams following deterministic priority:
 * THUMBNAIL -> HERO -> EDITORIAL FALLBACK
 */
export function resolveArticlePreviewMedia(
  article?: BlogPost
): PublicEditorialMedia {
  if (!article) {
    return {
      alt: "VaahanSafe Journal",
      role: "THUMBNAIL",
      aspectRatio: "4/3",
      frame: "CROPPED_DETAIL",
      isFallback: true,
      src: undefined,
    };
  }

  // 1. Check THUMBNAIL role
  const thumbRole: any =
    article.mediaRoles?.THUMBNAIL ||
    (article as any).media?.THUMBNAIL ||
    (article as any).media?.thumbnail;

  const thumbSrc = thumbRole?.src || thumbRole?.url;
  if (thumbRole && thumbSrc) {
    return {
      src: thumbSrc,
      alt: thumbRole.alt || thumbRole.altText || article.title,
      caption: thumbRole.caption,
      aspectRatio: thumbRole.aspectRatio || "4/3",
      frame: thumbRole.frame || "CROPPED_DETAIL",
      focalPoint: thumbRole.focalPoint,
      role: "THUMBNAIL",
      isFallback: false,
    };
  }

  if (article.previewMedia && article.previewMedia.src) {
    return {
      ...article.previewMedia,
      role: "THUMBNAIL",
      isFallback: false,
      alt: article.previewMedia.alt || article.title,
    };
  }

  // 2. Fall back to HERO role if available for this specific article
  const heroRole: any =
    article.mediaRoles?.HERO ||
    (article as any).media?.HERO ||
    (article as any).media?.hero;

  const heroSrc = heroRole?.src || heroRole?.url;
  if (heroRole && heroSrc) {
    return {
      src: heroSrc,
      alt: heroRole.alt || heroRole.altText || article.title,
      caption: heroRole.caption,
      aspectRatio: heroRole.aspectRatio || "16/10",
      frame: heroRole.frame || "OFFSET_LANDSCAPE",
      focalPoint: heroRole.focalPoint,
      role: "HERO",
      isFallback: false,
    };
  }

  if (article.heroMedia && article.heroMedia.src) {
    return {
      ...article.heroMedia,
      role: "HERO",
      isFallback: false,
      alt: article.heroMedia.alt || article.title,
    };
  }

  if (article.featuredImageUrl) {
    return {
      src: article.featuredImageUrl,
      alt: article.title,
      role: "HERO",
      aspectRatio: "16/10",
      frame: "OFFSET_LANDSCAPE",
      isFallback: false,
    };
  }

  // 3. Fall back to clean editorial fallback
  return {
    alt: article.title,
    role: "THUMBNAIL",
    aspectRatio: "4/3",
    frame: "CROPPED_DETAIL",
    isFallback: true,
    src: undefined,
  };
}

/**
 * Resolves OpenGraph social media URL following deterministic priority:
 * OG -> HERO -> GLOBAL VAAHANSAFE JOURNAL OG FALLBACK
 */
export function resolveArticleOgMedia(article?: BlogPost): PublicEditorialOgMedia {
  if (!article) {
    return {
      src: GLOBAL_JOURNAL_OG_FALLBACK,
      isFallback: true,
    };
  }

  const ogRole: any =
    article.mediaRoles?.OG ||
    (article as any).media?.OG ||
    (article as any).media?.og;

  const ogSrc = ogRole?.src || ogRole?.url;
  if (ogRole && ogSrc) {
    return {
      src: ogSrc,
      isFallback: false,
    };
  }

  const heroRole: any =
    article.mediaRoles?.HERO ||
    (article as any).media?.HERO ||
    (article as any).media?.hero;

  const heroSrc = heroRole?.src || heroRole?.url;
  if (heroRole && heroSrc) {
    return {
      src: heroSrc,
      isFallback: false,
    };
  }

  if (article.heroMedia?.src) {
    return {
      src: article.heroMedia.src,
      isFallback: false,
    };
  }

  if (article.featuredImageUrl) {
    return {
      src: article.featuredImageUrl,
      isFallback: false,
    };
  }

  return {
    src: GLOBAL_JOURNAL_OG_FALLBACK,
    isFallback: true,
  };
}

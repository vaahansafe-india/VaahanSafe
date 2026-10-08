import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

nextEnv.loadEnvConfig("apps/customer", true);
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!serviceKey || !url) {
  throw new Error("Supabase credentials missing");
}

const supabase = createClient(url, serviceKey);

import { PUBLISHED_ARTICLES } from "../../packages/content/src/articles.js";
import { JOURNAL_CATEGORIES } from "../../packages/content/src/categories.js";

async function seed() {
  console.log("Seeding Journal Categories...");
  for (const cat of JOURNAL_CATEGORIES) {
    const { error } = await supabase.from("journal_categories").upsert({
      id: `cat_${cat.slug.replace(/-/g, "_")}`,
      slug: cat.slug,
      name: cat.name,
      index_number: cat.indexNumber,
      description: cat.description,
      headline: cat.headline,
      spotlight_deck: cat.spotlightDeck,
      icon_name: cat.iconName,
      order_num: cat.order,
      is_active: true,
    }, { onConflict: "slug" });

    if (error) console.error(`Error upserting category ${cat.name}:`, error);
  }

  console.log("Seeding Journal Authors...");
  const authors = [
    {
      id: "auth_ananya_sharma",
      slug: "ananya-sharma",
      name: "Dr. Ananya Sharma",
      role: "Road Safety Research Lead, VaahanSafe",
    },
    {
      id: "auth_rohan_varma",
      slug: "rohan-varma",
      name: "Rohan Varma",
      role: "Optics & Materials Engineer, VaahanSafe",
    },
    {
      id: "auth_priya_nair",
      slug: "priya-nair",
      name: "Priya Nair",
      role: "Privacy Counsel & DPDP Specialist, VaahanSafe",
    },
    {
      id: "auth_eswar_chinthakayala",
      slug: "eswar-chinthakayala",
      name: "Eswar Chinthakayala",
      role: "Identity Systems Architect, VaahanSafe",
    },
  ];

  for (const author of authors) {
    const { error } = await supabase.from("journal_authors").upsert(author, { onConflict: "slug" });
    if (error) console.error(`Error upserting author ${author.name}:`, error);
  }

  console.log("Seeding Journal Articles...");
  for (const art of PUBLISHED_ARTICLES) {
    const authorSlug = art.author.name
      .toLowerCase()
      .replace(/^(dr\.\s*)/i, "")
      .replace(/\s+/g, "-");
    const matchedAuthor = authors.find(a => a.name.includes(art.author.name) || art.author.name.includes(a.name));

    const { error } = await supabase.from("journal_articles").upsert({
      id: art.id,
      slug: art.slug,
      title: art.title,
      excerpt: art.excerpt,
      deck: art.deck || null,
      intro: art.intro,
      category: art.category,
      category_slug: art.categorySlug,
      status: art.status || "PUBLISHED",
      date_display: art.date,
      published_at: art.publishedAt || new Date().toISOString(),
      reading_time: art.readingTime,
      reading_time_minutes: art.readingTimeMinutes || 5,
      word_count: art.wordCount || 1500,
      is_featured: !!art.isFeatured,
      is_guide: !!art.isGuide,
      featured_image_url: art.featuredImageUrl || null,
      hero_media: art.heroMedia || null,
      preview_media: art.previewMedia || null,
      editorial_media: art.editorialMedia || null,
      author_id: matchedAuthor?.id || null,
      author_name: art.author.name,
      author_role: art.author.role,
      tags: art.tags || [],
      key_takeaways: art.keyTakeaways || [],
      body: art.body || [],
      checklist: art.checklist || null,
      faq: art.faq || null,
      references_data: art.references || [],
      related_slugs: art.relatedSlugs || [],
      official_document_ref: art.officialDocumentRef || null,
      has_dark_section: !!art.hasDarkSection,
      dark_section_content: art.darkSectionContent || null,
      seo_title: art.seoTitle || art.title,
      seo_description: art.seoDescription || art.excerpt,
    }, { onConflict: "slug" });

    if (error) {
      console.error(`Error upserting article ${art.slug}:`, error);
    } else {
      console.log(`✓ Article seeded: ${art.slug}`);
    }
  }

  console.log("Journal seeding completed successfully.");
}

seed().catch(console.error);

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { EmailVerification } from "./EmailVerification";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Label,
  Textarea,
  Button,
} from "@vaahansafe/ui/components";
import { CloudflareImageUploader } from "./CloudflareImageUploader";
import { AdminSelect } from "./AdminSelect";

export interface ArticleFormData {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  deck?: string;
  intro: string;
  category: string;
  categorySlug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  authorName: string;
  authorRole: string;
  readingTime: string;
  readingTimeMinutes: number;
  wordCount: number;
  isFeatured: boolean;
  isGuide: boolean;
  featuredImageUrl: string;
  tagsString: string;
  keyTakeawaysString: string;
  contentMarkdown: string;
}

const CATEGORY_MAP: Record<string, string> = {
  "Vehicle Safety": "vehicle-safety",
  "Emergency Response": "emergency-response",
  "Privacy Architecture": "privacy-architecture",
  "Highway Protocol": "highway-protocol",
  "QR Technology": "qr-technology",
  "Regulatory & Good Samaritan": "regulatory-good-samaritan",
};

export function ArticleEditorForm({
  initialData,
  isEditing = false,
}: {
  initialData?: Partial<ArticleFormData>;
  isEditing?: boolean;
}) {
  const router = useRouter();
  const [formData, setFormData] = useState<ArticleFormData>({
    id: initialData?.id || "",
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    excerpt: initialData?.excerpt || "",
    deck: initialData?.deck || "",
    intro: initialData?.intro || "",
    category: initialData?.category || "Vehicle Safety",
    categorySlug: initialData?.categorySlug || "vehicle-safety",
    status: initialData?.status || "DRAFT",
    authorName: initialData?.authorName || "Editorial Board",
    authorRole: initialData?.authorRole || "Safety Research Team",
    readingTime: initialData?.readingTime || "5 min read",
    readingTimeMinutes: initialData?.readingTimeMinutes || 5,
    wordCount: initialData?.wordCount || 1000,
    isFeatured: !!initialData?.isFeatured,
    isGuide: !!initialData?.isGuide,
    featuredImageUrl: initialData?.featuredImageUrl || "",
    tagsString: initialData?.tagsString || "",
    keyTakeawaysString: initialData?.keyTakeawaysString || "",
    contentMarkdown: initialData?.contentMarkdown || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [stepUp, setStepUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTitleChange = (title: string) => {
    setFormData((prev) => {
      const updates: Partial<ArticleFormData> = { title };
      // Auto-generate slug if creating new
      if (!isEditing && !prev.slug) {
        updates.slug = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }
      return { ...prev, ...updates };
    });
  };

  const handleCategoryChange = (category: string) => {
    const categorySlug = CATEGORY_MAP[category] || "vehicle-safety";
    setFormData((prev) => ({ ...prev, category, categorySlug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.title ||
      !formData.slug ||
      !formData.excerpt ||
      !formData.intro
    ) {
      setErrorMessage(
        "Please complete all required fields (Title, Slug, Excerpt, Intro).",
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      ...formData,
      reason,
      confirmed,
      tags: formData.tagsString
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      keyTakeaways: formData.keyTakeawaysString
        .split("\n")
        .map((k) => k.trim())
        .filter(Boolean),
      author: {
        name: formData.authorName,
        role: formData.authorRole,
      },
    };

    try {
      const url = isEditing ? `/api/articles/${formData.id}` : "/api/articles";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.error?.code === "STEP_UP_REQUIRED") {
          setStepUp(true);
          setIsSubmitting(false);
          return;
        }
        throw new Error(data.error?.message || "Failed to save article.");
      }

      router.push("/articles");
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save article.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Main Metadata */}
      <Card>
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-base font-semibold">
            General Information
          </CardTitle>
          <CardDescription className="text-xs">
            Title, slug URL, and editorial categorization
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="title" className="text-xs font-semibold">
                Article Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Optical Contrast on Automotive Glazing"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug" className="text-xs font-semibold">
                URL Slug <span className="text-red-500">*</span>
              </Label>
              <Input
                id="slug"
                required
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="optical-contrast-automotive-glazing"
              />
              <p className="text-[10px] text-muted-foreground">
                Will be accessible at blog.vaahansafe.com/articles/
                {formData.slug || "slug"}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-semibold">
                Category
              </Label>
              <AdminSelect
                id="category"
                label="Category"
                value={formData.category}
                onValueChange={handleCategoryChange}
                options={Object.keys(CATEGORY_MAP).map((cat) => ({
                  value: cat,
                  label: cat,
                }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="authorName" className="text-xs font-semibold">
                Author Name
              </Label>
              <Input
                id="authorName"
                value={formData.authorName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    authorName: e.target.value,
                  }))
                }
                placeholder="Editorial Board"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="authorRole" className="text-xs font-semibold">
                Author Role
              </Label>
              <Input
                id="authorRole"
                value={formData.authorRole}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    authorRole: e.target.value,
                  }))
                }
                placeholder="Safety & Systems Team"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cloudflare Media Upload */}
      <Card>
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-base font-semibold">
            Cloudflare Media & Cover Image
          </CardTitle>
          <CardDescription className="text-xs">
            Stored in Cloudflare R2 bucket with automated CDN delivery through
            assets.vaahansafe.com
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <CloudflareImageUploader
            value={formData.featuredImageUrl}
            onChange={(url) =>
              setFormData((prev) => ({ ...prev, featuredImageUrl: url }))
            }
            folder={formData.slug || "editorial"}
            label="Hero / Featured Image"
            description="High-resolution image rendered on social cards, header, and search embeds."
          />
        </CardContent>
      </Card>

      {/* Editorial Content */}
      <Card>
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-base font-semibold">
            Editorial Copy
          </CardTitle>
          <CardDescription className="text-xs">
            Introductory leads, excerpts, and main body text
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="excerpt" className="text-xs font-semibold">
              Excerpt (Summary for cards & meta tags){" "}
              <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="excerpt"
              required
              rows={2}
              value={formData.excerpt}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
              }
              placeholder="Short summary describing the article..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deck" className="text-xs font-semibold">
              Deck / Subheading
            </Label>
            <Input
              id="deck"
              value={formData.deck}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, deck: e.target.value }))
              }
              placeholder="Secondary deck line displayed below title..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="intro" className="text-xs font-semibold">
              Introduction Paragraph <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="intro"
              required
              rows={4}
              value={formData.intro}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, intro: e.target.value }))
              }
              placeholder="Primary introductory paragraph setting the context..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contentMarkdown" className="text-xs font-semibold">
              Main Body Content (Markdown)
            </Label>
            <Textarea
              id="contentMarkdown"
              rows={12}
              value={formData.contentMarkdown}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  contentMarkdown: e.target.value,
                }))
              }
              placeholder="Write your article sections, headings (##), bullet points, and markdown here..."
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="keyTakeawaysString"
              className="text-xs font-semibold"
            >
              Key Takeaways (One per line)
            </Label>
            <Textarea
              id="keyTakeawaysString"
              rows={3}
              value={formData.keyTakeawaysString}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  keyTakeawaysString: e.target.value,
                }))
              }
              placeholder="Bullet 1&#10;Bullet 2&#10;Bullet 3"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tagsString" className="text-xs font-semibold">
              Tags (Comma-separated)
            </Label>
            <Input
              id="tagsString"
              value={formData.tagsString}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, tagsString: e.target.value }))
              }
              placeholder="QR Technology, Windshield Glazing, Safety Protocol"
            />
          </div>
        </CardContent>
      </Card>

      {/* Publication & Status */}
      <Card>
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-base font-semibold">
            Publishing Status & Flags
          </CardTitle>
          <CardDescription className="text-xs">
            Control publication visibility and featured flags
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold">
                Status
              </Label>
              <AdminSelect
                id="status"
                label="Status"
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: value as "DRAFT" | "PUBLISHED" | "ARCHIVED",
                  }))
                }
                options={[
                  { value: "DRAFT", label: "Draft" },
                  { value: "PUBLISHED", label: "Published" },
                  { value: "ARCHIVED", label: "Archived" },
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="readingTime" className="text-xs font-semibold">
                Reading Time Text
              </Label>
              <Input
                id="readingTime"
                value={formData.readingTime}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    readingTime: e.target.value,
                  }))
                }
                placeholder="5 min read"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                id="isFeatured"
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isFeatured: e.target.checked,
                  }))
                }
                className="rounded border-slate-300 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
              />
              <Label htmlFor="isFeatured" className="text-xs cursor-pointer">
                Feature on Homepage
              </Label>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                id="isGuide"
                type="checkbox"
                checked={formData.isGuide}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isGuide: e.target.checked,
                  }))
                }
                className="rounded border-slate-300 w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="isGuide" className="text-xs cursor-pointer">
                Practical Guide Flag
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="admin-panel admin-panel-body">
        <label htmlFor="editor-reason">Reason for this editorial change</label>
        <textarea
          id="editor-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          className="w-full mt-2"
        />
        <label className="flex items-center gap-2 mt-3">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          I have reviewed this change and its publication status.
        </label>
        {stepUp && (
          <EmailVerification stepUp onVerified={() => setStepUp(false)} />
        )}
      </section>
      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6"
          disabled={
            isSubmitting || !confirmed || reason.trim().length < 10 || stepUp
          }
        >
          {isSubmitting
            ? "Saving article…"
            : isEditing
              ? "Update Article"
              : "Create Article"}
        </Button>
      </div>
    </form>
  );
}

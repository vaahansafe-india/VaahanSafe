"use client";

import * as React from "react";
import { useState } from "react";
import { HelpCenterHero } from "./HelpCenterHero";
import { HelpQuickActions } from "./HelpQuickActions";
import { HelpCategoriesGrid } from "./HelpCategoriesGrid";
import { HelpArticleModal } from "./HelpArticleModal";
import { HelpBottomContact } from "./HelpBottomContact";
import { HelpArticle } from "../../lib/help/help-content";

export function HelpCenterContainer() {
  const [activeArticle, setActiveArticle] = useState<HelpArticle | null>(null);

  return (
    <>
      {/* 01 Hero with Live Search */}
      <HelpCenterHero onSelectArticle={setActiveArticle} />

      {/* 02 Frequent Tasks & Quick Actions */}
      <HelpQuickActions />

      {/* 03 6 Help Categories Directory */}
      <HelpCategoriesGrid onSelectArticle={setActiveArticle} />

      {/* 04 Bottom Assistance & Navigation */}
      <HelpBottomContact />

      {/* Structured Article Viewer Modal */}
      <HelpArticleModal
        article={activeArticle}
        onClose={() => setActiveArticle(null)}
      />
    </>
  );
}

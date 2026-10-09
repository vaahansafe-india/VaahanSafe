"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AdminIdentity } from "../../lib/contracts";
import type { SidebarView } from "./navigation-model";
import {
  findSectionById,
  getActiveModuleKey,
  getPermittedSections,
  inferSectionFromPathname,
} from "./navigation-utils";
import { AdminSidebarHeader } from "./AdminSidebarHeader";
import { AdminSidebarRoot } from "./AdminSidebarRoot";
import { AdminSidebarSection } from "./AdminSidebarSection";
import { AdminSidebarFooter } from "./AdminSidebarFooter";

export interface AdminSidebarProps {
  identity: AdminIdentity;
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function AdminSidebar({
  identity,
  pathname,
  collapsed = false,
  onNavigate,
}: AdminSidebarProps) {
  const permittedSections = useMemo(
    () => getPermittedSections(identity.role),
    [identity.role],
  );

  const activeModuleKey = getActiveModuleKey(pathname);
  const routeInferredSectionId = inferSectionFromPathname(
    pathname,
    permittedSections,
  );

  // Initialize view: open directly in the section if URL belongs to one
  const [view, setView] = useState<SidebarView>(() => {
    if (routeInferredSectionId) {
      return { type: "section", sectionId: routeInferredSectionId };
    }
    return { type: "root" };
  });

  const [direction, setDirection] = useState<1 | -1>(1);
  const lastSectionIdRef = useRef<string | null>(routeInferredSectionId);
  const sectionButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const registerSectionRef = useCallback(
    (sectionId: string, el: HTMLButtonElement | null) => {
      sectionButtonRefs.current[sectionId] = el;
    },
    [],
  );

  // Synchronize route changes: if user navigates to another section route, update view context
  useEffect(() => {
    if (routeInferredSectionId) {
      setView((prev) => {
        if (prev.type === "section" && prev.sectionId === routeInferredSectionId) {
          return prev; // Stay on same section without re-animating
        }
        lastSectionIdRef.current = routeInferredSectionId;
        return { type: "section", sectionId: routeInferredSectionId };
      });
    } else if (activeModuleKey === "dashboard") {
      // If navigating to Dashboard Overview, transition to root
      setView((prev) => (prev.type === "root" ? prev : { type: "root" }));
    }
  }, [routeInferredSectionId, activeModuleKey]);

  // Drill down from Level 1 to Level 2
  const handleSelectSection = useCallback((sectionId: string) => {
    lastSectionIdRef.current = sectionId;
    setDirection(1);
    setView({ type: "section", sectionId });
  }, []);

  // Return from Level 2 back to Level 1
  const handleBack = useCallback(() => {
    const targetSectionId = lastSectionIdRef.current;
    setDirection(-1);
    setView({ type: "root" });

    // Restore focus to the section trigger button on Level 1
    requestAnimationFrame(() => {
      if (targetSectionId && sectionButtonRefs.current[targetSectionId]) {
        sectionButtonRefs.current[targetSectionId]?.focus();
      }
    });
  }, []);

  // Reset to root (e.g. clicking brand logo)
  const handleResetToRoot = useCallback(() => {
    setDirection(-1);
    setView({ type: "root" });
    onNavigate?.();
  }, [onNavigate]);

  const activeSection =
    view.type === "section"
      ? findSectionById(view.sectionId, permittedSections)
      : undefined;

  return (
    <>
      <AdminSidebarHeader
        collapsed={collapsed}
        onResetToRoot={handleResetToRoot}
      />

      <nav aria-label="Operations workspace sections" className="admin-nav-viewport">
        <AnimatePresence mode="wait" initial={false}>
          {view.type === "root" || !activeSection ? (
            <motion.div
              key="root-nav"
              initial={{ opacity: 0, x: direction * 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -8 }}
              transition={{
                duration: 0.16,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="admin-nav-viewport-motion"
            >
              <AdminSidebarRoot
                sections={permittedSections}
                activeModuleKey={activeModuleKey}
                activeSectionId={routeInferredSectionId}
                onSelectSection={handleSelectSection}
                registerSectionRef={registerSectionRef}
                onNavigate={onNavigate}
                collapsed={collapsed}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`section-${activeSection.id}`}
              initial={{ opacity: 0, x: direction * 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -8 }}
              transition={{
                duration: 0.16,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="admin-nav-viewport-motion"
            >
              <AdminSidebarSection
                section={activeSection}
                activeModuleKey={activeModuleKey}
                onBack={handleBack}
                onNavigate={onNavigate}
                collapsed={collapsed}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AdminSidebarFooter identity={identity} collapsed={collapsed} />
    </>
  );
}

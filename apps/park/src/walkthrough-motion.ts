/** Scroll stays native: the nearest chapter updates the adjacent illustrated panel. */
export function initializeWalkthrough() {
  const root = document.querySelector<HTMLElement>(".walkthrough");
  if (!root) return;
  const chapters = Array.from(
    root.querySelectorAll<HTMLElement>("[data-chapter]"),
  );
  const scenes = Array.from(
    root.querySelectorAll<HTMLElement>("[data-chapter-scene]"),
  );
  const links = Array.from(
    root.querySelectorAll<HTMLAnchorElement>("[data-chapter-link]"),
  );
  let pending = false;
  const update = () => {
    pending = false;
    const center = window.innerHeight * 0.52;
    let active = 0,
      distance = Infinity;
    chapters.forEach((chapter, index) => {
      const bounds = chapter.getBoundingClientRect();
      const next = Math.abs(bounds.top + bounds.height / 2 - center);
      if (next < distance) {
        distance = next;
        active = index;
      }
    });
    scenes.forEach((scene, index) =>
      scene.setAttribute("aria-hidden", String(index !== active)),
    );
    links.forEach((link, index) => {
      if (index === active) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
    });
  };
  const request = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(update);
  };
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  window.addEventListener("pageshow", request);
  update();
}

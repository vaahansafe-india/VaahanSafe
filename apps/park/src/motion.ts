import { animate, inView, scroll } from "framer-motion/dom";

// Framer Motion's DOM entry keeps this static, accessible page free of React hydration.
// Content is visible by default, including when JavaScript is unavailable.
const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
let cleanup: Array<() => void> = [];
function stopMotion() {
  cleanup.forEach((stop) => stop());
  cleanup = [];
  document
    .querySelectorAll<HTMLElement>(
      "[data-reveal], [data-parallax], .reading-progress",
    )
    .forEach((element) => {
      element.style.removeProperty("transform");
      element.style.removeProperty("opacity");
    });
}
function startMotion() {
  stopMotion();
  if (preference.matches) return;
  const seen = new WeakSet<Element>();
  cleanup.push(
    inView(
      "[data-reveal]",
      (element) => {
        if (seen.has(element)) return;
        seen.add(element);
        const animation = animate(
          element,
          { opacity: [0, 1], y: [20, 0] },
          { duration: 0.7, ease: [0.2, 0.65, 0.3, 1] },
        );
        cleanup.push(() => animation.stop());
      },
      { amount: 0.12, margin: "0px 0px -24px 0px" },
    ),
  );
  document
    .querySelectorAll<HTMLElement>("[data-parallax]")
    .forEach((element) => {
      const distance =
        Number(element.dataset.parallax) * (window.innerWidth < 700 ? 0.45 : 1);
      const animation = animate(
        element,
        { y: [-distance, distance], scale: 1.08 },
        { ease: "linear" },
      );
      const target =
        element.closest<HTMLElement>("[data-parallax-frame]") || element;
      cleanup.push(
        scroll(animation, { target, offset: ["start end", "end start"] }),
      );
      cleanup.push(() => animation.stop());
    });
  const progress = animate(
    ".reading-progress",
    { scaleX: [0, 1] },
    { ease: "linear" },
  );
  cleanup.push(scroll(progress));
  cleanup.push(() => progress.stop());
}
startMotion();
preference.addEventListener("change", startMotion);
window.addEventListener("pagehide", stopMotion);
window.addEventListener("pageshow", (event) => {
  if (event.persisted) startMotion();
});

const menu = document.querySelector<HTMLDetailsElement>(".mobile-menu");
menu?.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    menu.open = false;
  }),
);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menu?.open) {
    menu.open = false;
    menu.querySelector("summary")?.focus();
  }
});

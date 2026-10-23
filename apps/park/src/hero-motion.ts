import { animate } from "framer-motion/dom";

export function initializeHero(preference: MediaQueryList) {
  const root = document.querySelector<HTMLElement>("[data-hero]");
  if (!root) return;
  const slides = Array.from(
    root.querySelectorAll<HTMLElement>("[data-hero-slide]"),
  );
  const dots = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-hero-dot]"),
  );
  const pause = root.querySelector<HTMLButtonElement>("[data-hero-pause]")!;
  const caption = root.querySelector<HTMLElement>("[data-hero-caption]")!;
  const status = root.querySelector<HTMLElement>("[data-hero-status]")!;
  let index = 0,
    paused = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let transitions: Array<ReturnType<typeof animate>> = [];
  root.dataset.enhanced = "true";
  // Warm the upcoming backgrounds before the first crossfade, without blocking the hero.
  slides.forEach((slide) => {
    slide.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
      image.loading = "eager";
    });
  });
  function show(next: number, manual = false) {
    const previous = index;
    index = (next + slides.length) % slides.length;
    transitions.forEach((animation) => animation.stop());
    transitions = [];
    slides.forEach((slide, i) => {
      slide.hidden = false;
      const active = i === index;
      slide.style.zIndex = active ? "1" : "0";
      if (preference.matches) slide.style.opacity = active ? "1" : "0";
      else if (active || i === previous)
        transitions.push(
          animate(
            slide,
            { opacity: active ? [0, 1] : [1, 0] },
            { duration: 1.35, ease: "easeInOut" },
          ),
        );
      else slide.style.opacity = "0";
    });
    dots.forEach((dot, i) =>
      dot.setAttribute("aria-current", String(i === index)),
    );
    caption.textContent = slides[index].dataset.caption || "";
    if (manual)
      status.textContent = `Background ${index + 1} of ${slides.length}: ${caption.textContent}`;
  }
  function schedule() {
    clearTimeout(timer);
    pause.disabled = preference.matches;
    pause.setAttribute("aria-pressed", String(paused || preference.matches));
    pause.setAttribute(
      "aria-label",
      preference.matches
        ? "Background motion disabled for reduced motion"
        : paused
          ? "Play background slideshow"
          : "Pause background slideshow",
    );
    root!.querySelector<HTMLElement>("[data-hero-play-label]")!.textContent =
      preference.matches ? "Still view" : paused ? "Play" : "Pause";
    root!.querySelector<HTMLElement>("[data-hero-play-icon]")!.hidden =
      !paused || preference.matches;
    root!.querySelector<HTMLElement>("[data-hero-pause-icon]")!.hidden =
      paused && !preference.matches;
    if (paused || preference.matches || document.hidden) return;
    timer = setTimeout(() => {
      const bounds = root!.getBoundingClientRect();
      const visible =
        bounds.bottom > window.innerHeight * 0.3 &&
        bounds.top < window.innerHeight * 0.7;
      const controls = root!.querySelector(".hero-scene-controls");
      if (
        visible &&
        !root!.contains(document.activeElement) &&
        !controls?.matches(":hover")
      )
        show(index + 1);
      schedule();
    }, 8000);
  }
  dots.forEach((dot, i) =>
    dot.addEventListener("click", () => {
      paused = true;
      show(i, true);
      schedule();
    }),
  );
  pause.addEventListener("click", () => {
    paused = !paused;
    schedule();
  });
  document.addEventListener("visibilitychange", schedule);
  preference.addEventListener("change", () => {
    transitions.forEach((animation) => animation.stop());
    slides.forEach((slide, i) => {
      slide.hidden = i !== index;
      slide.style.opacity = i === index ? "1" : "0";
    });
    schedule();
  });
  window.addEventListener("pagehide", () => {
    clearTimeout(timer);
    transitions.forEach((animation) => animation.stop());
  });
  window.addEventListener("pageshow", schedule);
  schedule();
}

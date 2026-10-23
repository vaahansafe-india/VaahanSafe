import { animate, inView } from "framer-motion/dom";

export function initializeGallery(preference: MediaQueryList) {
  const root = document.querySelector<HTMLElement>("[data-gallery]");
  const track = root?.querySelector<HTMLElement>("[data-gallery-track]");
  if (!root || !track) return;
  const slides = Array.from(
    root.querySelectorAll<HTMLElement>(".gallery-slide"),
  );
  const dots = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-gallery-dot]"),
  );
  const pause = root.querySelector<HTMLButtonElement>("[data-gallery-pause]")!;
  const title = root.querySelector<HTMLElement>("[data-gallery-title]")!;
  const note = root.querySelector<HTMLElement>("[data-gallery-note]")!;
  const counter = root.querySelector<HTMLElement>("[data-gallery-counter]")!;
  const status = root.querySelector<HTMLElement>("[data-gallery-status]")!;
  let index = 0,
    userPaused = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let transition: ReturnType<typeof animate> | undefined;
  let touch: { x: number; y: number } | null = null;
  root.dataset.enhanced = "true";
  const schedule = () => {
    clearTimeout(timer);
    pause.disabled = preference.matches;
    pause.setAttribute(
      "aria-pressed",
      String(userPaused || preference.matches),
    );
    pause.setAttribute(
      "aria-label",
      preference.matches
        ? "Automatic sliding disabled for reduced motion"
        : userPaused
          ? "Play gallery"
          : "Pause gallery",
    );
    root.querySelector<HTMLElement>("[data-gallery-play-label]")!.textContent =
      preference.matches ? "Still view" : userPaused ? "Play" : "Pause";
    root.querySelector<HTMLElement>("[data-gallery-play-icon]")!.hidden =
      !userPaused || preference.matches;
    root.querySelector<HTMLElement>("[data-gallery-pause-icon]")!.hidden =
      userPaused && !preference.matches;
    if (userPaused || preference.matches || document.hidden) return;
    timer = setTimeout(() => {
      // Read current DOM conditions instead of caching pointer/focus events:
      // layout shifts and native anchor navigation can move the gallery under a pointer.
      const bounds = root.getBoundingClientRect();
      const visibleHeight =
        Math.min(bounds.bottom, window.innerHeight) - Math.max(bounds.top, 0);
      const visible =
        visibleHeight >= Math.min(bounds.height, window.innerHeight) * 0.3;
      const hovered =
        window.matchMedia("(hover: hover)").matches && root.matches(":hover");
      const focused = root.contains(document.activeElement);
      if (visible && !hovered && !focused && !document.hidden) show(index + 1);
      schedule();
    }, 7000);
  };
  const show = (next: number, manual = false) => {
    index = (next + slides.length) % slides.length;
    transition?.stop();
    if (preference.matches)
      track.style.transform = `translateX(-${index * 100}%)`;
    else
      transition = animate(
        track,
        { x: `-${index * 100}%` },
        { duration: 0.8, ease: [0.22, 0.65, 0.3, 1] },
      );
    slides.forEach((slide, i) =>
      slide.setAttribute("aria-hidden", String(i !== index)),
    );
    dots.forEach((dot, i) =>
      dot.setAttribute("aria-current", String(i === index)),
    );
    title.textContent = slides[index].dataset.title || "";
    note.textContent = slides[index].dataset.note || "";
    counter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    if (manual)
      status.textContent = `Illustration ${index + 1} of ${slides.length}: ${title.textContent}`;
  };
  const manual = (next: number) => {
    userPaused = true;
    show(next, true);
    schedule();
  };
  root
    .querySelector("[data-gallery-prev]")
    ?.addEventListener("click", () => manual(index - 1));
  root
    .querySelector("[data-gallery-next]")
    ?.addEventListener("click", () => manual(index + 1));
  dots.forEach((dot, i) => dot.addEventListener("click", () => manual(i)));
  pause.addEventListener("click", () => {
    userPaused = !userPaused;
    schedule();
  });
  root
    .querySelector(".gallery-window")
    ?.addEventListener("pointerdown", (event) => {
      const e = event as PointerEvent;
      if (e.pointerType !== "mouse") touch = { x: e.clientX, y: e.clientY };
    });
  root.addEventListener("pointerup", (event) => {
    if (!touch) return;
    const dx = event.clientX - touch.x,
      dy = event.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3)
      manual(index + (dx < 0 ? 1 : -1));
  });
  root.addEventListener("pointercancel", () => {
    touch = null;
  });
  inView(
    root,
    () => {
      root
        .querySelectorAll<HTMLImageElement>(".gallery-slide img")
        .forEach((image) => {
          image.loading = "eager";
        });
    },
    { amount: 0.3 },
  );
  document.addEventListener("visibilitychange", schedule);
  preference.addEventListener("change", () => {
    show(index);
    schedule();
  });
  window.addEventListener("pagehide", () => {
    clearTimeout(timer);
    transition?.stop();
  });
  window.addEventListener("pageshow", schedule);
  schedule();
}

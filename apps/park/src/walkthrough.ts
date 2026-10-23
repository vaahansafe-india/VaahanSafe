import { icon } from "./icons";
const features = [
  {
    id: "save",
    tag: "SAVE YOUR SPOT",
    title: "Your parking location. Saved in seconds.",
    copy: "Choose your vehicle and save your current GPS location, with your phone’s reported accuracy clearly visible.",
    image: "park-neighbourhood",
    alt: "Illustration of a car parked along a leafy neighbourhood street",
    glyph: "location" as const,
  },
  {
    id: "remember",
    tag: "KEEP THE DETAILS",
    title: "The floor. The bay. Everything in one place.",
    copy: "Add the landmark you’ll recognise, the floor you chose and the bay you parked in. Give your future self a helpful note.",
    image: "park-cafe",
    alt: "Illustration of a car parked outside a neighbourhood café",
    glyph: "note" as const,
  },
  {
    id: "return",
    tag: "FIND YOUR WAY BACK",
    title: "A map that takes the whole picture in.",
    copy: "Open a full-page map, switch to satellite, check saved details and follow walking directions to your parking spot.",
    image: "park-coast",
    alt: "Illustration of a parked car beside a coastal promenade",
    glyph: "route" as const,
  },
];
export function walkthrough() {
  return `<section class="products-section" id="how-it-works"><div class="wrap"><div class="section-heading" data-reveal><span class="eyebrow">YOUR EVERYDAY PARKING TOOLKIT</span><h2>Everything you need to park.<br><em>And find your way back.</em></h2><p>A simple set of tools. Built into your existing VaahanSafe account.</p></div><div class="product-cards">${features.map((f) => `<article id="${f.id}" class="product-card" data-reveal><div class="product-card-art"><img src="/art/${f.image}-800.webp" width="800" height="450" loading="lazy" alt="${f.alt}"></div><div class="product-card-body"><span class="product-label">${icon(f.glyph, 18)}${f.tag}</span><h3>${f.title}</h3><p>${f.copy}</p><a href="/workspace" class="quiet-link">Get started ${icon("next", 16)}</a></div></article>`).join("")}</div></div></section>`;
}

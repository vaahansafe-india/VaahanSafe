import { icon } from "./icons";

const chapters = [
  {
    id: "save",
    number: "01",
    name: "Save your spot",
    title: "A place saved.<br>A day opened up.",
    copy: "Choose your vehicle. Save your current location. Park keeps the pin and your phone’s reported GPS accuracy together, in your private notebook.",
    detail: "A deliberate save. No continuous tracking.",
    image: "park-neighbourhood",
    alt: "Watercolour of a car and scooter on a leafy Indian street",
    label: "THE EVERYDAY STOP",
    glyph: "location" as const,
  },
  {
    id: "remember",
    number: "02",
    name: "Keep the details",
    title: "The floor. The bay.<br>The little things.",
    copy: "Keep the landmark you’ll recognise, the floor you chose, and the bay you parked in. Set a return-by countdown for a little perspective on time.",
    detail: "Your timer updates while Park is open.",
    image: "park-cafe",
    alt: "Watercolour of a car and scooter outside a neighbourhood café",
    label: "A LITTLE LONGER AT LUNCH",
    glyph: "note" as const,
  },
  {
    id: "return",
    number: "03",
    name: "Find your way back",
    title: "Your way back.<br>Beautifully clear.",
    copy: "Give your map the whole page. Bring your notes into view, switch between road and satellite, or open walking directions to your saved parking spot.",
    detail: "Google Maps loads when you choose.",
    image: "park-coast",
    alt: "Watercolour of a parked car beside a palm-lined coastal promenade",
    label: "THE SCENIC WAY BACK",
    glyph: "route" as const,
  },
];

export function walkthrough() {
  return `<section id="how-it-works" class="walkthrough section" aria-labelledby="walkthrough-title"><div class="wrap"><div class="walkthrough-heading" data-reveal><span class="eyebrow">SMALL EFFORT. EVERYDAY EASE.</span><h2 id="walkthrough-title">One stop.<br><em>Every detail, together.</em></h2><p>From the moment you park to the moment you return.</p></div><div class="walkthrough-grid"><div class="walkthrough-sticky"><div class="chapter-art" aria-label="Illustrated everyday parking scenes">${chapters.map((c, i) => `<figure class="chapter-scene" data-chapter-scene="${i}" aria-hidden="${i !== 0}"><img src="/art/${c.image}-800.webp" width="800" height="450" loading="lazy" alt="${c.alt}"><figcaption><span>${c.number} / ${c.label}</span>${icon(c.glyph, 20)}</figcaption></figure>`).join("")}</div><nav class="chapter-nav" aria-label="Parking walkthrough">${chapters.map((c, i) => `<a href="#${c.id}" data-chapter-link="${i}" ${i === 0 ? 'aria-current="step"' : ""}><span>${c.number}</span>${c.name}${icon("next", 14)}</a>`).join("")}</nav><span class="chapter-disclosure">ILLUSTRATED SCENES / YOUR SAVED PLACES STAY PRIVATE</span></div><div class="chapter-copy">${chapters.map((c, i) => `<article id="${c.id}" class="chapter" data-chapter="${i}"><div class="chapter-mobile-art"><img src="/art/${c.image}-800.webp" width="800" height="450" loading="lazy" alt="${c.alt}"></div><div class="chapter-text" data-reveal><span class="chapter-kicker">${icon(c.glyph, 22)}<span>${c.number} / ${c.name.toUpperCase()}</span></span><h3>${c.title}</h3><p>${c.copy}</p><span class="chapter-detail">${icon("shield", 15)}${c.detail}</span><a class="quiet-link" href="/workspace">Open your notebook ${icon("next", 16)}</a></div></article>`).join("")}</div></div></div></section>`;
}

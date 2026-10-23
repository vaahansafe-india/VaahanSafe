import { icon } from "./icons";
const scenes = [
  {
    file: "park-neighbourhood",
    width: 1672,
    height: 941,
    title: "The familiar lane.",
    note: "A small pause, right around the corner.",
    alt: "Watercolour of a parked ivory car along a leafy Indian neighbourhood lane",
  },
  {
    file: "park-cafe",
    width: 1600,
    height: 900,
    title: "The long lunch.",
    note: "Leave the car. Stay for another chapter.",
    alt: "Watercolour of an ivory car and olive scooter outside a leafy street café and bookshop",
  },
  {
    file: "park-coast",
    width: 1600,
    height: 900,
    title: "The unplanned detour.",
    note: "A little closer to the sea. A little further from the rush.",
    alt: "Watercolour of a parked ivory car beside a palm-lined coastal promenade and blue-green sea",
  },
];
export function gallery() {
  return `<section id="journal" class="wrap section illustrated-gallery" aria-labelledby="gallery-title" data-gallery>
<div class="section-heading" data-reveal><div><span class="eyebrow">PLACES WE PAUSE / AN ILLUSTRATED JOURNAL</span><h2 id="gallery-title">Everyday.<br><em>Somewhere new.</em></h2></div><p>A slow morning. A familiar lane. A little detour.<br>Make room for the moments in between.</p></div>
<div class="gallery-paper" data-reveal><div class="gallery-edition"><span>THE EVERYDAY JOURNEY</span><span>VAAHANSAFE / PARK</span></div>
<div class="gallery-window" role="region" aria-roledescription="carousel" aria-label="Illustrated everyday places"><div class="gallery-track" data-gallery-track>
${scenes.map((scene, i) => `<figure class="gallery-slide" data-title="${scene.title}" data-note="${scene.note}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${scenes.length}" ${i ? 'aria-hidden="true"' : ""}><img src="/art/${scene.file}.webp" srcset="/art/${scene.file}-800.webp 800w, /art/${scene.file}.webp ${scene.width}w" sizes="(max-width: 600px) calc(100vw - 68px), min(1120px, 90vw)" width="${scene.width}" height="${scene.height}" loading="lazy" alt="${scene.alt}"></figure>`).join("")}
</div></div>
<div class="gallery-footer"><div class="gallery-caption"><h3 data-gallery-title>The familiar lane.</h3><p data-gallery-note>A small pause, right around the corner.</p></div><div class="gallery-controls"><div class="gallery-pagination"><span data-gallery-counter>01 / 03</span><div class="gallery-dots" role="group" aria-label="Choose an illustration">${scenes.map((scene, i) => `<button type="button" data-gallery-dot="${i}" aria-label="Show illustration ${i + 1}: ${scene.title}" aria-current="${i === 0}"><span></span></button>`).join("")}</div></div><div class="gallery-buttons"><button type="button" data-gallery-prev aria-label="Previous illustration">${icon("previous", 18)}</button><button type="button" data-gallery-pause aria-label="Pause gallery" aria-pressed="false"><span data-gallery-pause-icon>${icon("pause", 15)}</span><span data-gallery-play-icon hidden>${icon("play", 15)}</span><span data-gallery-play-label>Pause</span></button><button type="button" data-gallery-next aria-label="Next illustration">${icon("next", 18)}</button></div></div></div>
<p class="gallery-disclosure">ORIGINAL EDITORIAL ILLUSTRATIONS / NOT CUSTOMER PARKING PHOTOS</p><span class="sr-only" data-gallery-status role="status" aria-live="polite"></span></div></section>`;
}

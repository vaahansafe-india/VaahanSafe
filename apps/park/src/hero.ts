import { icon } from "./icons";

const scenes = [
  {
    file: "park-dawn-overlook",
    title: "A slower start.",
    alt: "Watercolour of a sage-green car at a misty hill-town overlook",
  },
  {
    file: "park-evening-boulevard",
    title: "An evening, yours.",
    alt: "Watercolour of a blue car along an Indian city boulevard at dusk",
  },
  {
    file: "park-garden-arrival",
    title: "Room to wander.",
    alt: "Watercolour of an ochre car beside a sunlit botanical garden entrance",
  },
];

export function hero() {
  return `<section class="immersive-hero" aria-labelledby="hero-title" data-hero data-parallax-frame>
<div class="hero-backgrounds" data-parallax="32" aria-hidden="true">${scenes.map((scene, i) => `<div class="hero-background" data-hero-slide="${i}" data-caption="${scene.title}" ${i ? "hidden" : ""}><img src="/art/${scene.file}.webp" srcset="/art/${scene.file}-800.webp 800w, /art/${scene.file}.webp 1600w" sizes="100vw" width="1600" height="900" alt="" ${i ? 'loading="lazy" fetchpriority="low"' : 'fetchpriority="high"'}></div>`).join("")}</div>
<div class="hero-shade" aria-hidden="true"></div>
<div class="wrap immersive-copy"><span class="eyebrow" data-reveal>YOUR PRIVATE PARKING COMPANION</span><h1 id="hero-title" data-reveal>Park smarter.<br><em>Get on with your day.</em></h1><p class="immersive-lead" data-reveal>Save your parking location, keep the details that matter,<br>and find your way back with Google Maps.</p><div class="hero-actions" data-reveal><a class="button button-primary" href="/workspace">Open Park ${icon("next", 18)}</a><a class="hero-explore" href="#how-it-works">See how it works ${icon("down", 16)}</a></div><p class="immersive-privacy" data-reveal>${icon("lock", 14)} Your VaahanSafe account. Your places. Just for you.</p></div>
<div class="hero-bottom wrap"><a class="hero-scroll" href="#how-it-works">${icon("down", 17)}<span>SCROLL TO DISCOVER</span></a><div class="hero-scene-controls"><span class="hero-scene-caption" data-hero-caption>A slower start.</span><div class="hero-scene-dots" role="group" aria-label="Choose a background illustration">${scenes.map((scene, i) => `<button type="button" data-hero-dot="${i}" aria-label="Background ${i + 1}: ${scene.title}" aria-current="${i === 0}"><span></span></button>`).join("")}</div><button class="hero-pause" type="button" data-hero-pause aria-label="Pause background slideshow" aria-pressed="false"><span data-hero-pause-icon>${icon("pause", 16)}</span><span data-hero-play-icon hidden>${icon("play", 16)}</span><span data-hero-play-label>Pause</span></button></div></div>
<span class="hero-art-credit">ORIGINAL EDITORIAL ILLUSTRATIONS</span><span class="sr-only" data-hero-status role="status" aria-live="polite"></span></section>`;
}

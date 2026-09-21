import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VaahanSafe Journal",
    short_name: "VaahanSafe",
    description:
      "Guides for the road, the vehicle, and the identity. Field notes on vehicle safety, privacy, and emergency response.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF9F5",
    theme_color: "#FAF9F5",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

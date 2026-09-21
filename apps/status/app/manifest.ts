import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VaahanSafe Service Status",
    short_name: "VaahanSafe Status",
    description: "Public service status, System Pulse journey health, and incident timeline for VaahanSafe.",
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

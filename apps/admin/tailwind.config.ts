import type { Config } from "tailwindcss";
import vaahanSafePreset from "../../packages/ui/tailwind.preset.js";

const config: Config = {
  presets: [vaahanSafePreset],
  content: {
    relative: true,
    files: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
      "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
    ],
  },
};

export default config;

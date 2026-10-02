import type { Config } from "tailwindcss";
import vaahanSafePreset from "../../packages/ui/tailwind.preset.js";

const config: Config = {
    darkMode: ["class"],
    presets: [vaahanSafePreset],
  content: {
    relative: true,
    files: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
      "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
    ],
  },
    theme: {
    	extend: {
    		borderRadius: {
    			DEFAULT: "4px",
    			sm: "4px",
    			md: "4px",
    			lg: "4px",
    			xl: "4px",
    			"2xl": "4px",
    			"3xl": "4px",
    		},
    		colors: {
    			sidebar: {
    				DEFAULT: 'hsl(var(--sidebar-background))',
    				foreground: 'hsl(var(--sidebar-foreground))',
    				primary: 'hsl(var(--sidebar-primary))',
    				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
    				accent: 'hsl(var(--sidebar-accent))',
    				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
    				border: 'hsl(var(--sidebar-border))',
    				ring: 'hsl(var(--sidebar-ring))'
    			}
    		}
    	}
    }
};

export default config;

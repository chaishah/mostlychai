import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
        display: ["var(--font-display)", ...defaultTheme.fontFamily.serif],
      },
      colors: {
        // Cool linen — slightly blue-gray, not warm cream
        cream: {
          50:  "oklch(99.2% 0.003 250)",
          100: "oklch(97.2% 0.005 248)",
          200: "oklch(91%   0.008 246)",
          300: "oklch(83.5% 0.011 243)",
        },
        // Deep navy-black — the dried ink of a fountain pen
        ink: {
          DEFAULT: "oklch(17%  0.028 265)",
          soft:    "oklch(42%  0.024 262)",
          faint:   "oklch(62%  0.017 258)",
        },
        // Rich indigo — Waterman blue-black ink
        spice: {
          DEFAULT: "oklch(50%  0.24 265)",
          light:   "oklch(93.5% 0.055 265)",
          muted:   "oklch(67%  0.15 265)",
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: "oklch(17% 0.028 265)",
            fontFamily: "var(--font-display), serif",
            lineHeight: "1.8",
            a: {
              color: "oklch(17% 0.028 265)",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
              textDecorationColor: "oklch(67% 0.15 265)",
              "&:hover": { color: "oklch(50% 0.24 265)" },
            },
            "h1, h2, h3, h4": {
              fontFamily: "var(--font-display), serif",
              fontWeight: "400",
              color: "oklch(17% 0.028 265)",
            },
            blockquote: {
              borderLeftColor: "oklch(83.5% 0.011 243)",
              color: "oklch(42% 0.024 262)",
              fontStyle: "italic",
            },
            code: {
              backgroundColor: "oklch(91% 0.008 246)",
              borderRadius: "4px",
              padding: "2px 6px",
              fontWeight: "400",
              fontSize: "0.88em",
              color: "oklch(35% 0.20 265)",
              "&::before": { content: '""' },
              "&::after": { content: '""' },
            },
            "pre code": {
              backgroundColor: "transparent",
              padding: "0",
              color: "inherit",
            },
            pre: {
              backgroundColor: "oklch(91% 0.008 246)",
              color: "oklch(17% 0.028 265)",
            },
            hr: {
              borderColor: "oklch(91% 0.008 246)",
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;

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
        cream: {
          50:  "oklch(98.5% 0.005 75)",
          100: "oklch(96.5% 0.009 75)",
          200: "oklch(91.5% 0.014 72)",
          300: "oklch(85% 0.018 70)",
        },
        ink: {
          DEFAULT: "oklch(21% 0.016 52)",
          soft:    "oklch(46% 0.018 52)",
          faint:   "oklch(65% 0.014 52)",
        },
        spice: {
          DEFAULT: "oklch(52% 0.145 38)",
          light:   "oklch(88% 0.07 38)",
          muted:   "oklch(72% 0.08 38)",
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: "oklch(21% 0.016 52)",
            fontFamily: "var(--font-display), serif",
            lineHeight: "1.8",
            a: {
              color: "oklch(21% 0.016 52)",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
              textDecorationColor: "oklch(72% 0.08 38)",
              "&:hover": { color: "oklch(52% 0.145 38)" },
            },
            "h1, h2, h3, h4": {
              fontFamily: "var(--font-display), serif",
              fontWeight: "400",
              color: "oklch(21% 0.016 52)",
            },
            blockquote: {
              borderLeftColor: "oklch(85% 0.018 70)",
              color: "oklch(46% 0.018 52)",
              fontStyle: "italic",
            },
            code: {
              backgroundColor: "oklch(91.5% 0.014 72)",
              borderRadius: "4px",
              padding: "2px 6px",
              fontWeight: "400",
              fontSize: "0.88em",
              color: "oklch(35% 0.12 38)",
              "&::before": { content: '""' },
              "&::after": { content: '""' },
            },
            "pre code": {
              backgroundColor: "transparent",
              padding: "0",
              color: "inherit",
            },
            pre: {
              backgroundColor: "oklch(91.5% 0.014 72)",
              color: "oklch(21% 0.016 52)",
            },
            hr: {
              borderColor: "oklch(91.5% 0.014 72)",
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;

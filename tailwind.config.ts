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
        sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
        serif: ["var(--font-lora)", ...defaultTheme.fontFamily.serif],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: "#242424",
            a: {
              color: "#242424",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
              "&:hover": { color: "#555" },
            },
            "h1, h2, h3, h4": {
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontWeight: "600",
            },
            blockquote: {
              borderLeftColor: "#d4d4d4",
              color: "#737373",
              fontStyle: "italic",
            },
            code: {
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
              padding: "2px 5px",
              fontWeight: "400",
              "&::before": { content: '""' },
              "&::after": { content: '""' },
            },
            "pre code": {
              backgroundColor: "transparent",
              padding: "0",
            },
            pre: {
              backgroundColor: "#f5f5f5",
              color: "#242424",
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;

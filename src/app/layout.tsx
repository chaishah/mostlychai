import type { Metadata } from "next";
import { Instrument_Serif, DM_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import "highlight.js/styles/atom-one-light.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mostlychai.com"),
  title: {
    default: "mostlychai",
    template: "%s - mostlychai",
  },
  description: "Chai's personal blog.",
  openGraph: {
    siteName: "mostlychai",
    type: "website",
  },
  twitter: {
    card: "summary",
  },
  alternates: {
    types: {
      "application/rss+xml": "https://mostlychai.com/feed.xml",
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${dmSans.variable}`}>
      <body className="bg-cream-100 text-ink font-sans min-h-screen flex flex-col">
        <header className="border-b border-cream-200">
          <div className="max-w-2xl mx-auto px-6 py-5 flex items-center justify-between">
            <Link
              href="/"
              className="font-display italic text-xl text-ink hover:text-spice transition-colors duration-200"
            >
              mostlychai
            </Link>
            <div className="flex items-center gap-5">
              <Link
                href="/archive"
                className="text-xs font-sans tracking-widest uppercase text-ink-faint hover:text-spice transition-colors duration-200"
              >
                Archive
              </Link>
              <a
                href="/feed.xml"
                title="RSS feed"
                className="text-ink-faint hover:text-spice transition-colors duration-200"
                aria-label="Subscribe via RSS"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z" />
                </svg>
              </a>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-cream-200 mt-24 py-8">
          <div className="max-w-2xl mx-auto px-6 text-xs text-ink-faint">
            © {new Date().getFullYear()} Chai
          </div>
        </footer>
      </body>
    </html>
  );
}

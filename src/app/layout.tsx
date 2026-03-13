import type { Metadata } from "next";
import { Instrument_Serif, DM_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${dmSans.variable}`}>
      <body className="bg-cream-100 text-ink font-sans min-h-screen flex flex-col">
        <header className="border-b border-cream-200">
          <div className="max-w-2xl mx-auto px-6 py-5">
            <Link
              href="/"
              className="font-display italic text-xl text-ink hover:text-spice transition-colors duration-200"
            >
              mostlychai
            </Link>
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

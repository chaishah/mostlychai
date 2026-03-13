import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mostlychai.com"),
  title: {
    default: "mostly chai",
    template: "%s — mostly chai",
  },
  description: "Chai's personal blog.",
  openGraph: {
    siteName: "mostly chai",
    type: "website",
  },
  twitter: {
    card: "summary",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body className="bg-white text-neutral-900 font-sans min-h-screen">
        <header className="border-b border-neutral-200">
          <div className="max-w-2xl mx-auto px-6 py-5 flex items-center justify-between">
            <a href="/" className="font-semibold text-lg tracking-tight hover:opacity-70 transition-opacity">
              mostly chai
            </a>
            <nav className="flex gap-6 text-sm text-neutral-500">
              <a href="/" className="hover:text-neutral-900 transition-colors">Writing</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-neutral-100 mt-24 py-8">
          <div className="max-w-2xl mx-auto px-6 text-sm text-neutral-400">
            © {new Date().getFullYear()} Chai
          </div>
        </footer>
      </body>
    </html>
  );
}

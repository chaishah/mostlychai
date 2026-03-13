import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <p className="text-xs text-spice tracking-widest uppercase mb-5 font-sans">404</p>
      <h1 className="font-display text-5xl leading-tight mb-5">Page not found.</h1>
      <p className="text-ink-soft leading-relaxed text-lg mb-8 max-w-lg">
        This page doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-spice transition-colors duration-200 tracking-widest uppercase font-sans"
      >
        <span aria-hidden="true">←</span>
        <span>Back home</span>
      </Link>
    </div>
  );
}

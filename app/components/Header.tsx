"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const NAV_LINKS = [
  { href: "/menu", label: "Menu" },
  { href: "/majita-monday", label: "Majita Monday" },
  { href: "/#upcoming-events", label: "Events" },
  { href: "/#gallery", label: "Gallery" },
  { href: "/book-a-stall", label: "Book a Stall" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="chicken-site-header sticky top-0 z-[100] bg-char-black/95 backdrop-blur-sm border-b border-bone/10 px-4 md:px-6"
    >
      <div className="max-w-6xl mx-auto h-full flex items-center justify-between">
        {/* Logo Link Container */}
        <Link
          href="/"
          className="flex items-center h-full shrink-0 focus-visible:outline focus-visible:outline-3 focus-visible:outline-char"
        >
          {/* Inline style used deliberately here, not Tailwind classes —
              this project has a real, repeated issue where certain
              Tailwind size classes silently fail to compile in this
              specific file. Inline style cannot silently fail: what's
              written here is exactly what renders, guaranteed. */}
          <div className="chicken-site-logo">
            <Image
              src="/logo/tcb-logo-white.png"
              alt="The Chicken Bar — home"
              fill
              priority
              sizes="(max-width: 767px) 220px, 320px"
              style={{ objectFit: "contain", objectPosition: "left" }}
            />
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-bone/70 hover:text-char transition-colors whitespace-nowrap"
              style={{ fontSize: "20px" }}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="/menu"
            className="font-body font-semibold text-xs uppercase tracking-wide bg-flame text-bone px-4 py-2 rounded-sm hover:bg-ember transition-colors whitespace-nowrap focus-visible:outline focus-visible:outline-3 focus-visible:outline-char"
          >
            Order Now
          </a>
        </nav>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          className="md:hidden text-bone text-2xl focus-visible:outline focus-visible:outline-3 focus-visible:outline-char"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <nav className="md:hidden max-w-6xl mx-auto py-3 flex flex-col gap-2 border-t border-bone/10 bg-char-black/95">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="font-body text-bone/80 text-sm py-1"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="/menu"
            className="font-body font-semibold text-xs uppercase tracking-wide bg-flame text-bone px-4 py-2 rounded-sm text-center mt-1"
          >
            Order Now
          </a>
        </nav>
      )}
    </header>
  );
}

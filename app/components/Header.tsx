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
    /* overflow-visible allows the logo to bleed outside the header boundaries */
    <header className="sticky top-0 z-30 bg-char-black/95 backdrop-blur-sm border-b border-bone/10 px-6 overflow-visible">
      <div className="max-w-6xl mx-auto h-14 flex items-center justify-between relative">
        <Link 
          href="/" 
          className="relative z-10 flex items-center shrink-0 focus-visible:outline focus-visible:outline-3 focus-visible:outline-char"
        >
          {/* Absolute positioning lets the logo grow large and float downward into the hero section */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 w-36 md:w-44 h-auto drop-shadow-md">
            <Image
              src="/logo/tcb-logo-white.png"
              alt="The Chicken Bar — home"
              width={412}
              height={100}
              priority
              className="w-full h-auto object-contain"
            />
          </div>
        </Link>

        {/* Added ml-auto/pl-40 to give room for the floating logo on desktop */}
        <nav className="hidden md:flex items-center gap-6 ml-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-sm text-bone/70 hover:text-char transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://wa.me/27658012302"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body font-semibold text-xs uppercase tracking-wide bg-flame text-bone px-3 py-1.5 rounded-sm hover:bg-ember transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-char"
          >
            Contact Us
          </a>
        </nav>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          className="md:hidden text-bone text-xl focus-visible:outline focus-visible:outline-3 focus-visible:outline-char"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <nav className="md:hidden max-w-6xl mx-auto py-3 flex flex-col gap-2 border-t border-bone/10">
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
            href="https://wa.me/27658012302"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body font-semibold text-xs uppercase tracking-wide bg-flame text-bone px-4 py-2 rounded-sm text-center mt-1"
          >
            Contact Us
          </a>
        </nav>
      )}
    </header>
  );
}

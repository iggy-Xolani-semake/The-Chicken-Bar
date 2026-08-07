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
    <header className="sticky top-0 z-30 bg-char-black/95 backdrop-blur-sm border-b border-bone/10 px-6 py-2">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center focus-visible:outline focus-visible:outline-3 focus-visible:outline-char">
          <Image
            src="/logo/tcb-logo-white.png"
            alt="The Chicken Bar — home"
            width={412}
            height={182}
            priority
            className="h-24 w-auto"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-sm text-bone/70 hover:text-char"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://wa.me/27658012302"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body font-semibold text-sm uppercase tracking-wide bg-flame text-bone px-4 py-2 rounded-sm hover:bg-ember transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-char"
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
          className="md:hidden text-bone text-2xl focus-visible:outline focus-visible:outline-3 focus-visible:outline-char"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {menuOpen && (
        <nav className="md:hidden max-w-6xl mx-auto mt-3 pb-2 flex flex-col gap-3">
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
            className="font-body font-semibold text-sm uppercase tracking-wide bg-flame text-bone px-4 py-2 rounded-sm text-center mt-1"
          >
            Contact Us
          </a>
        </nav>
      )}
    </header>
  );
}

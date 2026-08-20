import type { Metadata } from "next";
import localFont from "next/font/local";
import SiteChrome from "@/app/components/SiteChrome";
import "./globals.css";

// Fonts are self-hosted (not next/font/google) — no runtime dependency on
// Google's font CDN, better performance, and avoids GDPR font-loading
// concerns some EU-facing sites run into. Files sourced from Google's own
// public font repo (github.com/google/fonts), same OFL/Apache-licensed
// binaries Google Fonts itself serves.

const displayFace = localFont({
  src: "../public/fonts/permanent-marker.ttf",
  variable: "--font-display",
  display: "swap",
});

const bodyFace = localFont({
  src: [
    { path: "../public/fonts/barlow-condensed-regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/barlow-condensed-medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/barlow-condensed-semibold.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/barlow-condensed-bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});

const utilityFace = localFont({
  src: "../public/fonts/jetbrains-mono-regular.ttf",
  variable: "--font-utility",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Chicken Bar | Kasi Flame Grilled Chicken & Meat — Tsakane",
  description:
    "Best kasi flame grilled chicken and meat in Tsakane. Order online for collection or delivery. Majita Monday every week — food, vibes, chill.",
};

// LocalBusiness/Restaurant structured data. Only confirmed facts from
// the brief go in here — no invented ratings, reviews, or price ranges.
// Brief explicitly forbids inventing "restaurant claims, reviews" —
// same rule applies to structured data as to visible copy.
const restaurantJsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "The Chicken Bar",
  // PLACEHOLDER DOMAIN — replace with your real deployed domain once
  // live (Netlify URL or a custom domain). This won't resolve until then.
  image: "https://REPLACE-WITH-REAL-DOMAIN.com/logo/badge-final.png",
  address: {
    "@type": "PostalAddress",
    streetAddress: "114 Bhala Street",
    addressLocality: "Tsakane",
    addressRegion: "Gauteng",
    addressCountry: "ZA",
  },
  telephone: "+27658012302",
  servesCuisine: "South African, Grilled Chicken",
  priceRange: "R",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"],
      opens: "11:00",
      closes: "20:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Friday", "Saturday", "Sunday"],
      opens: "11:00",
      closes: "21:00",
    },
  ],
  sameAs: ["https://facebook.com/TheChickenBar"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFace.variable} ${bodyFace.variable} ${utilityFace.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}

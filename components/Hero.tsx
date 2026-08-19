"use client";

import Image from "next/image";

const collageCards = [
  { src: "/food/burger.jpg", alt: "Chicken Bar burger and fries", className: "chicken-hero-card-1" },
  { src: "/food/fofo-special.jpg", alt: "Chicken Bar Fofo Special", className: "chicken-hero-card-2" },
  { src: "/food/wrap.jpg", alt: "Chicken Bar wrap", className: "chicken-hero-card-3" },
  { src: "/food/kota.jpg", alt: "Chicken Bar kota", className: "chicken-hero-card-4" },
  { src: "/food/meat-platter.jpg", alt: "Chicken Bar meat platter", className: "chicken-hero-card-5" },
  { src: "/gallery/takeaway-box.jpg", alt: "Chicken Bar takeaway meal", className: "chicken-hero-card-6" },
];

/**
 * The landing hero uses only the restaurant's supplied files in /public.
 * No generated food, restaurant, logo, or replacement imagery is used.
 */
export default function Hero() {
  return (
    <section
      className="chicken-cinematic-hero relative isolate min-h-[92vh] overflow-hidden border-b-4 border-flame"
      aria-label="The Chicken Bar introduction"
    >
      <div className="chicken-hero-glow" aria-hidden="true" />
      <div className="chicken-hero-flame-edge" aria-hidden="true" />

      <div className="chicken-hero-opening-logo" aria-hidden="true">
        <Image
          src="/logo/tcb-logo-white.png"
          alt=""
          width={980}
          height={432}
          priority
          className="h-auto w-full"
        />
      </div>

      <div className="chicken-hero-collage" aria-label="Chicken Bar food collage">
        {collageCards.map((card) => (
          <figure key={card.src} className={`chicken-hero-card ${card.className}`}>
            <Image
              src={card.src}
              alt={card.alt}
              fill
              sizes="(max-width: 767px) 42vw, 24vw"
              className="object-cover"
            />
          </figure>
        ))}
      </div>

      <div className="chicken-hero-food-frame">
        <div className="chicken-hero-food-ring" aria-hidden="true" />
        <Image
          src="/food/why-choose-meat.jpg"
          alt="Chicken Bar flame-grilled chicken, wors, and steak platter with pap and coleslaw"
          fill
          sizes="(max-width: 767px) 78vw, 42vw"
          priority
          className="object-cover"
        />
      </div>

      <div className="relative z-20 mx-auto flex min-h-[92vh] w-full max-w-6xl items-end px-6 pb-12 pt-28 md:items-center md:px-12 md:pb-16 md:pt-24">
        <div className="chicken-hero-copy max-w-2xl text-center md:text-left">
          <Image
            src="/logo/tcb-logo-white.png"
            alt="The Chicken Bar"
            width={980}
            height={432}
            priority
            className="mx-auto mb-5 h-auto w-[min(24rem,72vw)] md:mx-0"
          />
          <p className="font-utility text-char text-xs font-bold uppercase tracking-[0.32em] md:text-sm">
            Tsakane, Ekurhuleni · Est. 2019
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[0.9] text-bone drop-shadow-[3px_3px_0_rgba(0,0,0,0.48)] md:text-7xl">
            GOOD CHICKEN.
            <br />
            GOOD VIBES.
          </h1>
          <p className="mx-auto mt-5 max-w-lg font-body text-lg text-bone/85 md:mx-0 md:text-xl">
            Fresh flame-grilled food, the real Chicken Bar way.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start">
            <a
              href="/checkout"
              className="shine-on-hover font-body font-bold uppercase tracking-wide bg-flame px-8 py-3.5 text-lg text-bone shadow-[4px_4px_0_rgba(0,0,0,0.5)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_rgba(0,0,0,0.5)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-char focus-visible:outline-offset-2"
            >
              Order Now
            </a>
            <a
              href="/menu"
              className="font-body font-bold uppercase tracking-wide border-2 border-bone bg-transparent px-8 py-3.5 text-lg text-bone transition-colors hover:bg-bone hover:text-ink focus-visible:outline focus-visible:outline-3 focus-visible:outline-char focus-visible:outline-offset-2"
            >
              View Menu
            </a>
            <a
              href="#upcoming-events"
              className="font-body font-bold uppercase tracking-wide border-2 border-char/90 bg-char/10 px-8 py-3.5 text-lg text-char transition-colors hover:bg-char hover:text-ink focus-visible:outline focus-visible:outline-3 focus-visible:outline-bone focus-visible:outline-offset-2"
            >
              View Events
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

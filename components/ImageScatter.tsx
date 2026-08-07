"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

export interface ScatterSet {
  heading: string;
  images: string[];
}

export interface ImageScatterProps extends React.HTMLAttributes<HTMLDivElement> {
  data: ScatterSet[];
  cardWidth?: number;
  cardHeight?: number;
  animationDuration?: number;
  animationOverlap?: number;
  headingFadeDuration?: number;
}

/**
 * Scattered-card auto-cycling effect, adapted from a supplied reference
 * component. Two real fixes made to the original:
 * 1. `NodeJS.Timeout` swapped for `ReturnType<typeof setInterval>` — the
 *    original type only exists in Node.js contexts and breaks in a
 *    browser/Next.js client component.
 * 2. ScrollTrigger import/registration removed — nothing in this usage
 *    triggers on scroll (auto-plays on an interval instead), so it was
 *    a dead dependency pulling in unused GSAP plugin code.
 *
 * Deliberately used in ONE place (Gallery) rather than reused across
 * multiple sections — this is a loud, high-impact effect, and using it
 * more than once risks it reading as a repeated template trick instead
 * of a considered choice for the one section that's actually about "100
 * photos," which is what the effect is built for.
 */
export function ImageScatter({
  data,
  cardWidth = 200,
  cardHeight = 240,
  animationDuration = 0.75,
  animationOverlap = 0.5,
  headingFadeDuration = 0.5,
  className,
  ...props
}: ImageScatterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!containerRef.current || !galleryRef.current || !headingRef.current || data.length === 0) return;

    const gallery = galleryRef.current;
    const galleryHeading = headingRef.current;

    const viewport = {
      centerX: containerRef.current.clientWidth / 2,
      centerY: containerRef.current.clientHeight / 2,
      rangeMin: Math.min(containerRef.current.clientWidth, containerRef.current.clientHeight) * 0.3,
      rangeMax: Math.min(containerRef.current.clientWidth, containerRef.current.clientHeight) * 0.65,
    };

    const state = {
      activeCards: [] as { element: HTMLDivElement; centerX: number; centerY: number }[],
      currentSection: 0,
      isAnimating: false,
    };

    function updateViewport() {
      if (!containerRef.current) return;
      viewport.centerX = containerRef.current.clientWidth / 2;
      viewport.centerY = containerRef.current.clientHeight / 2;
      viewport.rangeMin = Math.min(containerRef.current.clientWidth, containerRef.current.clientHeight) * 0.3;
      viewport.rangeMax = Math.min(containerRef.current.clientWidth, containerRef.current.clientHeight) * 0.65;
    }

    function getEdgePosition(centerX: number, centerY: number) {
      const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
      const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
      const distances = {
        left: centerX,
        right: containerWidth - centerX,
        top: centerY,
        bottom: containerHeight - centerY,
      };
      const minDistance = Math.min(...Object.values(distances));
      const cardCenterOffsetX = cardWidth / 2;
      const cardCenterOffsetY = cardHeight / 2;
      const offsetVariation = () => (Math.random() - 0.5) * 300;

      if (minDistance === distances.left) {
        return { x: -cardWidth - 80 - Math.random() * 150, y: centerY - cardCenterOffsetY + offsetVariation() };
      }
      if (minDistance === distances.right) {
        return { x: containerWidth + 40 + Math.random() * 150, y: centerY - cardCenterOffsetY + offsetVariation() };
      }
      if (minDistance === distances.top) {
        return { x: centerX - cardCenterOffsetX + offsetVariation(), y: -cardHeight - 80 - Math.random() * 150 };
      }
      return { x: centerX - cardCenterOffsetX + offsetVariation(), y: containerHeight + 40 + Math.random() * 150 };
    }

    function createCards(sectionIndex: number) {
      const cards: { element: HTMLDivElement; centerX: number; centerY: number }[] = [];
      const sectionData = data[sectionIndex];
      if (!sectionData || !sectionData.images.length) return cards;

      sectionData.images.forEach((src) => {
        const card = document.createElement("div");
        card.className =
          "absolute rounded-sm border-4 border-bone shadow-xl overflow-hidden will-change-transform";
        card.style.width = `${cardWidth}px`;
        card.style.height = `${cardHeight}px`;

        const img = document.createElement("img");
        img.src = src;
        img.alt = "";
        img.className = "w-full h-full object-cover pointer-events-none";
        card.appendChild(img);

        const angle = Math.random() * Math.PI * 2;
        const radius = viewport.rangeMin + Math.random() * (viewport.rangeMax - viewport.rangeMin);
        const centerX = viewport.centerX + Math.cos(angle) * radius;
        const centerY = viewport.centerY + Math.sin(angle) * radius;

        gsap.set(card, {
          left: centerX - cardWidth / 2,
          top: centerY - cardHeight / 2,
          rotation: Math.random() * 40 - 20,
        });

        gallery.appendChild(card);
        cards.push({ element: card, centerX, centerY });
      });

      return cards;
    }

    function animateHeading(newText: string) {
      return gsap
        .timeline()
        .to(galleryHeading, { opacity: 0, duration: headingFadeDuration, ease: "power2.inOut" })
        .call(() => {
          galleryHeading.textContent = newText;
        })
        .to(galleryHeading, { opacity: 1, duration: headingFadeDuration, ease: "power2.inOut" });
    }

    function animateCards(
      exitingCards: { element: HTMLDivElement; centerX: number; centerY: number }[],
      enteringCards: { element: HTMLDivElement; centerX: number; centerY: number }[]
    ) {
      const tl = gsap.timeline();

      exitingCards.forEach(({ element, centerX, centerY }) => {
        const targetEdge = getEdgePosition(centerX, centerY);
        tl.to(
          element,
          {
            left: targetEdge.x,
            top: targetEdge.y,
            rotation: Math.random() * 160 - 80,
            duration: animationDuration,
            ease: "power2.in",
            onComplete: () => element.remove(),
          },
          0
        );
      });

      enteringCards.forEach(({ element, centerX, centerY }) => {
        const targetEdge = getEdgePosition(centerX, centerY);
        gsap.set(element, { left: targetEdge.x, top: targetEdge.y, rotation: Math.random() * 160 - 80 });
        tl.to(
          element,
          {
            left: centerX - cardWidth / 2,
            top: centerY - cardHeight / 2,
            rotation: Math.random() * 40 - 20,
            duration: animationDuration,
            ease: "power2.out",
          },
          animationOverlap
        );
      });

      return tl;
    }

    function reinitialize() {
      state.activeCards.forEach(({ element }) => element.remove());
      updateViewport();
      state.activeCards = createCards(state.currentSection);
    }

    state.activeCards = createCards(0);
    galleryHeading.textContent = data[0]?.heading || "";
    gsap.set(galleryHeading, { opacity: 1 });

    function nextSection() {
      if (state.isAnimating) return;
      const targetSection = (state.currentSection + 1) % data.length;
      state.isAnimating = true;
      const newCards = createCards(targetSection);

      Promise.all([
        animateCards(state.activeCards, newCards).then(),
        animateHeading(data[targetSection]?.heading || "").then(),
      ]).then(() => {
        state.activeCards = newCards;
        state.currentSection = targetSection;
        state.isAnimating = false;
      });
    }

    // Fixed: ReturnType<typeof setInterval> works in both browser and
    // Node typings, unlike the original's NodeJS.Timeout which only
    // resolves correctly in a Node.js (server) context.
    const intervalId: ReturnType<typeof setInterval> = setInterval(nextSection, 3200);

    const handleResize = () => reinitialize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(intervalId);
      state.activeCards.forEach(({ element }) => element.remove());
    };
  }, [data, cardWidth, cardHeight, animationDuration, animationOverlap, headingFadeDuration]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full flex justify-center items-center overflow-hidden bg-transparent", className)}
      {...props}
    >
      <div ref={galleryRef} className="absolute inset-0 pointer-events-none" />
      <h2
        ref={headingRef}
        className="w-[90%] md:w-[50%] text-center font-display text-3xl md:text-5xl leading-tight tracking-tight z-10 will-change-[opacity] text-bone"
      />
    </div>
  );
}

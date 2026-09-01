"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { CarouselSlide } from "@/components/photo-carousel";

const DEFAULT_SLIDES: CarouselSlide[] = [
  {
    url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    alt: "Apartment living room",
  },
  {
    url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
    alt: "Friends gathering",
  },
  {
    url: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80",
    alt: "House party",
  },
  {
    url: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80",
    alt: "Apartment hangout",
  },
  {
    url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
    alt: "Group photo",
  },
  {
    url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
    alt: "Cozy evening",
  },
];

const CARD_CONFIGS = [
  { left: "5%",  top: "4%",  w: 200, h: 140, rot: -6,  depth: 0.10, z: 1 },
  { left: "48%", top: "2%",  w: 170, h: 230, rot:  4,  depth: 0.25, z: 3 },
  { left: "22%", top: "28%", w: 230, h: 160, rot: -3,  depth: 0.18, z: 2 },
  { left: "58%", top: "36%", w: 190, h: 250, rot:  7,  depth: 0.35, z: 4 },
  { left: "2%",  top: "58%", w: 210, h: 145, rot:  3,  depth: 0.12, z: 1 },
  { left: "38%", top: "65%", w: 175, h: 220, rot: -5,  depth: 0.28, z: 3 },
];

const SWAP_INTERVAL = 2800; // ms between each card swap
const FADE_DURATION = 600;  // ms for crossfade

interface ParallaxPhotoFloatProps {
  slides?: CarouselSlide[];
}

export function ParallaxPhotoFloat({ slides = DEFAULT_SLIDES }: ParallaxPhotoFloatProps) {
  const pool = slides.length > 0 ? slides : DEFAULT_SLIDES;

  // Each card tracks: which slide is showing, which slide is fading in, and fade opacity
  const [cardSlides, setCardSlides] = useState<number[]>(
    // First 6 unique photos if we have enough, otherwise wrap
    () => CARD_CONFIGS.map((_, i) => i % pool.length)
  );
  const [nextSlides, setNextSlides] = useState<number[]>(() => Array(CARD_CONFIGS.length).fill(-1));
  const [fadeOpacity, setFadeOpacity] = useState<number[]>(() => Array(CARD_CONFIGS.length).fill(0));

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const cardSlidesRef = useRef(cardSlides);
  cardSlidesRef.current = cardSlides;

  // Parallax mouse tracking
  useEffect(() => {
    function onMove(e: MouseEvent) {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    }

    function loop() {
      currentRef.current.x += (mouseRef.current.x - currentRef.current.x) * 0.06;
      currentRef.current.y += (mouseRef.current.y - currentRef.current.y) * 0.06;

      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const cfg = CARD_CONFIGS[i];
        const mx = currentRef.current.x * cfg.depth * 60;
        const my = currentRef.current.y * cfg.depth * 60;
        el.style.transform = `translate(${mx}px, ${my}px) rotate(${cfg.rot}deg)`;
      });

      rafRef.current = requestAnimationFrame(loop);
    }

    window.addEventListener("mousemove", onMove);
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Staggered card swapping — only runs when there are more than 6 photos
  useEffect(() => {
    if (pool.length <= 6) return;

    let cardCursor = 0;

    const timer = setInterval(() => {
      const cardIndex = cardCursor % CARD_CONFIGS.length;
      cardCursor++;

      const current = cardSlidesRef.current[cardIndex];
      // Pick the next slide not currently shown on any other card
      const shown = new Set(cardSlidesRef.current);
      shown.delete(current); // this card's slot is being freed
      let next = (current + 1) % pool.length;
      while (shown.has(next)) {
        next = (next + 1) % pool.length;
      }

      // Start fade in of next image
      setNextSlides((prev) => {
        const copy = [...prev];
        copy[cardIndex] = next;
        return copy;
      });
      setFadeOpacity((prev) => {
        const copy = [...prev];
        copy[cardIndex] = 1;
        return copy;
      });

      // After fade completes, commit the swap and reset overlay
      setTimeout(() => {
        setCardSlides((prev) => {
          const copy = [...prev];
          copy[cardIndex] = next;
          return copy;
        });
        setNextSlides((prev) => {
          const copy = [...prev];
          copy[cardIndex] = -1;
          return copy;
        });
        setFadeOpacity((prev) => {
          const copy = [...prev];
          copy[cardIndex] = 0;
          return copy;
        });
      }, FADE_DURATION);
    }, SWAP_INTERVAL);

    return () => clearInterval(timer);
  }, [pool]);

  return (
    <div className="relative h-full w-full" aria-hidden>
      {CARD_CONFIGS.map((cfg, i) => {
        const baseSlide = pool[cardSlides[i] % pool.length];
        const nextSlide = nextSlides[i] >= 0 ? pool[nextSlides[i] % pool.length] : null;

        return (
          <div
            key={i}
            ref={(el) => { cardRefs.current[i] = el; }}
            className="absolute overflow-hidden rounded-2xl will-change-transform"
            style={{
              left: cfg.left,
              top: cfg.top,
              width: cfg.w,
              height: cfg.h,
              transform: `rotate(${cfg.rot}deg)`,
              zIndex: cfg.z,
              boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)",
            }}
          >
            {/* Base image */}
            <Image
              src={baseSlide.url}
              alt={baseSlide.alt ?? "514 Buick"}
              fill
              className="object-cover"
              sizes="230px"
              priority={i < 3}
            />

            {/* Incoming image crossfades on top */}
            {nextSlide && (
              <div
                className="absolute inset-0"
                style={{
                  opacity: fadeOpacity[i],
                  transition: `opacity ${FADE_DURATION}ms ease-in-out`,
                }}
              >
                <Image
                  src={nextSlide.url}
                  alt={nextSlide.alt ?? "514 Buick"}
                  fill
                  className="object-cover"
                  sizes="230px"
                />
              </div>
            )}

            {/* Vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
          </div>
        );
      })}

      {/* Edge fade */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 90% at 50% 50%, transparent 50%, #08080b 100%)",
        }}
      />
    </div>
  );
}

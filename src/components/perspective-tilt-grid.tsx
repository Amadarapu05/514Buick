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

// 6 cells in a 2-col × 3-row grid
const CELL_COUNT = 6;
const SWAP_INTERVAL = 2800;
const FADE_DURATION = 600;
const MAX_TILT = 14; // degrees

interface PerspectiveTiltGridProps {
  slides?: CarouselSlide[];
}

export function PerspectiveTiltGrid({ slides = DEFAULT_SLIDES }: PerspectiveTiltGridProps) {
  const pool = slides.length > 0 ? slides : DEFAULT_SLIDES;

  const [cardSlides, setCardSlides] = useState<number[]>(
    () => Array.from({ length: CELL_COUNT }, (_, i) => i % pool.length)
  );
  const [nextSlides, setNextSlides] = useState<number[]>(() => Array(CELL_COUNT).fill(-1));
  const [fadeOpacity, setFadeOpacity] = useState<number[]>(() => Array(CELL_COUNT).fill(0));

  const gridRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const cardSlidesRef = useRef(cardSlides);
  cardSlidesRef.current = cardSlides;

  // 3D tilt tracking
  useEffect(() => {
    function onMove(e: MouseEvent) {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    }

    function loop() {
      currentRef.current.x += (mouseRef.current.x - currentRef.current.x) * 0.05;
      currentRef.current.y += (mouseRef.current.y - currentRef.current.y) * 0.05;

      if (gridRef.current) {
        const rx = -currentRef.current.y * MAX_TILT;
        const ry = currentRef.current.x * MAX_TILT;
        gridRef.current.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    window.addEventListener("mousemove", onMove);
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Photo cycling — only when more than 6 photos, never shows duplicates
  useEffect(() => {
    if (pool.length <= 6) return;

    let cardCursor = 0;

    const timer = setInterval(() => {
      const cardIndex = cardCursor % CELL_COUNT;
      cardCursor++;

      const current = cardSlidesRef.current[cardIndex];
      const shown = new Set(cardSlidesRef.current);
      shown.delete(current);
      let next = (current + 1) % pool.length;
      while (shown.has(next)) {
        next = (next + 1) % pool.length;
      }

      setNextSlides((prev) => { const c = [...prev]; c[cardIndex] = next; return c; });
      setFadeOpacity((prev) => { const c = [...prev]; c[cardIndex] = 1; return c; });

      setTimeout(() => {
        setCardSlides((prev) => { const c = [...prev]; c[cardIndex] = next; return c; });
        setNextSlides((prev) => { const c = [...prev]; c[cardIndex] = -1; return c; });
        setFadeOpacity((prev) => { const c = [...prev]; c[cardIndex] = 0; return c; });
      }, FADE_DURATION);
    }, SWAP_INTERVAL);

    return () => clearInterval(timer);
  }, [pool]);

  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ perspective: "900px", perspectiveOrigin: "50% 50%" }}
      aria-hidden
    >
      <div
        ref={gridRef}
        className="grid will-change-transform"
        style={{
          gridTemplateColumns: "repeat(2, 1fr)",
          gridTemplateRows: "repeat(3, 1fr)",
          gap: "12px",
          width: "min(340px, 90%)",
          height: "min(520px, 80vh)",
          transformStyle: "preserve-3d",
        }}
      >
        {Array.from({ length: CELL_COUNT }, (_, i) => {
          const baseSlide = pool[cardSlides[i] % pool.length];
          const nextSlide = nextSlides[i] >= 0 ? pool[nextSlides[i] % pool.length] : null;

          // Vary border-radius slightly per card for visual interest
          const radii = [14, 10, 16, 12, 10, 14];

          return (
            <div
              key={i}
              className="relative overflow-hidden"
              style={{
                borderRadius: radii[i],
                boxShadow:
                  "0 6px 30px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
              }}
            >
              {/* Base image */}
              <Image
                src={baseSlide.url}
                alt={baseSlide.alt ?? "514 Buick"}
                fill
                className="object-cover"
                sizes="170px"
                priority={i < 4}
              />

              {/* Crossfade layer */}
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
                    sizes="170px"
                  />
                </div>
              )}

              {/* Vignette */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/40" />

              {/* Shine layer — moves opposite to tilt for a gloss effect */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

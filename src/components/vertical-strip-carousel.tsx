"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { CarouselSlide } from "@/components/photo-carousel";

const DEFAULT_SLIDES: CarouselSlide[] = [
  {
    url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    alt: "Apartment living room",
  },
  {
    url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
    alt: "Cozy evening",
  },
  {
    url: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80",
    alt: "House party",
  },
  {
    url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
    alt: "Friends gathering",
  },
  {
    url: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80",
    alt: "Apartment hangout",
  },
  {
    url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
    alt: "Group photo",
  },
];

interface VerticalStripCarouselProps {
  slides?: CarouselSlide[];
  className?: string;
}

export function VerticalStripCarousel({
  slides = DEFAULT_SLIDES,
  className,
}: VerticalStripCarouselProps) {
  const loopSlides = [...slides, ...slides];

  return (
    <div
      className={cn(
        "relative mx-auto h-[calc(100vh-3.5rem)] w-full max-w-[350px] overflow-hidden",
        className
      )}
    >
      {/* Top fade */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24"
        style={{
          background: "linear-gradient(to bottom, #08080b, transparent)",
        }}
        aria-hidden
      />
      {/* Bottom fade */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24"
        style={{
          background: "linear-gradient(to top, #08080b, transparent)",
        }}
        aria-hidden
      />

      <div className="animate-vertical-scroll flex flex-col gap-4">
        {loopSlides.map((slide, i) => (
          <div
            key={`${slide.url}-${i}`}
            className="relative h-[220px] flex-shrink-0 overflow-hidden rounded-2xl border border-white/[0.06]"
            style={{
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            }}
          >
            <Image
              src={slide.url}
              alt={slide.alt ?? "514 Buick"}
              fill
              className="object-cover"
              sizes="280px"
              priority={i < 2}
            />
            {/* Subtle image overlay */}
            <div className="absolute inset-0 bg-black/10" aria-hidden />
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CarouselSlide {
  url: string;
  alt?: string;
}

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
];

interface PhotoCarouselProps {
  slides?: CarouselSlide[];
  intervalMs?: number;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function PhotoCarousel({
  slides = DEFAULT_SLIDES,
  intervalMs = 5000,
  orientation = "horizontal",
  className,
}: PhotoCarouselProps) {
  const [index, setIndex] = useState(0);
  const count = slides.length;
  const isVertical = orientation === "vertical";

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % count);
  }, [count]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    const timer = setInterval(next, intervalMs);
    return () => clearInterval(timer);
  }, [next, intervalMs]);

  const PrevIcon = isVertical ? ChevronUp : ChevronLeft;
  const NextIcon = isVertical ? ChevronDown : ChevronRight;

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        isVertical ? "h-full min-h-[420px] w-full" : "h-full w-full",
        className
      )}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.url + i}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            i === index ? "opacity-100" : "opacity-0"
          )}
        >
          <Image
            src={slide.url}
            alt={slide.alt ?? "514 Buick"}
            fill
            className="object-cover"
            priority={i === 0}
            sizes={isVertical ? "(max-width: 480px) 40vw" : "100vw"}
          />
          {!isVertical && <div className="absolute inset-0 bg-black/40" />}
        </div>
      ))}

      <button
        type="button"
        onClick={prev}
        className={cn(
          "absolute z-10 rounded-full bg-black/40 p-2 text-white backdrop-blur transition-colors hover:bg-black/60",
          isVertical
            ? "left-1/2 top-3 -translate-x-1/2"
            : "left-4 top-1/2 -translate-y-1/2"
        )}
        aria-label="Previous photo"
      >
        <PrevIcon className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={next}
        className={cn(
          "absolute z-10 rounded-full bg-black/40 p-2 text-white backdrop-blur transition-colors hover:bg-black/60",
          isVertical
            ? "bottom-3 left-1/2 -translate-x-1/2"
            : "right-4 top-1/2 -translate-y-1/2"
        )}
        aria-label="Next photo"
      >
        <NextIcon className="h-5 w-5" />
      </button>

      <div
        className={cn(
          "absolute z-10 flex gap-2",
          isVertical
            ? "bottom-1/2 right-3 translate-y-1/2 flex-col"
            : "bottom-6 left-1/2 -translate-x-1/2"
        )}
      >
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className={cn(
              "rounded-full bg-white/50 transition-all",
              isVertical
                ? i === index
                  ? "h-8 w-1.5 bg-accent"
                  : "h-1.5 w-1.5"
                : i === index
                  ? "h-1.5 w-8 bg-accent"
                  : "h-1.5 w-1.5"
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

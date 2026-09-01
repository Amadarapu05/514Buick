"use client";

import { useEffect, useRef } from "react";

interface Blob {
  x: number;
  y: number;
  radius: number;
  color: string;
  // Oscillation: position = base + amplitude * sin(speed * t + phase)
  baseX: number;
  baseY: number;
  ampX: number;
  ampY: number;
  speedX: number;
  speedY: number;
  phaseX: number;
  phaseY: number;
  blur: number;
  opacity: number;
}

export function AuroraMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    // Define aurora blobs — colors keep to deep purple, midnight blue, and warm gold
    const blobs: Blob[] = [
      {
        x: 0, y: 0,
        baseX: w * 0.15, baseY: h * 0.35,
        radius: 480, color: "100,30,160",
        ampX: 80, ampY: 60, speedX: 0.00022, speedY: 0.00017,
        phaseX: 0, phaseY: 1.2,
        blur: 90, opacity: 0.28,
      },
      {
        x: 0, y: 0,
        baseX: w * 0.55, baseY: h * 0.25,
        radius: 420, color: "20,30,110",
        ampX: 100, ampY: 70, speedX: 0.00015, speedY: 0.00021,
        phaseX: 2.1, phaseY: 0.5,
        blur: 100, opacity: 0.35,
      },
      {
        x: 0, y: 0,
        baseX: w * 0.75, baseY: h * 0.65,
        radius: 380, color: "160,90,10",
        ampX: 90, ampY: 80, speedX: 0.00019, speedY: 0.00014,
        phaseX: 1.0, phaseY: 3.0,
        blur: 80, opacity: 0.18,
      },
      {
        x: 0, y: 0,
        baseX: w * 0.35, baseY: h * 0.72,
        radius: 440, color: "70,10,120",
        ampX: 70, ampY: 90, speedX: 0.00013, speedY: 0.00025,
        phaseX: 3.5, phaseY: 0.8,
        blur: 110, opacity: 0.22,
      },
      {
        x: 0, y: 0,
        baseX: w * 0.85, baseY: h * 0.2,
        radius: 360, color: "180,120,15",
        ampX: 60, ampY: 50, speedX: 0.00026, speedY: 0.00018,
        phaseX: 0.7, phaseY: 2.4,
        blur: 85, opacity: 0.13,
      },
      {
        x: 0, y: 0,
        baseX: w * 0.45, baseY: h * 0.5,
        radius: 500, color: "40,10,90",
        ampX: 110, ampY: 100, speedX: 0.00011, speedY: 0.00016,
        phaseX: 4.2, phaseY: 1.8,
        blur: 120, opacity: 0.20,
      },
    ];

    function onResize() {
      if (!canvas) return;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      // Re-center blobs proportionally
      blobs[0].baseX = w * 0.15; blobs[0].baseY = h * 0.35;
      blobs[1].baseX = w * 0.55; blobs[1].baseY = h * 0.25;
      blobs[2].baseX = w * 0.75; blobs[2].baseY = h * 0.65;
      blobs[3].baseX = w * 0.35; blobs[3].baseY = h * 0.72;
      blobs[4].baseX = w * 0.85; blobs[4].baseY = h * 0.20;
      blobs[5].baseX = w * 0.45; blobs[5].baseY = h * 0.50;
    }

    window.addEventListener("resize", onResize);

    let rafId = 0;

    function draw(t: number) {
      ctx.clearRect(0, 0, w, h);

      for (const b of blobs) {
        b.x = b.baseX + Math.sin(t * b.speedX + b.phaseX) * b.ampX;
        b.y = b.baseY + Math.sin(t * b.speedY + b.phaseY) * b.ampY;

        ctx.save();
        ctx.filter = `blur(${b.blur}px)`;

        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
        grad.addColorStop(0,   `rgba(${b.color}, ${b.opacity})`);
        grad.addColorStop(0.5, `rgba(${b.color}, ${b.opacity * 0.4})`);
        grad.addColorStop(1,   `rgba(${b.color}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, b.radius, b.radius * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}

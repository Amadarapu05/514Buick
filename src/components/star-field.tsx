"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  depth: number;       // 0–1, controls parallax speed and brightness
  phase: number;       // twinkle offset
  twinkleSpeed: number;
  baseOpacity: number;
  gold: boolean;       // ~10% of stars have a warm gold tint
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  opacity: number;
  life: number;        // 0–1, fades out as it ages
}

const STAR_COUNT = 180;
const MAX_PARALLAX = 35;

export function StarField() {
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

    // Generate stars
    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: Math.random() * 1.4 + 0.3,
      depth: Math.random(),
      phase: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.8 + 0.3,
      baseOpacity: Math.random() * 0.5 + 0.3,
      gold: Math.random() < 0.1,
    }));

    const shootingStars: ShootingStar[] = [];
    let lastShoot = 0;
    let nextShootIn = 6000 + Math.random() * 6000;

    const mouse = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    function onMouseMove(e: MouseEvent) {
      mouse.x = (e.clientX / w - 0.5) * 2;
      mouse.y = (e.clientY / h - 0.5) * 2;
    }

    function onResize() {
      if (!canvas) return;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      // Redistribute stars to fill new size
      stars.forEach((s) => {
        s.x = Math.random() * w;
        s.y = Math.random() * h;
      });
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);

    let rafId = 0;
    let lastTime = 0;

    function spawnShootingStar() {
      const angle = (Math.random() * 40 + 20) * (Math.PI / 180);
      const speed = Math.random() * 6 + 8;
      shootingStars.push({
        x: Math.random() * w * 0.7,
        y: Math.random() * h * 0.4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: Math.random() * 100 + 80,
        opacity: 1,
        life: 0,
      });
    }

    function draw(timestamp: number) {
      const dt = Math.min(timestamp - lastTime, 50);
      lastTime = timestamp;

      // Lerp mouse
      current.x += (mouse.x - current.x) * 0.04;
      current.y += (mouse.y - current.y) * 0.04;

      ctx.clearRect(0, 0, w, h);

      // Draw stars
      for (const s of stars) {
        const px = current.x * s.depth * MAX_PARALLAX;
        const py = current.y * s.depth * MAX_PARALLAX;
        const x = ((s.x + px) % w + w) % w;
        const y = ((s.y + py) % h + h) % h;

        const twinkle = Math.sin(timestamp * 0.001 * s.twinkleSpeed + s.phase);
        const opacity = s.baseOpacity + twinkle * 0.25;

        ctx.beginPath();
        ctx.arc(x, y, s.radius, 0, Math.PI * 2);

        if (s.gold) {
          ctx.fillStyle = `rgba(220, 180, 80, ${Math.max(0, opacity)})`;
        } else {
          const bright = Math.floor(200 + s.depth * 55);
          ctx.fillStyle = `rgba(${bright}, ${bright}, ${bright}, ${Math.max(0, opacity)})`;
        }

        // Glow for larger stars
        if (s.radius > 1.2) {
          ctx.shadowBlur = s.radius * 4;
          ctx.shadowColor = s.gold ? "rgba(220,180,80,0.4)" : "rgba(200,210,255,0.3)";
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fill();
      }

      ctx.shadowBlur = 0;

      // Shooting stars
      const elapsed = timestamp - lastShoot;
      if (elapsed > nextShootIn) {
        spawnShootingStar();
        lastShoot = timestamp;
        nextShootIn = 5000 + Math.random() * 8000;
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += ss.vx * (dt / 16);
        ss.y += ss.vy * (dt / 16);
        ss.life += dt / 800;
        ss.opacity = Math.max(0, 1 - ss.life * ss.life);

        if (ss.opacity <= 0 || ss.x > w + 200 || ss.y > h + 200) {
          shootingStars.splice(i, 1);
          continue;
        }

        const tailX = ss.x - ss.vx * (ss.length / Math.hypot(ss.vx, ss.vy));
        const tailY = ss.y - ss.vy * (ss.length / Math.hypot(ss.vx, ss.vy));

        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, `rgba(255,255,255,0)`);
        grad.addColorStop(0.7, `rgba(220,200,150,${ss.opacity * 0.6})`);
        grad.addColorStop(1, `rgba(255,255,255,${ss.opacity})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
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

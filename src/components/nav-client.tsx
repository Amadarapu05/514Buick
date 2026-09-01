"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/events", label: "Events" },
  { href: "/music", label: "Music" },
  { href: "/tv", label: "TV" },
  { href: "/confessions", label: "Confessions" },
];

const linkBtn =
  "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-all duration-200 hover:bg-white/5";

interface NavUser {
  isHost: boolean;
  displayName: string | null;
}

export function NavClient({ user }: { user: NavUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Desktop nav links */}
      <ul className="hidden items-center gap-7 text-sm md:flex">
        {navLinks.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                data-active={active}
                className={cn(
                  "nav-link-underline transition-colors duration-200",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Desktop user buttons */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {user.isHost && (
                <Link href="/admin" className={linkBtn}>
                  Admin
                </Link>
              )}
              <Link
                href="/profile"
                className={cn(
                  linkBtn,
                  "border border-white/10 hover:border-accent/40 hover:text-accent"
                )}
              >
                {user.displayName ?? "Profile"}
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className={cn(
                linkBtn,
                "border border-white/10 hover:border-accent/40 hover:text-accent"
              )}
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Hamburger (mobile only) */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-white/5 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay menu */}
      <div
        className={cn(
          "fixed inset-x-0 top-14 z-40 flex h-[calc(100dvh-3.5rem)] flex-col bg-black/95 backdrop-blur-xl transition-all duration-300 ease-out md:hidden",
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        )}
      >
        <nav className="flex flex-col gap-1 p-6">
          {navLinks.map((link, i) => {
            const active =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-4 text-xl font-medium transition-colors duration-200",
                  active
                    ? "bg-white/5 text-white"
                    : "text-white/40 hover:bg-white/5 hover:text-white"
                )}
                style={{ transitionDelay: open ? `${i * 35}ms` : "0ms" }}
              >
                {active && (
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                )}
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile user section */}
        <div className="mt-auto border-t border-white/[0.06] p-6">
          {user ? (
            <div className="flex flex-col gap-2">
              {user.isHost && (
                <Link
                  href="/admin"
                  className="flex items-center rounded-xl px-4 py-3 text-base text-white/50 transition-colors hover:bg-white/5 hover:text-white"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/profile"
                className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-base font-medium text-white"
              >
                {user.displayName ?? "Profile"}
                <span className="text-xs text-white/30">→</span>
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex h-12 w-full items-center justify-center rounded-xl bg-accent text-sm font-semibold text-black"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

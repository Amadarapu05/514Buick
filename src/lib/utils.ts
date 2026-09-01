import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const VENUE_ADDRESS = "10 Buick St, Apt 514, Boston, MA 02215";
export const VENMO_USERNAME = "Anand-Madarapu";
export const VENMO_URL = `https://venmo.com/${VENMO_USERNAME}`;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

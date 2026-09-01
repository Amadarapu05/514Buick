export interface BirthdayRow {
  name: string;
  month: number;
  day: number;
  birth_year: number | null;
}

export function ordinalSuffix(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function formatAgeLabel(age: number): string {
  return `${age}${ordinalSuffix(age)}`;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Next calendar occurrence of month/day on or after `from` (start of day). */
export function getNextBirthdayDate(
  month: number,
  day: number,
  from: Date = new Date()
): Date {
  const base = startOfDay(from);
  const year = base.getFullYear();
  let next = new Date(year, month - 1, day);
  if (next < base) {
    next = new Date(year + 1, month - 1, day);
  }
  return next;
}

export function isBirthdayToday(month: number, day: number, now = new Date()): boolean {
  return month === now.getMonth() + 1 && day === now.getDate();
}

export function turningAgeOnDate(birthYear: number, birthdayDate: Date): number {
  return birthdayDate.getFullYear() - birthYear;
}

export function msUntilBirthday(month: number, day: number, now = new Date()) {
  const next = getNextBirthdayDate(month, day, now);
  const diff = next.getTime() - now.getTime();
  return {
    next,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
  };
}

export function formatBirthdayDate(month: number, day: number): string {
  const d = new Date(2000, month - 1, day);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

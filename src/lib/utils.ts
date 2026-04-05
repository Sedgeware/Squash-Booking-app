import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const OPENING_HOUR = 6;  // 6am
export const CLOSING_HOUR = 22; // 10pm (last slot starts at 21)
export const COURTS = [1, 2];

/** Returns an array of valid start hours: [6, 7, ..., 21] */
export function getSlots(): number[] {
  const slots: number[] = [];
  for (let h = OPENING_HOUR; h < CLOSING_HOUR; h++) {
    slots.push(h);
  }
  return slots;
}

/** Formats an hour integer as a 12-hour time string */
export function formatHour(hour: number): string {
  if (hour === 0) return "12:00 AM";
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return "12:00 PM";
  return `${hour - 12}:00 PM`;
}

/** Returns today's date as YYYY-MM-DD in local time */
export function todayString(): string {
  const d = new Date();
  return localDateString(d);
}

/** Converts a Date to YYYY-MM-DD in local time */
export function localDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Formats a YYYY-MM-DD string for display */
export function displayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

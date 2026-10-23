import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DAY = 24 * 60 * 60 * 1000;

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  }).format(date);
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatRelative(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);
  if (abs < 60_000) return "just now";
  if (abs < 3_600_000) {
    const minutes = Math.round(abs / 60_000);
    return diff < 0 ? `${minutes}m ago` : `in ${minutes}m`;
  }
  if (abs < DAY) {
    const hours = Math.round(abs / 3_600_000);
    return diff < 0 ? `${hours}h ago` : `in ${hours}h`;
  }
  if (abs < 7 * DAY) {
    const days = Math.round(abs / DAY);
    return diff < 0 ? `${days}d ago` : `in ${days}d`;
  }
  return formatDate(date);
}

export function daysBetween(from: Date, to: Date) {
  return Math.ceil((to.getTime() - from.getTime()) / DAY);
}

export function isOverdue(dueAt: string, now = new Date()) {
  return new Date(dueAt).getTime() < now.getTime();
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const AVATAR_COLORS = [
  "#D95D39",
  "#2F6B4F",
  "#4A5D8A",
  "#9A6B2F",
  "#7A4E6E",
  "#3D6B6B",
];

export function colorForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function pluralize(count: number, word: string, plural = `${word}s`) {
  return `${count} ${count === 1 ? word : plural}`;
}

export function truncate(value: string, length = 140) {
  if (value.length <= length) return value;
  return `${value.slice(0, length).trimEnd()}…`;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Something went wrong.";
}

export function safeJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function toDateInput(value: Date) {
  // `toISOString()` is UTC. Use local date parts so the date input does not
  // shift back a day for neighbours in IST (or any positive-offset timezone).
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

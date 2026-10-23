import { z } from "zod";
import {
  CATEGORIES,
  CONDITIONS,
  LOCALITIES,
  MAX_LOAN_DAYS,
} from "./constants";

const localityIds = LOCALITIES.map((locality) => locality.id) as [
  string,
  ...string[],
];
const categoryIds = CATEGORIES.map((category) => category.id) as [
  string,
  ...string[],
];
const conditionIds = CONDITIONS.map((condition) => condition.id) as [
  string,
  ...string[],
];

export const localitySchema = z.enum(localityIds);
export const categorySchema = z.enum(categoryIds);
export const conditionSchema = z.enum(conditionIds);

export const profileSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters.")
    .max(60, "Keep it under 60 characters."),
  locality: localitySchema,
  bio: z.string().trim().max(280, "Keep it under 280 characters.").optional(),
});

export const itemCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Give it a short, clear name.")
    .max(80, "Keep the title under 80 characters."),
  description: z
    .string()
    .trim()
    .min(10, "Add a sentence or two about the item.")
    .max(600, "Keep the description under 600 characters."),
  category: categorySchema,
  condition: conditionSchema,
  image_url: z.string().trim().url("Use a valid image URL.").optional().or(z.literal("")),
  image_id: z.string().trim().max(64).optional().or(z.literal("")),
});

export const itemUpdateSchema = itemCreateSchema.partial().extend({
  status: z.enum(["available", "unavailable"]).optional(),
});

export const loanCreateSchema = z.object({
  item_id: z.string().trim().min(1),
  due_at: z.string().trim().min(1, "Pick a return date."),
  note: z.string().trim().max(280, "Keep the note under 280 characters.").optional(),
});

export const loanNoteSchema = z.object({
  note: z.string().trim().max(280).optional(),
});

export const chatSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Ask about something you need.")
    .max(500, "Keep it under 500 characters."),
});

const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function endOfDayIST(date: Date) {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  shifted.setUTCHours(23, 59, 59, 999);
  return new Date(shifted.getTime() - IST_OFFSET_MS);
}

export function validateLoanWindow(dueAt: string) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dueAt);
  const date = dateOnly
    ? new Date(`${dueAt}T23:59:59.000+05:30`)
    : new Date(dueAt);
  if (Number.isNaN(date.getTime())) {
    return { ok: false as const, error: "Pick a valid return date." };
  }

  const now = Date.now();
  const max = endOfDayIST(new Date(now + MAX_LOAN_DAYS * DAY_MS));
  if (date.getTime() <= now) {
    return { ok: false as const, error: "The return date must be in the future." };
  }
  if (date.getTime() > max.getTime()) {
    return {
      ok: false as const,
      error: `Loans can run for up to ${MAX_LOAN_DAYS} days.`,
    };
  }
  return { ok: true as const, iso: date.toISOString() };
}

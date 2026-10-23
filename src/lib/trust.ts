import {
  TRUST_LATE_CAP,
  TRUST_LATE_PER_DAY,
  TRUST_MAX,
  TRUST_MIN,
  TRUST_ON_TIME,
} from "./constants";
import { clamp } from "./utils";

const DAY = 24 * 60 * 60 * 1000;

export function trustChangeForReturn(
  dueAt: string | Date,
  returnedAt: string | Date = new Date(),
) {
  const due = typeof dueAt === "string" ? new Date(dueAt) : dueAt;
  const returned =
    typeof returnedAt === "string" ? new Date(returnedAt) : returnedAt;

  if (Number.isNaN(due.getTime()) || Number.isNaN(returned.getTime())) {
    return 0;
  }

  if (returned.getTime() <= due.getTime()) {
    return TRUST_ON_TIME;
  }

  const lateDays = Math.ceil((returned.getTime() - due.getTime()) / DAY);
  return Math.max(TRUST_LATE_CAP, lateDays * TRUST_LATE_PER_DAY);
}

export function applyTrustChange(current: number, delta: number) {
  return clamp(current + delta, TRUST_MIN, TRUST_MAX);
}

export function trustLabel(score: number) {
  if (score >= 85) return "Neighborhood anchor";
  if (score >= 70) return "Reliable neighbor";
  if (score >= 55) return "Good standing";
  if (score >= 40) return "Building trust";
  return "New neighbor";
}

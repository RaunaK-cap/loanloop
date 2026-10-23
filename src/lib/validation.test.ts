import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateLoanWindow } from "./validation";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-23T08:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("validateLoanWindow", () => {
  it("keeps a date-only due date on the selected IST day", () => {
    const result = validateLoanWindow("2026-10-26");

    expect(result).toEqual({
      ok: true,
      iso: "2026-10-26T18:29:59.000Z",
    });
    expect(
      new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(result.ok ? result.iso : "")),
    ).toBe("26/10/2026");
  });

  it("accepts a full ISO timestamp", () => {
    expect(validateLoanWindow("2026-10-28T12:00:00.000Z")).toEqual({
      ok: true,
      iso: "2026-10-28T12:00:00.000Z",
    });
  });

  it("rejects an invalid date", () => {
    expect(validateLoanWindow("not-a-date")).toEqual({
      ok: false,
      error: "Pick a valid return date.",
    });
  });

  it("rejects a date in the past", () => {
    const result = validateLoanWindow("2026-10-22");
    expect(result.ok).toBe(false);
  });

  it("allows the full 21-day window", () => {
    expect(validateLoanWindow("2026-11-13").ok).toBe(true);
  });

  it("rejects a date beyond 21 days", () => {
    const result = validateLoanWindow("2026-11-14");
    expect(result.ok).toBe(false);
  });
});

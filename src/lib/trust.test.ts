import { describe, expect, it } from "vitest";
import { applyTrustChange, trustChangeForReturn, trustLabel } from "./trust";

const due = new Date("2026-10-20T18:00:00.000Z");

describe("trustChangeForReturn", () => {
  it("rewards an on-time return", () => {
    expect(
      trustChangeForReturn(due, new Date("2026-10-20T17:55:00.000Z")),
    ).toBe(5);
  });

  it("counts a partial late day as a full day", () => {
    expect(
      trustChangeForReturn(due, new Date("2026-10-20T20:00:00.000Z")),
    ).toBe(-2);
  });

  it("charges two points per late day", () => {
    expect(
      trustChangeForReturn(due, new Date("2026-10-23T18:00:00.000Z")),
    ).toBe(-6);
  });

  it("caps a single late return at minus ten", () => {
    expect(
      trustChangeForReturn(due, new Date("2026-11-05T18:00:00.000Z")),
    ).toBe(-10);
  });

  it("does not change trust for an invalid date", () => {
    expect(trustChangeForReturn("not-a-date", new Date())).toBe(0);
  });
});

describe("applyTrustChange", () => {
  it("clamps at the top of the scale", () => {
    expect(applyTrustChange(98, 5)).toBe(100);
  });

  it("clamps at the bottom of the scale", () => {
    expect(applyTrustChange(3, -10)).toBe(0);
  });

  it("applies ordinary changes", () => {
    expect(applyTrustChange(50, 5)).toBe(55);
    expect(applyTrustChange(50, -6)).toBe(44);
  });
});

describe("trustLabel", () => {
  it("describes each trust band", () => {
    expect(trustLabel(90)).toBe("Neighborhood anchor");
    expect(trustLabel(72)).toBe("Reliable neighbor");
    expect(trustLabel(58)).toBe("Good standing");
    expect(trustLabel(44)).toBe("Building trust");
    expect(trustLabel(12)).toBe("New neighbor");
  });
});

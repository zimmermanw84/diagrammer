import { describe, it, expect } from "vitest";
import { PPI, toPixels, toInches } from "./units";

describe("units", () => {
  it("PPI is 96", () => {
    expect(PPI).toBe(96);
  });

  describe("toPixels", () => {
    it("converts 1 inch to 96 pixels", () => {
      expect(toPixels(1)).toBe(96);
    });

    it("converts 0 inches to 0 pixels", () => {
      expect(toPixels(0)).toBe(0);
    });

    it("converts fractional inches", () => {
      expect(toPixels(0.5)).toBe(48);
      expect(toPixels(0.25)).toBe(24);
    });

    it("converts letter-width (11 inches) to 1056 pixels", () => {
      expect(toPixels(11)).toBe(1056);
    });
  });

  describe("toInches", () => {
    it("converts 96 pixels to 1 inch", () => {
      expect(toInches(96)).toBe(1);
    });

    it("converts 0 pixels to 0 inches", () => {
      expect(toInches(0)).toBe(0);
    });

    it("converts fractional pixels", () => {
      expect(toInches(48)).toBe(0.5);
      expect(toInches(24)).toBe(0.25);
    });
  });

  describe("round-trip", () => {
    it("toInches(toPixels(x)) === x", () => {
      for (const x of [0.5, 1, 2.5, 8.5, 11]) {
        expect(toInches(toPixels(x))).toBeCloseTo(x);
      }
    });

    it("toPixels(toInches(px)) === px", () => {
      for (const px of [24, 48, 96, 192, 1056]) {
        expect(toPixels(toInches(px))).toBeCloseTo(px);
      }
    });
  });
});

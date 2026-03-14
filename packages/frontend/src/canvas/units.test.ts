import { describe, it, expect } from "vitest";
import { PPI, toPixels, toInches, clientToSvgCoords } from "./units";

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

  describe("clientToSvgCoords", () => {
    const rect = { left: 200, top: 100 };
    const identity = { x: 0, y: 0, scale: 1 };

    it("converts client coords to SVG coords with identity transform", () => {
      const { x, y } = clientToSvgCoords(300, 200, rect, identity);
      expect(x).toBeCloseTo(100);
      expect(y).toBeCloseTo(100);
    });

    it("accounts for pan offset", () => {
      const { x, y } = clientToSvgCoords(300, 200, rect, { x: 50, y: -30, scale: 1 });
      expect(x).toBeCloseTo(50);  // (300 - 200 - 50) / 1
      expect(y).toBeCloseTo(130); // (200 - 100 - (-30)) / 1
    });

    it("accounts for zoom scale", () => {
      const { x, y } = clientToSvgCoords(300, 200, rect, { x: 0, y: 0, scale: 2 });
      expect(x).toBeCloseTo(50);  // (300 - 200) / 2
      expect(y).toBeCloseTo(50);  // (200 - 100) / 2
    });

    it("accounts for both pan and zoom", () => {
      const { x, y } = clientToSvgCoords(400, 300, rect, { x: 100, y: 50, scale: 2 });
      expect(x).toBeCloseTo(50);  // (400 - 200 - 100) / 2
      expect(y).toBeCloseTo(75);  // (300 - 100 - 50) / 2
    });

    it("returns 0,0 when client point equals the transformed SVG origin", () => {
      // origin at client (200+50, 100+50) = (250, 150) with pan (50,50) scale 1
      const { x, y } = clientToSvgCoords(250, 150, rect, { x: 50, y: 50, scale: 1 });
      expect(x).toBeCloseTo(0);
      expect(y).toBeCloseTo(0);
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

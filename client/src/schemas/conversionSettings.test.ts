import { describe, expect, it } from "vitest";

import {
  pdfPageSettingsSchema,
  pngToJpgSettingsSchema,
  getConversionSettingsSchema,
} from "./conversionSettings";

describe("pngToJpgSettingsSchema", () => {
  it("provides user-friendly defaults", () => {
    expect(pngToJpgSettingsSchema.parse({})).toEqual({
      quality: 85,
      backgroundColor: "#ffffff",
    });
  });

  it("converts quality from a form string to a number", () => {
    expect(
      pngToJpgSettingsSchema.parse({
        quality: "95",
        backgroundColor: "#000000",
      }),
    ).toEqual({
      quality: 95,
      backgroundColor: "#000000",
    });
  });

  it("rejects an invalid background color", () => {
    expect(
      pngToJpgSettingsSchema.safeParse({
        quality: 85,
        backgroundColor: "white",
      }).success,
    ).toBe(false);
  });

  it.each([0, 101])("rejects quality outside the range: %s", (quality) => {
    expect(
      pngToJpgSettingsSchema.safeParse({
        quality,
        backgroundColor: "#ffffff",
      }).success,
    ).toBe(false);
  });

  it.each([1, 100])("accepts quality boundary: %s", (quality) => {
    expect(
      pngToJpgSettingsSchema.safeParse({
        quality,
        backgroundColor: "#ffffff",
      }).success,
    ).toBe(true);
  });
});

describe("pdfPageSettingsSchema", () => {
  it("uses portrait orientation by default", () => {
    expect(pdfPageSettingsSchema.parse({})).toEqual({
      pageOrientation: "portrait",
    });
  });

  it("accepts landscape orientation", () => {
    expect(
      pdfPageSettingsSchema.parse({
        pageOrientation: "landscape",
      }),
    ).toEqual({
      pageOrientation: "landscape",
    });
  });

  it("rejects an unsupported orientation", () => {
    expect(
      pdfPageSettingsSchema.safeParse({
        pageOrientation: "sideways",
      }).success,
    ).toBe(false);
  });
});

describe("getConversionSettingsSchema", () => {
  it("returns PNG to JPG settings schema", () => {
    expect(getConversionSettingsSchema("png-to-jpg")).toBe(
      pngToJpgSettingsSchema,
    );
  });

  it.each(["jpg-to-pdf", "txt-to-pdf"] as const)(
    "returns PDF page settings schema for %s",
    (conversionType) => {
      expect(getConversionSettingsSchema(conversionType)).toBe(
        pdfPageSettingsSchema,
      );
    },
  );

  it("returns null for a conversion without additional settings", () => {
    expect(getConversionSettingsSchema("jpg-to-png")).toBeNull();
  });
});

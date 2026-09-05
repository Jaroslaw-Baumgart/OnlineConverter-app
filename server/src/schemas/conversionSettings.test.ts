import { describe, expect, it } from "vitest";

import { pngToJpgSettingsSchema, pdfPageSettingsSchema } from "./conversionSettings";

describe("pngToJpgSettingsSchema", () => {
  it("provides safe defaults when settings are missing", () => {
    expect(pngToJpgSettingsSchema.parse({})).toEqual({
      quality: 85,
      backgroundColor: "#ffffff",
    });
  });

  it("converts multipart form strings into validated settings", () => {
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

  it.each(["0", "101", "not-a-number"])(
    "rejects invalid quality: %s",
    (quality) => {
      expect(
        pngToJpgSettingsSchema.safeParse({
          quality,
          backgroundColor: "#ffffff",
        }).success,
      ).toBe(false);
    },
  );

  it("rejects an invalid background color", () => {
    expect(
      pngToJpgSettingsSchema.safeParse({
        quality: "85",
        backgroundColor: "white",
      }).success,
    ).toBe(false);
  });
});

describe("pdfPageSettingsSchema", () => {
  it("provides portrait as the safe default", () => {
    expect(pdfPageSettingsSchema.parse({})).toEqual({
      pageOrientation: "portrait",
    });
  });

  it("accepts landscape orientation from multipart form data", () => {
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

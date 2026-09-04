import { describe, expect, it } from "vitest";

import { createConversionFormData } from "./conversionFormData";
import type { ConversionOption } from "../types/converter";

describe("createConversionFormData", () => {
  it("includes PNG to JPG settings in the conversion payload", () => {
    const file = new File(["png content"], "image.png", {
      type: "image/png",
    });

    const option = {
      conversionType: "png-to-jpg",
      sourceFormat: "png",
      targetFormat: "jpg",
      disabled: false,
    } satisfies ConversionOption;

    const formData = createConversionFormData(file, option, {
      quality: 95,
      backgroundColor: "#000000",
    });

    expect(formData.get("file")).toBe(file);
    expect(formData.get("conversionType")).toBe("png-to-jpg");
    expect(formData.get("target")).toBe("jpg");
    expect(formData.get("quality")).toBe("95");
    expect(formData.get("backgroundColor")).toBe("#000000");
  });
});

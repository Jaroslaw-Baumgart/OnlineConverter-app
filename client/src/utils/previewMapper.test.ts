import { describe, expect, it } from "vitest";
import { createPreviewData } from "./previewMapper";

describe("createPreviewData", () => {
  it("creates CSV preview data for a CSV file", () => {
    const file = new File(
      ["Name,Amount\nAnna,2"],
      "payments.csv",
      { type: "text/csv" },
    );

    const preview = createPreviewData(file, "", false);

    expect(preview).toEqual({
      kind: "csv",
      file,
      isLoading: false,
    });
  });
});
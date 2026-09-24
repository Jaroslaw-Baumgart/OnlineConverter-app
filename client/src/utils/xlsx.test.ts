import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseXlsxFile } from "./xlsx";

describe("parseXlsxFile", () => {
  it("reads sheets in order and preserves cell positions", async () => {
    const workbook = XLSX.utils.book_new();

    const sales = XLSX.utils.aoa_to_sheet([
      ["Produkt", "Uwagi", "Ilość"],
      ["Żółta herbata", null, 2],
    ]);

    const summary = XLSX.utils.aoa_to_sheet([["Status"], ["Gotowe"]]);

    XLSX.utils.book_append_sheet(workbook, sales, "Sprzedaż");
    XLSX.utils.book_append_sheet(workbook, summary, "Podsumowanie");

    const bytes = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });

    const file = new File([bytes], "report.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await expect(parseXlsxFile(file)).resolves.toEqual([
      {
        name: "Sprzedaż",
        rows: [
          ["Produkt", "Uwagi", "Ilość"],
          ["Żółta herbata", "", "2"],
        ],
      },
      {
        name: "Podsumowanie",
        rows: [["Status"], ["Gotowe"]],
      },
    ]);
  });
});

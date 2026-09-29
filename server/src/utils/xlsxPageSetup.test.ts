import { describe, expect, it } from "vitest";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

import { applyXlsxPageSetup } from "./xlsxPageSetup";

const createWorkbookArchive = () =>
  zipSync({
    "[Content_Types].xml": strToU8("<Types />"),
    "xl/workbook.xml": strToU8(`
      <workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
        <sheets>
          <sheet name="Overview" sheetId="1" r:id="rId1" />
          <sheet name="Details" sheetId="2" r:id="rId2" />
        </sheets>
      </workbook>
    `),
    "xl/_rels/workbook.xml.rels": strToU8(`
      <Relationships>
        <Relationship
          Id="rId1"
          Target="worksheets/sheet1.xml"
        />
        <Relationship
          Id="rId2"
          Target="worksheets/sheet2.xml"
        />
      </Relationships>
    `),
    "xl/worksheets/sheet1.xml": strToU8(`
      <worksheet>
        <sheetData />
        <pageSetup
          paperSize="9"
          orientation="portrait"
          fitToWidth="1"
        />
      </worksheet>
    `),
    "xl/worksheets/sheet2.xml": strToU8(`
      <worksheet>
        <sheetData />
      </worksheet>
    `),
    "xl/charts/chart1.xml": strToU8("<chart>unchanged chart</chart>"),
  });

const readXml = (archive: Uint8Array, filePath: string) => {
  const files = unzipSync(archive);
  return strFromU8(files[filePath]);
};

describe("applyXlsxPageSetup", () => {
  it("updates page settings only for the selected sheet", () => {
    const prepared = applyXlsxPageSetup(createWorkbookArchive(), "Overview", {
      pageSize: "A3",
      pageOrientation: "landscape",
    });

    const overview = readXml(prepared, "xl/worksheets/sheet1.xml");
    const details = readXml(prepared, "xl/worksheets/sheet2.xml");

    expect(overview).toContain('paperSize="8"');
    expect(overview).toContain('orientation="landscape"');
    expect(overview).toContain('fitToWidth="1"');

    expect(details).not.toContain("<pageSetup");
  });

  it("adds page settings when the selected sheet has none", () => {
    const prepared = applyXlsxPageSetup(createWorkbookArchive(), "Details", {
      pageSize: "A4",
      pageOrientation: "portrait",
    });

    const overview = readXml(prepared, "xl/worksheets/sheet1.xml");
    const details = readXml(prepared, "xl/worksheets/sheet2.xml");

    expect(overview).toContain('paperSize="9"');
    expect(overview).toContain('orientation="portrait"');

    expect(details).toContain("<pageSetup");
    expect(details).toContain('paperSize="9"');
    expect(details).toContain('orientation="portrait"');
  });

  it("preserves chart files while preparing the workbook", () => {
    const prepared = applyXlsxPageSetup(createWorkbookArchive(), "Overview", {
      pageSize: "A3",
      pageOrientation: "landscape",
    });

    expect(readXml(prepared, "xl/charts/chart1.xml")).toBe(
      "<chart>unchanged chart</chart>",
    );
  });

  it("rejects a sheet name that does not exist", () => {
    expect(() =>
      applyXlsxPageSetup(createWorkbookArchive(), "Missing sheet", {
        pageSize: "A4",
        pageOrientation: "portrait",
      }),
    ).toThrow("Sheet not found: Missing sheet");
  });

  it("handles namespaced workbook XML and absolute worksheet targets", () => {
    const namespacedArchive = zipSync({
      "xl/workbook.xml": strToU8(`
      <x:workbook xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <x:sheets>
          <x:sheet name="Kategorie" sheetId="1" r:id="rId1"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" />
        </x:sheets>
      </x:workbook>
    `),
      "xl/_rels/workbook.xml.rels": strToU8(`
      <Relationships>
        <Relationship Id="rId1" Target="/xl/worksheets/sheet1.xml" />
      </Relationships>
    `),
      "xl/worksheets/sheet1.xml": strToU8(`
      <x:worksheet xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <x:sheetData />
      </x:worksheet>
    `),
    });

    const prepared = applyXlsxPageSetup(namespacedArchive, "Kategorie", {
      pageSize: "A3",
      pageOrientation: "landscape",
    });

    expect(readXml(prepared, "xl/worksheets/sheet1.xml")).toContain(
      '<x:pageSetup paperSize="8" orientation="landscape" />',
    );
  });
});

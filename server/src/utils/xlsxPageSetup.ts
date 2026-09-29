import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

export type XlsxPageSettings = {
  pageSize: "A4" | "A3";
  pageOrientation: "portrait" | "landscape";
};

const readXmlAttribute = (element: string, attributeName: string) => {
  const match = element.match(new RegExp(`\\b${attributeName}="([^"]*)"`));

  return match?.[1];
};

const getXmlTagPrefix = (xml: string, tagName: string) => {
  const match = xml.match(new RegExp(`<([\\w.-]+:)?${tagName}\\b`));

  return match?.[1] ?? "";
};

export function applyXlsxPageSetup(
  archive: Uint8Array,
  sheetName: string,
  settings: XlsxPageSettings,
): Uint8Array {
  const files = unzipSync(archive);
  const workbookXml = strFromU8(files["xl/workbook.xml"]);
  const relationshipXml = strFromU8(files["xl/_rels/workbook.xml.rels"]);

  const sheetPrefix = getXmlTagPrefix(workbookXml, "sheet");

  const sheetElements =
    workbookXml.match(new RegExp(`<${sheetPrefix}sheet\\b[^>]*>`, "g")) ?? [];

  const selectedSheetElement = sheetElements.find(
    (element) => readXmlAttribute(element, "name") === sheetName,
  );

  if (!selectedSheetElement) {
    throw new Error(`Sheet not found: ${sheetName}`);
  }

  const relationshipId = readXmlAttribute(selectedSheetElement, "r:id");

  const relationshipElements =
    relationshipXml.match(/<Relationship\b[^>]*>/g) ?? [];

  const relationshipElement = relationshipElements.find(
    (element) => readXmlAttribute(element, "Id") === relationshipId,
  );

  const worksheetTarget = relationshipElement
    ? readXmlAttribute(relationshipElement, "Target")
    : undefined;

  if (!worksheetTarget) {
    throw new Error(`Worksheet file not found: ${sheetName}`);
  }

  const worksheetPath = worksheetTarget.startsWith("/")
    ? worksheetTarget.slice(1)
    : `xl/${worksheetTarget}`;

  const worksheetFile = files[worksheetPath];

  if (!worksheetFile) {
    throw new Error(`Worksheet file not found: ${sheetName}`);
  }

  const worksheetXml = strFromU8(worksheetFile);

  const worksheetPrefix = getXmlTagPrefix(worksheetXml, "worksheet");
  const pageSetupTagName = `${worksheetPrefix}pageSetup`;

  const paperSize = settings.pageSize === "A3" ? "8" : "9";

  const existingPageSetup = worksheetXml.match(
    new RegExp(`<${pageSetupTagName}\\b[^>]*\\/>`),
  )?.[0];

  const pageSetup = existingPageSetup
    ? existingPageSetup
        .replace(/\s+paperSize="[^"]*"/, "")
        .replace(/\s+orientation="[^"]*"/, "")
        .replace(
          "/>",
          ` paperSize="${paperSize}" orientation="${settings.pageOrientation}" />`,
        )
    : `<${pageSetupTagName} paperSize="${paperSize}" orientation="${settings.pageOrientation}" />`;

  const updatedWorksheetXml = existingPageSetup
    ? worksheetXml.replace(existingPageSetup, pageSetup)
    : worksheetXml.replace(
        `</${worksheetPrefix}worksheet>`,
        `${pageSetup}</${worksheetPrefix}worksheet>`,
      );

  files[worksheetPath] = strToU8(updatedWorksheetXml);

  return zipSync(files);
}

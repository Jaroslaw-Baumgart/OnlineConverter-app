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

const removeSheetState = (element: string) => {
  return element.replace(/\s+state="[^"]*"/, "");
};

const enableFitToPage = (worksheetXml: string, worksheetPrefix: string) => {
  const sheetPrTagName = `${worksheetPrefix}sheetPr`;
  const pageSetUpPrTagName = `${worksheetPrefix}pageSetUpPr`;
  const fitToPage = `<${pageSetUpPrTagName} fitToPage="1" />`;

  const existingSheetPr = worksheetXml.match(
    new RegExp(
      `<${sheetPrTagName}\\b[^>]*(?:/>|>[\\s\\S]*?</${sheetPrTagName}>)`,
    ),
  )?.[0];

  if (!existingSheetPr) {
    return worksheetXml.replace(
      new RegExp(`(<${worksheetPrefix}worksheet\\b[^>]*>)`),
      (openingTag) =>
        `${openingTag}<${sheetPrTagName}>${fitToPage}</${sheetPrTagName}>`,
    );
  }

  const existingPageSetUpPr = existingSheetPr.match(
    new RegExp(`<${pageSetUpPrTagName}\\b[^>]*/>`),
  )?.[0];

  const updatedSheetPr = existingPageSetUpPr
    ? existingSheetPr.replace(
        existingPageSetUpPr,
        existingPageSetUpPr
          .replace(/\s+fitToPage="[^"]*"/, "")
          .replace("/>", ' fitToPage="1" />'),
      )
    : existingSheetPr.endsWith("/>")
      ? existingSheetPr.replace("/>", `>${fitToPage}</${sheetPrTagName}>`)
      : existingSheetPr.replace(
          `</${sheetPrTagName}>`,
          `${fitToPage}</${sheetPrTagName}>`,
        );

  return worksheetXml.replace(existingSheetPr, updatedSheetPr);
};

export function applyXlsxPageSetup(
  archive: Uint8Array,
  sheetName: string | undefined,
  settings: XlsxPageSettings,
): Uint8Array {
  const files = unzipSync(archive);
  const workbookXml = strFromU8(files["xl/workbook.xml"]);
  const relationshipXml = strFromU8(files["xl/_rels/workbook.xml.rels"]);

  const sheetPrefix = getXmlTagPrefix(workbookXml, "sheet");

  const sheetElements =
    workbookXml.match(new RegExp(`<${sheetPrefix}sheet\\b[^>]*>`, "g")) ?? [];

  if (sheetName !== undefined) {
    const selectedSheetElement = sheetElements.find(
      (element) => readXmlAttribute(element, "name") === sheetName,
    );

    if (!selectedSheetElement) {
      throw new Error(`Sheet not found: ${sheetName}`);
    }

    let updatedWorkbookXml = workbookXml;

    for (const element of sheetElements) {
      const updatedElement =
        element === selectedSheetElement ? removeSheetState(element) : "";

      updatedWorkbookXml = updatedWorkbookXml.replace(element, updatedElement);
    }

    files["xl/workbook.xml"] = strToU8(updatedWorkbookXml);
  }

  const relationshipElements =
    relationshipXml.match(/<Relationship\b[^>]*>/g) ?? [];

  for (const sheetElement of sheetElements) {
    const currentSheetName = readXmlAttribute(sheetElement, "name") ?? "";
    const relationshipId = readXmlAttribute(sheetElement, "r:id");

    const relationshipElement = relationshipElements.find(
      (element) => readXmlAttribute(element, "Id") === relationshipId,
    );

    const worksheetTarget = relationshipElement
      ? readXmlAttribute(relationshipElement, "Target")
      : undefined;

    if (!worksheetTarget) {
      throw new Error(`Worksheet file not found: ${currentSheetName}`);
    }

    const worksheetPath = worksheetTarget.startsWith("/")
      ? worksheetTarget.slice(1)
      : `xl/${worksheetTarget}`;

    const worksheetFile = files[worksheetPath];

    if (!worksheetFile) {
      throw new Error(`Worksheet file not found: ${currentSheetName}`);
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
          .replace(/\s+fitToWidth="[^"]*"/, "")
          .replace(/\s+fitToHeight="[^"]*"/, "")
          .replace(/\s+scale="[^"]*"/, "")
          .replace(
            "/>",
            ` paperSize="${paperSize}" orientation="${settings.pageOrientation}" fitToWidth="1" fitToHeight="1" />`,
          )
      : `<${pageSetupTagName} paperSize="${paperSize}" orientation="${settings.pageOrientation}" fitToWidth="1" fitToHeight="1" />`;

    const worksheetWithPageSetup = existingPageSetup
      ? worksheetXml.replace(existingPageSetup, pageSetup)
      : worksheetXml.replace(
          `</${worksheetPrefix}worksheet>`,
          `${pageSetup}</${worksheetPrefix}worksheet>`,
        );

    const updatedWorksheetXml = enableFitToPage(
      worksheetWithPageSetup,
      worksheetPrefix,
    );

    files[worksheetPath] = strToU8(updatedWorksheetXml);
  }

  return zipSync(files);
}

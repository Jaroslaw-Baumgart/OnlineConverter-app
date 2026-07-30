interface ConversionDefinitionShape {
  conversionType: string;
  sourceFormat: string;
  targetFormat: string;
}

export const conversions = [
  {
    conversionType: "pdf-to-jpg",
    sourceFormat: "pdf",
    targetFormat: "jpg",
  },
  {
    conversionType: "pdf-to-txt",
    sourceFormat: "pdf",
    targetFormat: "txt",
  },
  {
    conversionType: "jpg-to-png",
    sourceFormat: "jpg",
    targetFormat: "png",
  },
  {
    conversionType: "png-to-jpg",
    sourceFormat: "png",
    targetFormat: "jpg",
  },
  {
    conversionType: "jpg-to-pdf",
    sourceFormat: "jpg",
    targetFormat: "pdf",
  },
  {
    conversionType: "txt-to-pdf",
    sourceFormat: "txt",
    targetFormat: "pdf",
  },
  {
    conversionType: "docx-to-pdf",
    sourceFormat: "docx",
    targetFormat: "pdf",
  },
] as const satisfies readonly ConversionDefinitionShape[];

export type ConversionDefinition = (typeof conversions)[number];

export type ConversionType = ConversionDefinition["conversionType"];

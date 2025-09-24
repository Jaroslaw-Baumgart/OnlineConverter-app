import { ConversionType } from "../types/converter";

export const allowedConversions: Record<string, ConversionType[]> = {
  pdf: ["pdf-to-jpg", "pdf-to-txt"],
  jpg: ["jpg-to-png", "jpg-to-pdf"],
  png: ["png-to-jpg"],
  txt: ["txt-to-pdf"],
  docx: ["docx-to-pdf"],
};

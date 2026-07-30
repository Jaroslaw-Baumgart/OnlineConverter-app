import type { ConversionDefinition } from "../config/conversions";

export type ConversionOption = ConversionDefinition & {
  disabled: boolean;
};

export interface FileConverterProps {
  file: File | null;
  convertedFile: string | null;
  setConvertedFile: (url: string | null) => void;
  onFileUpload: (file: File) => void;
  conversionOptions: readonly ConversionDefinition[];
}
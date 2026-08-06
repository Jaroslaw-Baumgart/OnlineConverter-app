import type { ConversionDefinition } from "../config/conversions";

export type ConversionOption = ConversionDefinition & {
  disabled: boolean;
};

export interface FileConverterProps {
  file: File | null;
  onFileUpload: (file: File) => void;
  conversionOptions: readonly ConversionDefinition[];
}

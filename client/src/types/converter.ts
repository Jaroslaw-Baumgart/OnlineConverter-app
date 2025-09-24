export type ConversionType =
  | "pdf-to-jpg"
  | "pdf-to-txt"
  | "jpg-to-png"
  | "png-to-jpg"
  | "jpg-to-pdf"
  | "txt-to-pdf"
  | "docx-to-pdf";

export interface ConversionOption {
  id: ConversionType;
  label: string;
  from: string;
  to: string;
  disabled?: boolean;
}

export interface FileConverterProps {
  file: File | null;
  convertedFile: string | null;
  setConvertedFile: (url: string | null) => void;
  onFileUpload: (file: File) => void;
  onDownload: () => void;
  conversionOptions: ConversionOption[];
}

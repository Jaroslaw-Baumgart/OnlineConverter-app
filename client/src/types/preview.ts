type ImagePreviewData = {
  kind: "image";
  url: string;
};

type PDFPreviewData = {
  kind: "pdf";
  url: string;
};

type TextPreviewData = {
  kind: "text";
  file: File;
  isLoading: boolean;
};

type WordPreviewData = {
  kind: "word";
  file: File;
  isLoading: boolean;
};

type CsvPreviewData = {
  kind: "csv";
  file: File;
  isLoading: boolean;
}

type XlsxPreviewData = {
  kind: "xlsx";
  file: File;
  isLoading: boolean;
}

type PptxPreviewData = {
  kind: "pptx";
  file: File;
  isLoading: boolean;
}

type UnsupportedPreviewData = {
  kind: "unsupported";
  fileType: string;
};

export type PreviewData =
  | ImagePreviewData
  | PDFPreviewData
  | TextPreviewData
  | WordPreviewData
  | CsvPreviewData
  | XlsxPreviewData
  | PptxPreviewData
  | UnsupportedPreviewData;

export type PreviewKind = PreviewData["kind"];

export type ConfiguredPreviewKind = Exclude<PreviewKind, "unsupported">;

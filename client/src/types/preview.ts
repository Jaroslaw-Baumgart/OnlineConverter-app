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
};

type UnsupportedPreviewData = {
  kind: "unsupported";
  fileType: string;
};

export type PreviewData =
  | ImagePreviewData
  | PDFPreviewData
  | TextPreviewData
  | WordPreviewData
  | UnsupportedPreviewData;

export type PreviewKind = PreviewData["kind"];

export type ConfiguredPreviewKind = Exclude<PreviewKind, "unsupported">;

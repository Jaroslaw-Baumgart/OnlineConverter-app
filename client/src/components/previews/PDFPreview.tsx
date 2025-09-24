export default function PDFPreview({ url }: { url: string }) {
  return <iframe src={url} title="PDF Preview" className="pdf-preview" />;
}

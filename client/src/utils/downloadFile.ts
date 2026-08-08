export function downloadFile(file: File): void {
  const blobUrl = URL.createObjectURL(file);
  const anchor = document.createElement("a");

  try {
    anchor.href = blobUrl;
    anchor.download = file.name || "converted-file";

    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(blobUrl);
  }
}

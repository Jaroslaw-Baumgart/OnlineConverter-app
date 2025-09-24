export const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

export const extractFileInfo = (data: any): { path: string; name: string } | null => {
  if (data?.files?.length) {
    const { url, name } = data.files[0];
    if (url) return { path: url, name: name || url.split("/").pop() || "converted-file" };
  }
  if (data?.outputFile) {
    const name = data.outputFile.split("/").pop() || "converted-file";
    return { path: data.outputFile, name };
  }
  if (data?.filename) {
    return { path: `/output/${data.filename}`, name: data.filename };
  }
  return null;
};

export const toAbsoluteUrl = (maybeRelative: string) =>
  /^https?:\/\//i.test(maybeRelative)
    ? maybeRelative
    : `http://localhost:5000${maybeRelative.startsWith("/") ? "" : "/"}${maybeRelative}`;

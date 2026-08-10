export const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

export const toAbsoluteUrl = (maybeRelative: string) =>
  /^https?:\/\//i.test(maybeRelative)
    ? maybeRelative
    : `http://localhost:5000${maybeRelative.startsWith("/") ? "" : "/"}${maybeRelative}`;

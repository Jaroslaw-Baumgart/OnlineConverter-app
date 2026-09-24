import * as XLSX from "xlsx";

export type XlsxSheet = {
  name: string;
  rows: string[][];
};

export function parseXlsxFile(file: File): Promise<XlsxSheet[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(reader.error);
    };

    reader.onload = () => {
      if (!(reader.result instanceof ArrayBuffer)) {
        reject(new Error("Failed to read XLSX file."));
        return;
      }

      try {
        const workbook = XLSX.read(reader.result, { type: "array" });
        const sheets = workbook.SheetNames.map((name) => {
          const worksheet = workbook.Sheets[name];
          const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, {
            header: 1,
            raw: false,
            defval: "",
          });

          return { name, rows };
        });

        resolve(sheets);
      } catch (err) {
        reject(err);
      }
    };

    reader.readAsArrayBuffer(file);
  });
}

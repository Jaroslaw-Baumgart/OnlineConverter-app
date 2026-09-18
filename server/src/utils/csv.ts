import Papa from "papaparse"

export type CsvRow = Record<string, string>;

export function parseCsv(csvText: string): CsvRow[] {
    const result = Papa.parse<CsvRow>(csvText, {
        header: true,
        skipEmptyLines: true,
    });

    if (result.errors.length > 0) {
        throw new Error("Invalid CSV data.");
    }

    return result.data;
}
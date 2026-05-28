import * as XLSX from "xlsx";
import Papa from "papaparse";

export function parseFile(file: File): Promise<any[]> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const data = e.target.result;

      if (file.name.endsWith(".xlsx")) {
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(sheet));
      } else {
        Papa.parse(data, {
          header: true,
          complete: (res) => resolve(res.data),
        });
      }
    };

    reader.readAsBinaryString(file);
  });
}

export function normalizeData(rows: any[]) {
  return rows
    .map((r) => {
      if (!r.fecha || !r.hora) return null;

      const d = new Date(`${r.fecha} ${r.hora}`);

      if (d.getFullYear() === 1900) return null;

      return { datetime: d, value: Number(r.consumo_kWh) };
    })
    .filter(Boolean);
}

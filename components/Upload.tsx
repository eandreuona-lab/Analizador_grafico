"use client";

import { parseFile, normalizeData } from "@/lib/parser";

export default function Upload({ setData }: any) {
  const handleFile = async (e: any) => {
    const file = e.target.files[0];
    const rows = await parseFile(file);
    const clean = normalizeData(rows);
    setData(clean);
  };

  return (
    <input
      type="file"
      onChange={handleFile}
      className="p-2 border rounded"
    />
  );
}
``
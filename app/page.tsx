"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Chart from "@/components/Chart";
import CompareChart from "@/components/CompareChart";
import * as XLSX from "xlsx";

export default function Home() {

  const [data, setData] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);

  const [mode, setMode] = useState("single");
  const [dark, setDark] = useState(false);

  const [selectedHotel, setSelectedHotel] = useState("");

  const [frequency, setFrequency] = useState("h");

  const [windowSize, setWindowSize] = useState("1m");
  const [baseDate, setBaseDate] = useState("");
  const [periodDate, setPeriodDate] = useState("");

  // ✅ HOTELS API + AUTOSELECT
  useEffect(() => {
    fetch("/api/hotels")
      .then((res) => res.json())
      .then((data) => {
        setHotels(data);

        if (data.length > 0) {
          setSelectedHotel(data[0].file);
        }
      })
      .catch((err) => console.error("Error cargando hoteles:", err));
  }, []);

  // ✅ LOAD EXCEL
  useEffect(() => {
    if (!selectedHotel) return;

    fetch(selectedHotel)
      .then((res) => res.arrayBuffer())
      .then((fileData) => {
        const workbook = XLSX.read(fileData, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);

        const formatted = json.map((row: any) => ({
          datetime: new Date(`${row.fecha} ${row.hora}`).toISOString(),
          value: Number(row.consumo_kWh) || 0,
        }));

        formatted.sort(
          (a, b) =>
            new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
        );

        setData(formatted);
      })
      .catch((err) => console.error("Error cargando Excel:", err));
  }, [selectedHotel]);

  // ✅ KPI RAW
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <main className={`${dark ? "bg-[#0f172a] text-white" : "bg-gray-100"} min-h-screen`}>

      {/* HEADER */}
      <header className={`${dark ? "bg-[#1e293b]" : "bg-white"} border-b`}>
        <div className="flex items-center px-6 py-3 gap-4">
          <img src="/logo.png" className="h-6" />

          <div>
            <h1 className="text-lg font-semibold">Ona Hotels Energy</h1>
            <p className="text-xs text-gray-400">Energy analytics tool</p>
          </div>

          <button
            onClick={() => setDark(!dark)}
            className="ml-auto px-3 py-1 bg-gray-200 rounded"
          >
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      {/* CONTROL */}
      <div className="bg-white border-b px-6 py-3 flex gap-4 items-center">

        <select
          value={selectedHotel}
          onChange={(e) => setSelectedHotel(e.target.value)}
          className="p-1 border rounded"
        >
          {hotels.map((h) => (
            <option key={h.file} value={h.file}>{h.name}</option>
          ))}
        </select>

        <div className="ml-auto flex gap-2">
          <button onClick={() => setMode("single")}>Curve</button>
          <button onClick={() => setMode("compare")}>Compare</button>
        </div>

      </div>

      {/* CONTENIDO */}
      <div className="p-6">

        {data.length === 0 && (
          <div className="text-center text-gray-400">
            Selecciona un hotel o espera carga...
          </div>
        )}

        {mode === "single" && data.length > 0 && (
          <Chart data={data} />
        )}

        {mode === "compare" && data.length > 0 && (
          <CompareChart data1={data} data2={data} />
        )}

      </div>

    </main>
  );
}

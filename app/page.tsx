"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Chart from "@/components/Chart";
import CompareChart from "@/components/CompareChart";
import * as XLSX from "xlsx";

export default function Home() {

  // =========================
  // ESTADOS
  // =========================

  const [data, setData] = useState([]);

  const [mode, setMode] = useState("single");
  const [dark, setDark] = useState(false);

  const [selectedHotel, setSelectedHotel] = useState("");

  const [frequency, setFrequency] = useState("h");

  const [windowSize, setWindowSize] = useState("1m");
  const [baseDate, setBaseDate] = useState("");
  const [periodDate, setPeriodDate] = useState("");

  const hotels = [
    { name: "PALAMOS", file: "/data/PALAMOS.xlsx" },
    { name: "OFICINAS CALABRIA", file: "/data/OFICINAS_CALABRIA.xlsx" },
  ];

  // =========================
  // CARGA EXCEL
  // =========================

  useEffect(() => {
    if (!selectedHotel) return;

    fetch(selectedHotel)
      .then((res) => res.arrayBuffer())
      .then((data) => {
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);

        const formatted = json.map((row: any) => ({
          datetime: `${row.fecha} ${row.hora}`,
          value: row.consumo_kWh,
        }));

        setData(formatted);
      });
  }, [selectedHotel]);

  // =========================
  // WINDOW
  // =========================

  function getWindowRange(start: string, windowSize: string) {
    const d = new Date(start);
    const end = new Date(d);

    if (windowSize === "1d") end.setDate(d.getDate() + 1);
    if (windowSize === "1w") end.setDate(d.getDate() + 7);
    if (windowSize === "15d") end.setDate(d.getDate() + 15);
    if (windowSize === "1m") end.setMonth(d.getMonth() + 1);
    if (windowSize === "3m") end.setMonth(d.getMonth() + 3);
    if (windowSize === "6m") end.setMonth(d.getMonth() + 6);

    return { start: d, end };
  }

  const baseRange = baseDate ? getWindowRange(baseDate, windowSize) : null;
  const periodRange = periodDate ? getWindowRange(periodDate, windowSize) : null;

  const data1 = baseRange
    ? data.filter((d: any) => {
        const t = new Date(d.datetime);
        return t >= baseRange.start && t <= baseRange.end;
      })
    : [];

  const data2 = periodRange
    ? data.filter((d: any) => {
        const t = new Date(d.datetime);
        return t >= periodRange.start && t <= periodRange.end;
      })
    : [];

  // =========================
  // FREQUENCY (AGREGACIÓN)
  // =========================

  function aggregateData(data: any[], freq: string) {
    const groups: any = {};

    data.forEach((d) => {
      const date = new Date(d.datetime);
      let key;

      if (freq === "h") {
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
      }

      if (freq === "30m") {
        const m = date.getMinutes() < 30 ? "00" : "30";
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}:${m}`;
      }

      if (freq === "d") {
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      }

      if (freq === "w") {
        const week = Math.floor(date.getDate() / 7);
        key = `${date.getFullYear()}-${date.getMonth()}-W${week}`;
      }

      if (freq === "m") {
        key = `${date.getFullYear()}-${date.getMonth()}`;
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });

    return Object.values(groups).map((group: any) => ({
     datetime: new Date(group[0].datetime),
      value:
        group.reduce((a: number, b: any) => a + b.value, 0) / group.length,
    }));
  }

  const data1Agg = aggregateData(data1, frequency);
  const data2Agg = aggregateData(data2, frequency);

  // =========================
  // KPIs
  // =========================

  // ✅ KPI CORRECTOS (datos reales)

const total1 = data1.reduce((acc: number, d: any) => acc + d.value, 0);
const total2 = data2.reduce((acc: number, d: any) => acc + d.value, 0);

const diffKwh = total2 - total1;

const diffPercent =
  total1 !== 0 ? (diffKwh / total1) * 100 : 0;

  // =========================
  // UI
  // =========================

  return (
    <main className={`${dark ? "bg-[#0f172a] text-white" : "bg-[#f4f6f8]"} min-h-screen`}>

      {/* HEADER */}
      <header className={`${dark ? "bg-[#1e293b]" : "bg-white"} border-b`}>
        <div className="w-full px-4 py-2 flex gap-4 items-center">
          <img src="/logo.png" className="h-8" />

          <div>
            <h1 className="text-lg font-semibold">Ona Hotels Energy</h1>
            <p className="text-xs text-gray-400">Analizador energético</p>
          </div>

          <button
            onClick={() => setDark(!dark)}
            className="ml-auto px-3 py-1 bg-gray-200 rounded"
          >
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      {/* CONTENIDO */}
      <div className="p-4 space-y-4">

        {/* MODO */}
        <div className="flex gap-2">
          <button onClick={() => setMode("single")} className={`px-3 py-1 rounded ${mode === "single" ? "bg-teal-500 text-white" : "bg-gray-200"}`}>
            Curva
          </button>

          <button onClick={() => setMode("compare")} className={`px-3 py-1 rounded ${mode === "compare" ? "bg-teal-500 text-white" : "bg-gray-200"}`}>
            Comparación
          </button>
        </div>

        {/* FILTROS */}
        <div className="flex flex-wrap gap-3">

          {/* HOTEL */}
          <select onChange={(e) => setSelectedHotel(e.target.value)} className="p-2 border rounded">
            <option>Selecciona hotel</option>
            {hotels.map((h) => (
              <option key={h.file} value={h.file}>{h.name}</option>
            ))}
          </select>

          {/* FREQUENCY */}
          <div className="flex gap-1">
            {["30m", "h", "d", "w", "m"].map((f) => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                className={`px-2 py-1 rounded ${frequency === f ? "bg-green-500 text-white" : "bg-gray-200"}`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* WINDOW */}
          <select onChange={(e) => setWindowSize(e.target.value)} className="p-2 border rounded">
            <option value="1d">1 día</option>
            <option value="1w">1 semana</option>
            <option value="15d">15 días</option>
            <option value="1m">1 mes</option>
            <option value="3m">3 meses</option>
            <option value="6m">6 meses</option>
          </select>

          <input type="date" value={baseDate} onChange={(e) => setBaseDate(e.target.value)} className="p-2 border rounded" />
          <input type="date" value={periodDate} onChange={(e) => setPeriodDate(e.target.value)} className="p-2 border rounded" />

        </div>

        {/* ✅ MODO CURVA */}
        {mode === "single" && (
          <Chart data={data} />
        )}

        {/* ✅ MODO COMPARACIÓN */}
        {mode === "compare" && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-4">

              <div className="p-3 bg-gray-100 rounded">
                <div className="text-xs">Base</div>
                <div>{total1.toFixed(0)} kWh</div>
              </div>

              <div className="p-3 bg-gray-100 rounded">
                <div className="text-xs">Periodo</div>
                <div>{total2.toFixed(0)} kWh</div>
              </div>

              <div className={`p-3 rounded ${diffKwh > 0 ? "bg-red-200" : "bg-green-200"}`}>
                <div className="text-xs">Diferencia</div>
                <div>{diffKwh.toFixed(0)} kWh</div>
                <div>{diffPercent.toFixed(1)} %</div>
              </div>

            </div>

            <CompareChart data1={data1Agg} data2={data2Agg} />
          </>
        )}

      </div>
    </main>
  );
}

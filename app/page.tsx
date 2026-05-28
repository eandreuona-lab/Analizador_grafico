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
  <main className={`${dark ? "bg-[#0f172a] text-white" : "bg-gray-100"} min-h-screen`}>

    {/* ✅ HEADER */}
    <header className={`${dark ? "bg-[#1e293b]" : "bg-white"} border-b`}>
      <div className="flex items-center px-6 py-3 gap-4">

        /logo.png

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

    {/* ✅ CONTROL PANEL (TIPO DEXMA) */}
    <div className={`${dark ? "bg-[#1e293b]" : "bg-white"} border-b`}>
      <div className="flex flex-wrap gap-4 px-6 py-3 items-center text-sm">

        {/* DEVICE */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Device</span>
          <select
            value={selectedHotel}
            onChange={(e) => setSelectedHotel(e.target.value)}
            className="p-1 border rounded"
          >
            <option value="">Select</option>
            {hotels.map((h) => (
              <option key={h.file} value={h.file}>{h.name}</option>
            ))}
          </select>
        </div>

        {/* FREQUENCY */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Frequency</span>

          <div className="flex gap-1">
            {["30m", "h", "d", "w", "m"].map((f) => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                className={`px-2 py-1 rounded ${
                  frequency === f ? "bg-green-500 text-white" : "bg-gray-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* WINDOW */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Window</span>

          <select
            value={windowSize}
            onChange={(e) => setWindowSize(e.target.value)}
            className="p-1 border rounded"
          >
            <option value="1d">1 día</option>
            <option value="1w">1 semana</option>
            <option value="15d">15 días</option>
            <option value="1m">1 mes</option>
            <option value="3m">3 meses</option>
            <option value="6m">6 meses</option>
          </select>
        </div>

        {/* BASE */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Base</span>
          <input
            type="date"
            value={baseDate}
            onChange={(e) => setBaseDate(e.target.value)}
            className="p-1 border rounded"
          />
        </div>

        {/* PERIOD */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Period</span>
          <input
            type="date"
            value={periodDate}
            onChange={(e) => setPeriodDate(e.target.value)}
            className="p-1 border rounded"
          />
        </div>

        {/* MODE TOGGLE */}
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setMode("single")}
            className={`px-2 py-1 rounded ${mode === "single" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Curve
          </button>

          <button
            onClick={() => setMode("compare")}
            className={`px-2 py-1 rounded ${mode === "compare" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Compare
          </button>
        </div>

      </div>
    </div>

    {/* ✅ CONTENIDO */}
    <div className="p-6 space-y-4">

      {/* KPIs SOLO EN COMPARACIÓN */}
      {mode === "compare" && (
        <div className="grid grid-cols-3 gap-4">

          <div className="bg-white p-4 rounded shadow">
            <div className="text-xs text-gray-500">Base</div>
            <div className="text-xl font-bold">{total1.toFixed(0)} kWh</div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <div className="text-xs text-gray-500">Periodo</div>
            <div className="text-xl font-bold">{total2.toFixed(0)} kWh</div>
          </div>

          <div className={`p-4 rounded shadow ${diffKwh > 0 ? "bg-red-100" : "bg-green-100"}`}>
            <div className="text-xs text-gray-500">Δ</div>
            <div className="text-xl font-bold">{diffKwh.toFixed(0)} kWh</div>
            <div>{diffPercent.toFixed(1)} %</div>
          </div>

        </div>
      )}

      {/* GRÁFICOS */}
      {mode === "single" && <Chart data={data} />}

      {mode === "compare" && (
        <CompareChart data1={data1Agg} data2={data2Agg} />
      )}

    </div>

  </main>
);

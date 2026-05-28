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

  // ✅ HOTELS AUTOLOAD
  useEffect(() => {
    fetch("/api/hotels")
      .then((res) => res.json())
      .then((data) => {
        setHotels(data);
        if (data.length > 0) {
          setSelectedHotel(data[0].file);
        }
      });
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
      });
  }, [selectedHotel]);

  // ✅ WINDOW
  function getWindowRange(start: string, windowSize: string) {
    const d = new Date(start);
    const end = new Date(d);

    if (windowSize === "1m") end.setMonth(d.getMonth() + 1);

    return { start: d, end };
  }

  const baseRange = baseDate ? getWindowRange(baseDate, windowSize) : null;
  const periodRange = periodDate ? getWindowRange(periodDate, windowSize) : null;

  const data1 = baseRange
    ? data.filter((d) => {
        const t = new Date(d.datetime);
        return t >= baseRange.start && t <= baseRange.end;
      })
    : [];

  const data2 = periodRange
    ? data.filter((d) => {
        const t = new Date(d.datetime);
        return t >= periodRange.start && t <= periodRange.end;
      })
    : [];

  // ✅ FREQUENCY
  function aggregateData(data: any[], freq: string) {
    const groups: any = {};

    data.forEach((d) => {
      const date = new Date(d.datetime);
      let key;

      if (freq === "d") {
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      } else {
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
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

  // ✅ KPI REAL
  const total1 = data1.reduce((acc, d) => acc + d.value, 0);
  const total2 = data2.reduce((acc, d) => acc + d.value, 0);

  const diffKwh = total2 - total1;
  const diffPercent = total1 !== 0 ? (diffKwh / total1) * 100 : 0;

  return (
    <main className={`${dark ? "bg-[#0f172a] text-white" : "bg-gray-100"} min-h-screen`}>

      {/* ✅ HEADER */}
      <header className={`${dark ? "bg-[#1e293b]" : "bg-white"} border-b`}>
        <div className="flex items-center px-6 py-3 gap-4">

          {/* ✅ LOGO REAL */}
          <img src="/logo.png" alt="logo" className="h-8" />

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

      {/* ✅ CONTROLES */}
      <div className="bg-white border-b px-6 py-3 flex gap-4 items-center flex-wrap">

        {/* HOTEL */}
        <select
          value={selectedHotel}
          onChange={(e) => setSelectedHotel(e.target.value)}
          className="p-1 border rounded"
        >
          {hotels.map((h) => (
            <option key={h.file} value={h.file}>{h.name}</option>
          ))}
        </select>

        {/* FREQUENCY */}
        <div className="flex gap-1">
          {["h", "d"].map((f) => (
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

        {/* FECHAS */}
        <input type="date" value={baseDate} onChange={(e) => setBaseDate(e.target.value)} className="border p-1"/>
        <input type="date" value={periodDate} onChange={(e) => setPeriodDate(e.target.value)} className="border p-1"/>

        {/* ✅ MODO */}
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setMode("single")}
            className={`px-3 py-1 rounded ${
              mode === "single" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            Curve
          </button>

          <button
            onClick={() => setMode("compare")}
            className={`px-3 py-1 rounded ${
              mode === "compare" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            Compare
          </button>
        </div>

      </div>

      {/* ✅ CONTENIDO */}
      <div className="p-6">

        {data.length === 0 && (
          <div className="text-gray-400 text-center">
            Cargando datos...
          </div>
        )}

        {mode === "single" && data.length > 0 && (
          <Chart data={data} />
        )}

        {mode === "compare" && data.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-3 rounded shadow">
                Base: {total1.toFixed(0)} kWh
              </div>
              <div className="bg-white p-3 rounded shadow">
                Periodo: {total2.toFixed(0)} kWh
              </div>
              <div className="p-3 rounded shadow bg-green-100">
                {diffKwh.toFixed(0)} kWh ({diffPercent.toFixed(1)}%)
              </div>
            </div>

            <CompareChart data1={data1Agg} data2={data2Agg} />
          </>
        )}

      </div>

    </main>
  );
}

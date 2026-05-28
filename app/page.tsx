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

  // =========================
  // LOAD HOTELS
  // =========================
  useEffect(() => {
    fetch("/api/hotels")
      .then((res) => res.json())
      .then((data) => {
        setHotels(data);
        if (data.length > 0) setSelectedHotel(data[0].file);
      });
  }, []);

  // =========================
  // LOAD EXCEL
  // =========================
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
            new Date(a.datetime).getTime() -
            new Date(b.datetime).getTime()
        );

        setData(formatted);
      });
  }, [selectedHotel]);

  // =========================
  // AGGREGATION
  // =========================
  function aggregateData(data: any[], freq: string) {
    const groups: any = {};

    data.forEach((d) => {
      const date = new Date(d.datetime);
      let key;

      if (freq === "30m") {
        const m = date.getMinutes() < 30 ? "00" : "30";
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}:${m}`;
      }

      if (freq === "h") {
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
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
      datetime: group[0].datetime,
      value:
        group.reduce((a: number, b: any) => a + b.value, 0) /
        group.length,
    }));
  }

  // =========================
  // CURVE (FILTRO POR RANGO)
  // =========================
  const dataCurve =
    baseDate && periodDate
      ? data.filter((d) => {
          const t = new Date(d.datetime);
          return (
            t >= new Date(baseDate) &&
            t <= new Date(periodDate + "T23:59:59")
          );
        })
      : data;

  const dataAgg = aggregateData(dataCurve, frequency);
  // ✅ CONSUMO TOTAL EN CURVE
const totalCurve = dataCurve.reduce(
  (acc, d) => acc + d.value,
  0
);

  // =========================
  // COMPARE
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

  const data1Agg = aggregateData(data1, frequency);
  const data2Agg = aggregateData(data2, frequency);

  // =========================
  // KPIs
  // =========================
  const total1 = data1.reduce((acc, d) => acc + d.value, 0);
  const total2 = data2.reduce((acc, d) => acc + d.value, 0);

  const diffKwh = total2 - total1;
  const diffPercent = total1 !== 0 ? (diffKwh / total1) * 100 : 0;

  // =========================
  // UI
  // =========================
  return (
    <main className={`${dark ? "bg-[#0f172a] text-white" : "bg-gray-100"} min-h-screen`}>

      {/* HEADER */}
      <header className={`${dark ? "bg-[#1e293b]" : "bg-white"} border-b`}>
        <div className="flex items-center px-6 py-3 gap-4">
          <img src="/logo.png" width={40} />
          <div>
            <h1 className="text-lg font-semibold">Ona Hotels Energy</h1>
            <p className="text-xs text-gray-400">Energy analytics tool</p>
          </div>

          <button
            onClick={() => setDark(!dark)}
            className="ml-auto px-3 py-1 bg-gray-200 text-black rounded"
          >
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      {/* CONTROLES */}
      <div className={`${dark ? "bg-[#1e293b]" : "bg-white"} border-b`}>
        <div className="flex flex-wrap gap-4 px-6 py-3 items-center text-sm">

          <select
            value={selectedHotel}
            onChange={(e) => setSelectedHotel(e.target.value)}
            className="p-1 border rounded text-black"
          >
            {hotels.map((h) => (
              <option key={h.file} value={h.file}>{h.name}</option>
            ))}
          </select>

          <div className="flex gap-1">
            {["30m", "h", "d", "w", "m"].map((f) => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                className={`px-2 py-1 rounded ${
                  frequency === f ? "bg-green-500 text-white" : "bg-gray-200 text-black"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* ✅ FECHAS EN CURVE */}
          {mode === "single" && (
            <>
              <input
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
                className="p-1 border rounded text-black"
              />
              <input
                type="date"
                value={periodDate}
                onChange={(e) => setPeriodDate(e.target.value)}
                className="p-1 border rounded text-black"
              />
            </>
          )}

          {/* ✅ COMPARE */}
          {mode === "compare" && (
            <>
              <select
                value={windowSize}
                onChange={(e) => setWindowSize(e.target.value)}
                className="p-1 border rounded text-black"
              >
                <option value="1d">1 día</option>
                <option value="1w">1 semana</option>
                <option value="15d">15 días</option>
                <option value="1m">1 mes</option>
                <option value="3m">3 meses</option>
                <option value="6m">6 meses</option>
              </select>

              <input type="date" value={baseDate} onChange={(e) => setBaseDate(e.target.value)} className="p-1 border rounded text-black"/>
              <input type="date" value={periodDate} onChange={(e) => setPeriodDate(e.target.value)} className="p-1 border rounded text-black"/>
            </>
          )}

          <div className="ml-auto flex gap-1">
            <button onClick={() => setMode("single")} className={`px-3 py-1 rounded ${mode === "single" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}>Curve</button>
            <button onClick={() => setMode("compare")} className={`px-3 py-1 rounded ${mode === "compare" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}>Compare</button>
          </div>

        </div>
      </div>

      {/* CONTENT */}
      <div className="p-6">

       {mode === "single" && (
  <>
    {/* ✅ KPI CURVE */}
    <div className="grid grid-cols-1 mb-4">
      <div className={`p-4 rounded ${
        dark ? "bg-[#1e293b]" : "bg-white"
      }`}>
        <div className="text-xs text-gray-500">
          Consumo periodo
        </div>
        <div className="text-xl font-bold">
          {totalCurve.toFixed(0)} kWh
        </div>
      </div>
    </div>

    <Chart data={dataAgg} />
  </>
)}












        

        {mode === "compare" && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-3 rounded">Base: {total1.toFixed(0)} kWh</div>
              <div className="bg-white p-3 rounded">Periodo: {total2.toFixed(0)} kWh</div>
              <div className="bg-green-100 p-3 rounded">{diffKwh.toFixed(0)} kWh ({diffPercent.toFixed(1)}%)</div>
            </div>

            <CompareChart data1={data1Agg} data2={data2Agg} />
          </>
        )}

      </div>

    </main>
  );
}
``

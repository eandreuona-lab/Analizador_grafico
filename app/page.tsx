"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Upload from "@/components/Upload";
import Chart from "@/components/Chart";
import CompareChart from "@/components/CompareChart";
import * as XLSX from "xlsx";

export default function Home() {
  const [data, setData] = useState([]);

  const [selectedHotel, setSelectedHotel] = useState("");

  const [frequency, setFrequency] = useState("h");

  const [windowSize, setWindowSize] = useState("1m");
  const [baseDate, setBaseDate] = useState("");
  const [periodDate, setPeriodDate] = useState("");

  const [mode, setMode] = useState("compare");

  // ✅ HOTELS
  const hotels = [
    { name: "PALAMOS", file: "/data/PALAMOS.xlsx" },
    { name: "OFICINAS CALABRIA", file: "/data/OFICINAS_CALABRIA.xlsx" },
  ];

  // ✅ CARGA EXCEL
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

  // ✅ WINDOW RANGE
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

  // ✅ AGREGACIÓN (FREQUENCY)
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

    return Object.values(groups).map((group: any) => {
      const avg =
        group.reduce((a: number, b: any) => a + b.value, 0) / group.length;

      return {
        datetime: group[0].datetime,
        value: avg,
      };
    });
  }

  const data1Agg = aggregateData(data1, frequency);
  const data2Agg = aggregateData(data2, frequency);

  return (
    <main className="p-4 space-y-4">

      {/* SELECTORES SUPERIORES */}
      <div className="flex gap-4 flex-wrap">

        {/* HOTEL */}
        <select
          value={selectedHotel}
          onChange={(e) => setSelectedHotel(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">Selecciona hotel</option>
          {hotels.map((h) => (
            <option key={h.file} value={h.file}>
              {h.name}
            </option>
          ))}
        </select>

        {/* FREQUENCY */}
        <div className="flex gap-1">
          {["30m", "h", "d", "w", "m"].map((f) => (
            <button
              key={f}
              onClick={() => setFrequency(f)}
              className={`px-2 py-1 rounded ${
                frequency === f
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* WINDOW */}
        <select
          value={windowSize}
          onChange={(e) => setWindowSize(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="1d">1 día</option>
          <option value="1w">1 semana</option>
          <option value="15d">15 días</option>
          <option value="1m">1 mes</option>
          <option value="3m">3 meses</option>
          <option value="6m">6 meses</option>
        </select>

        {/* BASE */}
        <input
          type="date"
          value={baseDate}
          onChange={(e) => setBaseDate(e.target.value)}
          className="p-2 border rounded"
        />

        {/* PERIOD 1 */}
        <input
          type="date"
          value={periodDate}
          onChange={(e) => setPeriodDate(e.target.value)}
          className="p-2 border rounded"
        />

      </div>

      {/* GRÁFICO */}
      <CompareChart data1={data1Agg} data2={data2Agg} />

    </main>
  );
}

"use client";

import { useState } from "react";
import Upload from "@/components/Upload";
import Chart from "@/components/Chart";
import CompareChart from "@/components/CompareChart";

export default function Home() {
  const [data, setData] = useState([]);

  const [mode, setMode] = useState("single");
  const [dark, setDark] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const hotels = [
  { name: "Barcelona", file: "/data/hotel_barcelona.xlsx" },
  { name: "Madrid", file: "/data/hotel_madrid.xlsx" },
  { name: "Valencia", file: "/data/hotel_valencia.xlsx" },];

  const [selectedHotel, setSelectedHotel] = useState("");
  const [startDate1, setStartDate1] = useState("");
  const [endDate1, setEndDate1] = useState("");
  const [startDate2, setStartDate2] = useState("");
  const [endDate2, setEndDate2] = useState("");

  const filteredData = data.filter((d: any) => {
    const t = new Date(d.datetime).getTime();
    if (startDate && t < new Date(startDate).getTime()) return false;
    if (endDate && t > new Date(endDate).getTime()) return false;
    return true;
  });

  const data1 = data.filter((d: any) => {
    const t = new Date(d.datetime).getTime();
    if (startDate1 && t < new Date(startDate1).getTime()) return false;
    if (endDate1 && t > new Date(endDate1).getTime()) return false;
    return true;
  });

  const data2 = data.filter((d: any) => {
    const t = new Date(d.datetime).getTime();
    if (startDate2 && t < new Date(startDate2).getTime()) return false;
    if (endDate2 && t > new Date(endDate2).getTime()) return false;
    return true;
  });

  return (
    <main className={`min-h-screen font-sans ${dark ? "bg-[#0f172a] text-white" : "bg-[#f4f6f8]"}`}>

      {/* HEADER */}
      <header className={`${dark ? "bg-[#1e293b]" : "bg-white"} border-b`}>
        <div className="w-full px-4 py-2 flex items-center gap-4">

          <img src="/logo.png" alt="Ona Hotels" className="h-8 object-contain"/>

          <div>
            <h1 className={`text-lg font-semibold ${dark ? "text-white" : "text-gray-800"}`}>
              Ona Hotels Energy
            </h1>
            <p className={`text-xs ${dark ? "text-gray-300" : "text-gray-400"}`}>
              Analizador de curvas de consumo eléctrico
            </p>
          </div>

          <button
            onClick={() => setDark(!dark)}
            className={`ml-auto px-3 py-1 text-sm rounded ${
              dark
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {dark ? "Modo claro" : "Modo dark"}
          </button>

        </div>
      </header>

      {/* CONTENIDO */}
      <div className="w-full px-4 py-3 space-y-3">

        {/* MODO */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode("single")}
            className={`px-3 py-1 rounded text-sm ${
              mode === "single"
                ? "bg-[#00a6a8] text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Curva
          </button>

          <button
            onClick={() => setMode("compare")}
            className={`px-3 py-1 rounded text-sm ${
              mode === "compare"
                ? "bg-[#00a6a8] text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Comparación
          </button>
        </div>


{/* SELECTOR DE HOTEL */}
<div className="flex items-center gap-2">

  <label className="text-sm">
    Hotel:
  </label>

  <select
    value={selectedHotel}
    onChange={(e) => setSelectedHotel(e.target.value)}
    className={`p-2 border rounded ${
      dark ? "bg-[#0f172a] text-white border-gray-600" : ""
    }`}
  >
    <option value="">Selecciona hotel</option>

    {hotels.map((h) => (
      <option key={h.file} value={h.file}>
        {h.name}
      </option>
    ))}

  </select>

</div>



        
        {/* UPLOAD + RESET */}
        <div className={`${dark ? "bg-[#1e293b] border-gray-700" : "bg-white"} p-2 rounded border flex items-center`}>

          <Upload setData={setData} />

          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setStartDate1("");
              setEndDate1("");
              setStartDate2("");
              setEndDate2("");
            }}
            className={`ml-auto px-3 py-1 text-sm rounded ${
              dark
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Reset
          </button>

        </div>

        {/* CURVA */}
        {mode === "single" && (
          <>
            <div className="flex gap-2 text-sm">

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`p-1 border rounded ${
                  dark ? "bg-[#0f172a] border-gray-600 text-white [color-scheme:light]" : ""
                }`}
              />

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`p-1 border rounded ${
                  dark ? "bg-[#0f172a] border-gray-600 text-white [color-scheme:light]" : ""
                }`}
              />

            </div>

            {/* ✅ GRÁFICO FULL */}
            <div className="w-full">
              {filteredData.length > 0 && (
                <Chart data={filteredData} />
              )}
            </div>
          </>
        )}

        {/* COMPARACIÓN */}
        {mode === "compare" && (
          <>
            <div className="grid md:grid-cols-2 gap-3 text-sm">

              <div className={`${dark ? "bg-[#1e293b] border-gray-700" : "bg-white"} p-2 rounded border`}>
                <h3 className="mb-1">Periodo 1</h3>

                <input
                  type="date"
                  value={startDate1}
                  onChange={(e) => setStartDate1(e.target.value)}
                  className={`p-1 border rounded w-full ${
                    dark ? "bg-[#0f172a] text-white border-gray-600 [color-scheme:light]" : ""
                  }`}
                />

                <input
                  type="date"
                  value={endDate1}
                  onChange={(e) => setEndDate1(e.target.value)}
                  className={`p-1 border rounded w-full mt-1 ${
                    dark ? "bg-[#0f172a] text-white border-gray-600 [color-scheme:light]" : ""
                  }`}
                />
              </div>

              <div className={`${dark ? "bg-[#1e293b] border-gray-700" : "bg-white"} p-2 rounded border`}>
                <h3 className="mb-1">Periodo 2</h3>

                <input
                  type="date"
                  value={startDate2}
                  onChange={(e) => setStartDate2(e.target.value)}
                  className={`p-1 border rounded w-full ${
                    dark ? "bg-[#0f172a] text-white border-gray-600 [color-scheme:light]" : ""
                  }`}
                />

                <input
                  type="date"
                  value={endDate2}
                  onChange={(e) => setEndDate2(e.target.value)}
                  className={`p-1 border rounded w-full mt-1 ${
                    dark ? "bg-[#0f172a] text-white border-gray-600 [color-scheme:light]" : ""
                  }`}
                />
              </div>

            </div>

            {/* ✅ GRÁFICO FULL */}
            <div className="w-full">
              {(data1.length > 0 || data2.length > 0) && (
                <CompareChart data1={data1} data2={data2} />
              )}
            </div>
          </>
        )}

      </div>
    </main>
  );
}

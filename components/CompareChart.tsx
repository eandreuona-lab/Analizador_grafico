"use client";

import ReactECharts from "echarts-for-react";

// ✅ NORMALIZAR FECHAS (SUPERPONER PERIODOS)
function normalizeDate(dateStr: string) {
  const d = new Date(dateStr);

  return new Date(
    2000, // mismo año para todos → clave
    d.getMonth(),
    d.getDate(),
    d.getHours(),
    d.getMinutes()
  );
}

export default function CompareChart({ data1, data2 }: any) {
  const option = {
    tooltip: {
      trigger: "axis",
    },

    legend: {
      data: ["Periodo 1", "Periodo 2"],
    },

    xAxis: {
      type: "time",
      name: "Fecha",
    },

    yAxis: {
      type: "value",
      name: "kWh",
    },

    // ✅ ZOOM COMO EN CURVA
    dataZoom: [
      { type: "inside" },
      { type: "slider" },
    ],

    series: [
      {
        name: "Periodo 1",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: data1.map((d: any) => [
          normalizeDate(d.datetime),
          d.value,
        ]),
      },
      {
        name: "Periodo 2",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: data2.map((d: any) => [
          normalizeDate(d.datetime),
          d.value,
        ]),
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "85vh", width: "100%" }}
    />
  );
}

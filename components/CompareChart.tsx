"use client";

import ReactECharts from "echarts-for-react";

export default function CompareChart({ data1, data2 }: any) {
  const option = {
    tooltip: { trigger: "axis" },

    legend: { data: ["Periodo 1", "Periodo 2"] },

    xAxis: {
      type: "time",   // ✅ CLAVE
      name: "Fecha",
    },

    yAxis: {
      type: "value",
      name: "kWh",
    },

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
        data: data1.map((d: any) => [d.datetime, d.value]),
      },
      {
        name: "Periodo 2",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: data2.map((d: any) => [d.datetime, d.value]),
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
``

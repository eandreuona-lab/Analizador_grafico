"use client";

import ReactECharts from "echarts-for-react";

export default function Chart({ data = [] }: any) {
  const option = {
grid: {
  top: 40,
  bottom: 40,
  left: 60,
  right: 20,
},




    tooltip: { trigger: "axis" },
    xAxis: { type: "time", name: "Fecha" },
    yAxis: { type: "value", name: "kWh" },
    dataZoom: [{ type: "inside" }, { type: "slider" }],
    series: [
      {
        type: "line",
        smooth: true,
        showSymbol: false,
        data: data.map((d: any) => [d.datetime, d.value]),
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
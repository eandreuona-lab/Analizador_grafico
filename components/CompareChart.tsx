"use client";

import ReactECharts from "echarts-for-react";

function aggregateByHour(data: any[]) {
  const hours: any = {};

  data.forEach((d: any) => {
    const h = new Date(d.datetime).getHours();
    if (!hours[h]) hours[h] = [];
    hours[h].push(d.value);
  });

  return Object.keys(hours).map((h) => {
    const vals = hours[h];
    const avg = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
    return [Number(h), avg];
  });
}

export default function CompareChart({ data1, data2 }: any) {
  const option = {
    tooltip: { trigger: "axis" },
    legend: { data: ["Periodo 1", "Periodo 2"] },

    grid: {
      top: 40,
      bottom: 40,
      left: 60,
      right: 20,
    },

    xAxis: { type: "value", name: "Hora" },
    yAxis: { type: "value", name: "kWh" },

    series: [
      {
        name: "Periodo 1",
        type: "line",
        smooth: true,
        data: aggregateByHour(data1),
      },
      {
        name: "Periodo 2",
        type: "line",
        smooth: true,
        data: aggregateByHour(data2),
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

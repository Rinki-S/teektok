"use client";

import { useEffect, useMemo, useRef } from "react";

import { cn } from "@/lib/utils";

type EChartsModule = typeof import("echarts");

type ECOption = import("echarts").EChartsOption;
type EChartsInstance = import("echarts").ECharts;

export function EChart({
  option,
  height,
  className,
  theme = "dark",
  loading,
}: {
  option: ECOption;
  height: number;
  className?: string;
  theme?: "dark" | "light";
  loading?: boolean;
}) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<EChartsInstance | null>(null);
  const optionMemo = useMemo(() => option, [option]);

  useEffect(() => {
    let disposed = false;
    let ro: ResizeObserver | null = null;
    let echarts: EChartsModule | null = null;

    async function init() {
      if (!elRef.current) return;

      echarts = await import("echarts");
      if (disposed || !elRef.current) return;

      chartRef.current?.dispose();
      chartRef.current = echarts.init(elRef.current, theme, {
        renderer: "canvas",
      });

      chartRef.current.setOption(optionMemo, { notMerge: true });

      ro = new ResizeObserver(() => {
        chartRef.current?.resize();
      });
      ro.observe(elRef.current);
    }

    void init();

    return () => {
      disposed = true;
      ro?.disconnect();
      ro = null;
      chartRef.current?.dispose();
      chartRef.current = null;
      echarts = null;
    };
  }, [optionMemo, theme]);

  useEffect(() => {
    if (!chartRef.current) return;
    if (loading) chartRef.current.showLoading("default");
    else chartRef.current.hideLoading();
  }, [loading]);

  return (
    <div
      ref={elRef}
      className={cn("w-full", className)}
      style={{ height }}
    />
  );
}


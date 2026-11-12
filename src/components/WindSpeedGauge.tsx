/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Wind, Navigation2, Compass, ArrowUpRight, Gauge, Info } from "lucide-react";
import { getCompassDirection, getBeaufortScale, convertWindSpeed } from "../utils/weatherUtils";

interface WindSpeedGaugeProps {
  darkMode: boolean;
  windSpeedKmh: number;
  windDirectionDeg: number;
  maxWindGustKmh?: number;
  compact?: boolean;
}

export default function WindSpeedGauge({
  darkMode,
  windSpeedKmh,
  windDirectionDeg,
  maxWindGustKmh,
  compact = false,
}: WindSpeedGaugeProps) {
  const [selectedUnit, setSelectedUnit] = useState<"kmh" | "mph" | "knots" | "ms">("kmh");
  const [showInfo, setShowInfo] = useState(false);

  // Speed max threshold for gauge scale (e.g. 100 km/h)
  const maxGaugeScaleKmh = 100;
  const clampedSpeed = Math.min(Math.max(windSpeedKmh, 0), maxGaugeScaleKmh);
  const percentage = (clampedSpeed / maxGaugeScaleKmh) * 100;

  const beaufort = getBeaufortScale(windSpeedKmh);
  const compassDir = getCompassDirection(windDirectionDeg);
  const converted = convertWindSpeed(windSpeedKmh, selectedUnit);
  const convertedGust = maxWindGustKmh ? convertWindSpeed(maxWindGustKmh, selectedUnit) : null;

  // Recharts Pie Chart configuration for a 270-degree speedometer arch (from 225° to -45°)
  const startAngle = 225;
  const totalSweep = 270;
  const currentSweep = (percentage / 100) * totalSweep;
  const endAngle = startAngle - currentSweep;

  // Chart data for active speed arc vs remaining track
  const activeValue = clampedSpeed;
  const remainingValue = Math.max(0, maxGaugeScaleKmh - clampedSpeed);

  const gaugeData = [
    { name: "Current Wind Speed", value: activeValue, color: beaufort.color },
    { name: "Headroom", value: remainingValue, color: darkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)" },
  ];

  // Tick marks for gauge (0, 20, 40, 60, 80, 100)
  const ticks = [0, 20, 40, 60, 80, 100];

  if (compact) {
    return (
      <div className="flex items-center gap-3 w-full">
        {/* Compact circular Recharts dial */}
        <div className="relative w-20 h-20 shrink-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={70} minHeight={70} debounce={30}>
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={gaugeData}
                dataKey="value"
                cx="50%"
                cy="50%"
                startAngle={startAngle}
                endAngle={-45}
                innerRadius="70%"
                outerRadius="90%"
                stroke="none"
                isAnimationActive={true}
              >
                <Cell key="cell-speed" fill={beaufort.color} />
                <Cell key="cell-remain" fill={darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Central Compass Heading Arrow */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div
              className="transition-transform duration-700 ease-out"
              style={{ transform: `rotate(${windDirectionDeg}deg)` }}
            >
              <Navigation2
                size={14}
                className="fill-current"
                style={{ color: beaufort.color }}
              />
            </div>
            <span className="text-[9px] font-mono font-bold mt-0.5 leading-none">
              {compassDir}
            </span>
          </div>
        </div>

        {/* Compact Details */}
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase font-mono tracking-wider text-gray-400 flex items-center justify-between">
            <span>WIND & VECTOR</span>
            <span className="text-[9px]" style={{ color: beaufort.color }}>{beaufort.label}</span>
          </div>
          <div className="text-base font-extrabold font-mono flex items-baseline gap-1 mt-0.5">
            <span>{converted.value}</span>
            <span className="text-[11px] font-sans font-medium text-gray-400">{converted.unitLabel}</span>
          </div>
          <div className="text-[10px] text-gray-400 truncate flex items-center gap-1.5 mt-0.5 font-mono">
            <span>Bearing {windDirectionDeg}° ({compassDir})</span>
            {convertedGust && <span>• Gusts {convertedGust.value} {convertedGust.unitLabel}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-5 rounded-2xl shadow-fluent border transition-all relative overflow-hidden ${
        darkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/15 text-[#202020]"
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#0078d4]/10 text-[#0078d4]">
            <Wind size={16} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#0078d4] font-semibold block">
              Anemometer & Aerodynamics
            </span>
            <h3 className="text-xs font-bold text-gray-200 dark:text-white">
              Circular Wind Speed & Direction Gauge
            </h3>
          </div>
        </div>

        {/* Unit Selector Toggle */}
        <div className="flex items-center gap-1 bg-black/20 p-0.5 rounded-lg border border-white/5 text-[10px] font-mono">
          {(["kmh", "mph", "knots", "ms"] as const).map((unit) => (
            <button
              key={unit}
              onClick={() => setSelectedUnit(unit)}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                selectedUnit === unit
                  ? "bg-[#0078d4] text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {unit === "kmh" ? "km/h" : unit === "mph" ? "mph" : unit === "knots" ? "kts" : "m/s"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Gauge Visual Center */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mt-3">
        {/* Recharts Circular Gauge (7 Cols) */}
        <div className="md:col-span-7 flex flex-col items-center justify-center relative min-h-[220px]">
          
          {/* Circular Recharts Container */}
          <div className="relative w-56 h-56">
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200} debounce={30}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                {/* Background scale track */}
                <Pie
                  data={[{ value: 100 }]}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  startAngle={225}
                  endAngle={-45}
                  innerRadius="76%"
                  outerRadius="90%"
                  stroke="none"
                  fill={darkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"}
                  isAnimationActive={false}
                />

                {/* Active Dynamic Meter Arc */}
                <Pie
                  data={gaugeData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  startAngle={225}
                  endAngle={-45}
                  innerRadius="76%"
                  outerRadius="90%"
                  stroke="none"
                  paddingAngle={0}
                  isAnimationActive={true}
                >
                  <Cell key="active-speed-cell" fill={beaufort.color} />
                  <Cell key="remaining-track-cell" fill="transparent" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Compass Cardinal Points around perimeter */}
            <div className="absolute inset-0 pointer-events-none text-[9.5px] font-bold font-mono text-gray-500 flex flex-col justify-between items-center py-1">
              <span>N</span>
              <div className="w-full flex justify-between px-1">
                <span>W</span>
                <span>E</span>
              </div>
              <span>S</span>
            </div>

            {/* Gauge Dial Centerpiece: Speed Readout + Vector Needle */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-2">
              {/* Compass Needle */}
              <div
                className="transition-transform duration-700 ease-out mb-1 p-2 rounded-full bg-black/20 backdrop-blur-sm border border-white/10"
                style={{ transform: `rotate(${windDirectionDeg}deg)` }}
                title={`Wind bearing: ${windDirectionDeg}° (${compassDir})`}
              >
                <Navigation2
                  size={20}
                  className="fill-current"
                  style={{ color: beaufort.color }}
                />
              </div>

              {/* Numeric Speed Display */}
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold font-mono tracking-tight" style={{ color: beaufort.color }}>
                  {converted.value}
                </span>
                <span className="text-xs font-semibold text-gray-400">{converted.unitLabel}</span>
              </div>

              {/* Beaufort classification pill */}
              <span
                className="text-[9.5px] font-mono font-bold uppercase px-2 py-0.5 rounded-full mt-1 border"
                style={{
                  backgroundColor: `${beaufort.color}15`,
                  borderColor: `${beaufort.color}40`,
                  color: beaufort.color,
                }}
              >
                {beaufort.label}
              </span>
            </div>
          </div>

          {/* Scale Labels below gauge */}
          <div className="w-full max-w-[220px] flex justify-between text-[9px] font-mono text-gray-500 px-3 -mt-2">
            <span>0 {converted.unitLabel}</span>
            <span>50 {converted.unitLabel}</span>
            <span>100+ {converted.unitLabel}</span>
          </div>
        </div>

        {/* Right Info Telemetry Panel (5 Cols) */}
        <div className="md:col-span-5 space-y-3">
          
          {/* Beaufort Scale Details */}
          <div className={`p-3 rounded-xl border ${darkMode ? "bg-black/20 border-white/5" : "bg-white/60 border-black/5"}`}>
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-1">
              <span>BEAUFORT FORCE:</span>
              <span className="font-bold font-mono text-white">Scale {beaufort.scale} / 12</span>
            </div>
            <p className="text-[11px] leading-relaxed text-gray-300 dark:text-gray-200">
              {beaufort.description}
            </p>
          </div>

          {/* Wind Vector Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className={`p-2.5 rounded-lg border ${darkMode ? "bg-black/20 border-white/5" : "bg-white/60 border-black/5"}`}>
              <span className="text-[9px] text-gray-400 block">DIRECTION / ANGLE</span>
              <span className="text-sm font-bold text-white flex items-center gap-1 mt-0.5">
                <Compass size={13} className="text-cyan-400" />
                {compassDir} ({windDirectionDeg}°)
              </span>
            </div>

            <div className={`p-2.5 rounded-lg border ${darkMode ? "bg-black/20 border-white/5" : "bg-white/60 border-black/5"}`}>
              <span className="text-[9px] text-gray-400 block">ESTIMATED GUSTS</span>
              <span className="text-sm font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                <ArrowUpRight size={13} />
                {convertedGust ? `${convertedGust.value} ${convertedGust.unitLabel}` : `${Math.round(converted.value * 1.35)} ${converted.unitLabel}`}
              </span>
            </div>
          </div>

          {/* Environmental Impact Notice */}
          <div className={`p-2.5 rounded-lg border flex items-center gap-2 text-[11px] ${
            beaufort.scale >= 6
              ? "bg-amber-950/20 border-amber-500/30 text-amber-300"
              : darkMode
              ? "bg-slate-500/10 border-white/5 text-gray-300"
              : "bg-slate-100 border-slate-200 text-gray-700"
          }`}>
            <Info size={14} className="shrink-0 text-[#0078d4]" />
            <span className="leading-tight text-[10.5px]">
              {beaufort.scale >= 7
                ? "Gale conditions: High-profile vehicles and coastal waters impacted."
                : beaufort.scale >= 4
                ? "Moderate breeze: Dust and small papers raised, small branches move."
                : "Atmospheric motion is calm and nominal for outdoor activities."}
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}

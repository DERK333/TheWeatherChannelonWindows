/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  Snowflake,
  CloudLightning,
  HelpCircle,
} from "lucide-react";

export interface WeatherCondition {
  label: string;
  icon: string; // Used for dynamic lookup
  colorClass: string;
  gradientFrom: string;
  gradientTo: string;
  tileBg: string;
}

export function getWeatherCondition(code: number): WeatherCondition {
  // WMO Weather interpretation codes
  switch (code) {
    case 0:
      return {
        label: "Clear Sky",
        icon: "sun",
        colorClass: "text-amber-500",
        gradientFrom: "from-amber-400",
        gradientTo: "to-orange-500",
        tileBg: "bg-amber-600",
      };
    case 1:
    case 2:
    case 3:
      return {
        label: "Partly Cloudy",
        icon: "cloud-sun",
        colorClass: "text-sky-400",
        gradientFrom: "from-sky-450",
        gradientTo: "to-gray-400",
        tileBg: "bg-slate-600",
      };
    case 45:
    case 48:
      return {
        label: "Foggy Conditions",
        icon: "cloud-fog",
        colorClass: "text-teal-400",
        gradientFrom: "from-slate-400",
        gradientTo: "to-teal-600",
        tileBg: "bg-teal-700",
      };
    case 51:
    case 53:
    case 55:
      return {
        label: "Light Drizzle",
        icon: "cloud-drizzle",
        colorClass: "text-sky-300",
        gradientFrom: "from-blue-400",
        gradientTo: "to-slate-500",
        tileBg: "bg-blue-700",
      };
    case 61:
    case 63:
    case 65:
      return {
        label: "Heavy Rain",
        icon: "cloud-rain",
        colorClass: "text-blue-500",
        gradientFrom: "from-blue-650",
        gradientTo: "to-slate-750",
        tileBg: "bg-blue-900",
      };
    case 71:
    case 73:
    case 75:
      return {
        label: "Snowfall",
        icon: "snowflake",
        colorClass: "text-indigo-200",
        gradientFrom: "from-[#e3f2fd]",
        gradientTo: "to-indigo-300",
        tileBg: "bg-indigo-600",
      };
    case 80:
    case 81:
    case 82:
      return {
        label: "Passing Showers",
        icon: "cloud-drizzle",
        colorClass: "text-cyan-400",
        gradientFrom: "from-cyan-400",
        gradientTo: "to-blue-600",
        tileBg: "bg-cyan-850",
      };
    case 95:
    case 96:
    case 99:
      return {
        label: "Thunderstorm warning",
        icon: "cloud-lightning",
        colorClass: "text-purple-500",
        gradientFrom: "from-purple-800",
        gradientTo: "to-[#ef5350]",
        tileBg: "bg-purple-900",
      };
    default:
      return {
        label: "Atmospheric Variance",
        icon: "help-circle",
        colorClass: "text-gray-400",
        gradientFrom: "from-slate-400",
        gradientTo: "to-gray-600",
        tileBg: "bg-slate-700",
      };
  }
}

// Format the date/time string to local readability
export function formatLocalTime(isoStr: string | undefined): string {
  if (!isoStr) return "--:--";
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return isoStr;
  }
}

export function formatLocalDateShort(isoStr: string | undefined): string {
  if (!isoStr) return "Tomorrow";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return "Forecast";
  }
}

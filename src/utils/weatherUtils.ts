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

export function convertTemperature(tempCelsius: number, unit: "celsius" | "fahrenheit"): number {
  if (unit === "fahrenheit") {
    return (tempCelsius * 9/5) + 32;
  }
  return tempCelsius;
}

export function formatTemperature(tempCelsius: number | undefined, unit: "celsius" | "fahrenheit", includeUnit: boolean = true): string {
  if (tempCelsius === undefined || isNaN(tempCelsius)) return "--";
  const converted = convertTemperature(tempCelsius, unit);
  const symbol = unit === "celsius" ? "°C" : "°F";
  return `${Math.round(converted)}${includeUnit ? symbol : "°"}`;
}

export function getCompassDirection(degrees: number): string {
  const directions = [
    "N", "NNE", "NE", "ENE",
    "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW",
    "W", "WNW", "NW", "NNW"
  ];
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}

export interface BeaufortInfo {
  scale: number;
  label: string;
  description: string;
  color: string;
  severity: "calm" | "moderate" | "strong" | "gale";
}

export function getBeaufortScale(speedKmh: number): BeaufortInfo {
  if (speedKmh < 1) {
    return {
      scale: 0,
      label: "Calm",
      description: "Smoke rises vertically. Sea like a mirror.",
      color: "#38bdf8",
      severity: "calm",
    };
  } else if (speedKmh <= 5) {
    return {
      scale: 1,
      label: "Light Air",
      description: "Smoke drift indicates wind direction; vanes do not move.",
      color: "#38bdf8",
      severity: "calm",
    };
  } else if (speedKmh <= 11) {
    return {
      scale: 2,
      label: "Light Breeze",
      description: "Wind felt on face; leaves rustle; ordinary vanes moved by wind.",
      color: "#60a5fa",
      severity: "calm",
    };
  } else if (speedKmh <= 19) {
    return {
      scale: 3,
      label: "Gentle Breeze",
      description: "Leaves and small twigs in constant motion; light flags extended.",
      color: "#0078d4",
      severity: "calm",
    };
  } else if (speedKmh <= 28) {
    return {
      scale: 4,
      label: "Moderate Breeze",
      description: "Raises dust and loose paper; small branches moved.",
      color: "#0284c7",
      severity: "moderate",
    };
  } else if (speedKmh <= 38) {
    return {
      scale: 5,
      label: "Fresh Breeze",
      description: "Small trees in leaf begin to sway; crested wavelets form on inland waters.",
      color: "#0d9488",
      severity: "moderate",
    };
  } else if (speedKmh <= 49) {
    return {
      scale: 6,
      label: "Strong Breeze",
      description: "Large branches in motion; whistling heard in telegraph wires; umbrellas used with difficulty.",
      color: "#eab308",
      severity: "strong",
    };
  } else if (speedKmh <= 61) {
    return {
      scale: 7,
      label: "Near Gale",
      description: "Whole trees in motion; inconvenience felt walking against wind.",
      color: "#f59e0b",
      severity: "strong",
    };
  } else if (speedKmh <= 74) {
    return {
      scale: 8,
      label: "Gale",
      description: "Twigs break off trees; generally impedes progress.",
      color: "#ea580c",
      severity: "gale",
    };
  } else if (speedKmh <= 88) {
    return {
      scale: 9,
      label: "Severe Gale",
      description: "Slight structural damage occurs (chimney pots and slates removed).",
      color: "#dc2626",
      severity: "gale",
    };
  } else if (speedKmh <= 102) {
    return {
      scale: 10,
      label: "Storm",
      description: "Seldom experienced inland; trees uprooted; considerable structural damage.",
      color: "#b91c1c",
      severity: "gale",
    };
  } else {
    return {
      scale: 12,
      label: "Violent Storm / Hurricane",
      description: "Devastating damage; widespread destruction.",
      color: "#991b1b",
      severity: "gale",
    };
  }
}

export function convertWindSpeed(
  speedKmh: number,
  unit: "kmh" | "mph" | "knots" | "ms"
): { value: number; unitLabel: string } {
  switch (unit) {
    case "mph":
      return { value: Math.round(speedKmh * 0.621371 * 10) / 10, unitLabel: "mph" };
    case "knots":
      return { value: Math.round(speedKmh * 0.539957 * 10) / 10, unitLabel: "kts" };
    case "ms":
      return { value: Math.round((speedKmh / 3.6) * 10) / 10, unitLabel: "m/s" };
    case "kmh":
    default:
      return { value: Math.round(speedKmh * 10) / 10, unitLabel: "km/h" };
  }
}

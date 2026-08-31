/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeatherData, GeocodedLocation, WeatherAlert, AlertSeverity } from "../types";

/**
 * Evaluates current atmospheric metrics and forecast trends to derive
 * active severe weather alerts, watches, and advisories for a location.
 */
export function deriveWeatherAlerts(
  weather: WeatherData,
  location: GeocodedLocation
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const current = weather.current;
  const hourly = weather.hourly;
  const now = new Date();
  const locationName = `${location.name}${location.admin1 ? `, ${location.admin1}` : ""}`;
  const effectiveIso = now.toISOString();

  // Helper to construct expiry timestamp
  const getExpiryIso = (hoursAhead: number) => {
    const d = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
    return d.toISOString();
  };

  // 1. Convective Thunderstorm / Lightning Hazards (WMO codes 95, 96, 99)
  if ([95, 96, 99].includes(current.weather_code)) {
    const isSevere = [96, 99].includes(current.weather_code);
    alerts.push({
      id: `alert-storm-${Date.now()}`,
      event: isSevere ? "Severe Thunderstorm Warning" : "Thunderstorm Advisory",
      severity: isSevere ? "severe" : "moderate",
      urgency: "Immediate",
      certainty: "Observed",
      category: "Met",
      headline: `${isSevere ? "Dangerous Convective Storm Cell" : "Active Thunderstorms"} Detected Over ${location.name}`,
      description: `Meteorological doppler radar observes strong convective activity near ${locationName}. Atmospheric instability is producing frequent cloud-to-ground lightning, rapid rain bursts, and localized squalls.`,
      instruction: "Seek substantial indoor shelter immediately. Stay away from windows, ungrounded electronic devices, and open metal structures. If driving, reduce speed and beware of pooling water.",
      effective: effectiveIso,
      expires: getExpiryIso(3),
      senderName: "National Meteorological Storm Prediction Center",
      affectedArea: locationName,
      source: "Doppler Radar Surveillance & Atmospheric Sounding",
      tags: ["Lightning", "Thunderstorm", "Squall", "Radar-Detected"],
      triggerMetric: `WMO Code ${current.weather_code} • Rain: ${current.precipitation}mm`,
    });
  }

  // 2. High Wind & Gale Hazards (Wind speed >= 38 km/h or forecast gusts)
  if (current.wind_speed_10m >= 38) {
    const isGale = current.wind_speed_10m >= 55;
    alerts.push({
      id: `alert-wind-${Date.now()}`,
      event: isGale ? "High Wind Warning" : "Wind Advisory",
      severity: isGale ? "severe" : "moderate",
      urgency: "Expected",
      certainty: "Observed",
      category: "Safety",
      headline: `Sustained High Winds of ${current.wind_speed_10m} km/h Affecting ${location.name}`,
      description: `Strong pressure gradient forces are creating sustained winds of ${current.wind_speed_10m} km/h with higher localized gusts across ${locationName}. Elevated structures and high-profile vehicles are at risk.`,
      instruction: "Secure loose outdoor patio items, trash receptacles, and temporary fixtures. Use extra caution when driving over bridges or in high-profile vehicles. Watch for falling tree limbs.",
      effective: effectiveIso,
      expires: getExpiryIso(6),
      senderName: "Atmospheric Wind Hazard Network",
      affectedArea: locationName,
      source: "Anemometer Telemetry Station Array",
      tags: ["High Wind", "Gale", "Aviation Hazard"],
      triggerMetric: `Sustained Velocity: ${current.wind_speed_10m} km/h (Direction: ${current.wind_direction_10m}°)`,
    });
  }

  // 3. Excessive Heat & Thermal Index Hazard (Temp >= 33°C or Apparent Temp >= 36°C)
  if (current.temperature_2m >= 33 || current.apparent_temperature >= 36) {
    const isExtreme = current.apparent_temperature >= 40 || current.temperature_2m >= 38;
    alerts.push({
      id: `alert-heat-${Date.now()}`,
      event: isExtreme ? "Excessive Heat Warning" : "Heat Advisory",
      severity: isExtreme ? "extreme" : "moderate",
      urgency: "Expected",
      certainty: "Likely",
      category: "Health",
      headline: `Dangerous Thermal Conditions: RealFeel ${Math.round(current.apparent_temperature)}°C`,
      description: `A persistent high-pressure dome is driving ambient temperatures to ${Math.round(current.temperature_2m)}°C with an apparent heat index of ${Math.round(current.apparent_temperature)}°C in ${locationName}. Humidity levels are inhibiting effective evaporative cooling.`,
      instruction: "Drink plenty of water and electrolytes. Limit strenuous outdoor exertion during peak afternoon hours (11:00 - 17:00). Never leave children or pets inside unattended vehicles.",
      effective: effectiveIso,
      expires: getExpiryIso(8),
      senderName: "Regional Climate & Public Health Bureau",
      affectedArea: locationName,
      source: "Surface Thermal Sensor Grid",
      tags: ["Heat Index", "Public Health", "Hydration Advisory"],
      triggerMetric: `Ambient: ${current.temperature_2m}°C • Heat Index: ${current.apparent_temperature}°C`,
    });
  }

  // 4. Winter Storm, Freezing Rain & Snow Hazards (Snow codes 71, 73, 75, 85, 86 or temp <= 0 with precip)
  if ([71, 73, 75, 85, 86].includes(current.weather_code) || (current.temperature_2m <= 1 && current.precipitation > 0)) {
    const isHeavy = [75, 86].includes(current.weather_code) || current.snowfall > 2;
    alerts.push({
      id: `alert-winter-${Date.now()}`,
      event: isHeavy ? "Winter Storm Warning" : "Winter Weather Advisory",
      severity: isHeavy ? "severe" : "moderate",
      urgency: "Immediate",
      certainty: "Observed",
      category: "Safety",
      headline: `${isHeavy ? "Heavy Accumulating Snowfall" : "Freezing Precipitation and Icy Conditions"} in ${location.name}`,
      description: `Sub-freezing surface temperatures (${current.temperature_2m}°C) combined with active precipitation are causing snow accumulation and black ice formation on road networks across ${locationName}.`,
      instruction: "Delay non-essential travel. If driving is required, keep an emergency kit (blankets, flashlight, water) in your vehicle. Allow double the standard braking distance.",
      effective: effectiveIso,
      expires: getExpiryIso(12),
      senderName: "Winter Weather Operations Center",
      affectedArea: locationName,
      source: "Sub-Zero Precipitation Observation Station",
      tags: ["Winter Storm", "Black Ice", "Travel Hazard"],
      triggerMetric: `Temp: ${current.temperature_2m}°C • Snow: ${current.snowfall}cm`,
    });
  }

  // 5. Heavy Precipitation & Flood Hazards (Precipitation > 10mm or rain codes 65, 82)
  if (current.precipitation >= 8 || [65, 82].includes(current.weather_code)) {
    alerts.push({
      id: `alert-flood-${Date.now()}`,
      event: "Flood Watch & Heavy Rain Advisory",
      severity: "moderate",
      urgency: "Expected",
      certainty: "Likely",
      category: "Met",
      headline: `Intense Rainfall Rate (${current.precipitation} mm/h) Impacting Drainage in ${location.name}`,
      description: `High atmospheric moisture content is producing persistent downpours over ${locationName}. Low-lying areas, urban underpasses, and small creeks may experience rapid ponding and localized overflow.`,
      instruction: "Do not attempt to walk or drive through flooded roadways ('Turn Around, Don't Drown'). Clear storm drains of debris where safe to do so.",
      effective: effectiveIso,
      expires: getExpiryIso(5),
      senderName: "Hydro-Meteorological River Forecast Center",
      affectedArea: locationName,
      source: "Automated Rain Gauge Network",
      tags: ["Flooding", "Hydrology", "Drainage Surcharge"],
      triggerMetric: `Rain Rate: ${current.precipitation} mm • Probability: ${hourly.precipitation_probability[0] || 85}%`,
    });
  }

  // 6. Dense Fog & Low Visibility Hazard (Fog codes 45, 48)
  if ([45, 48].includes(current.weather_code) && current.relative_humidity_2m >= 90) {
    alerts.push({
      id: `alert-fog-${Date.now()}`,
      event: "Dense Fog Advisory",
      severity: "minor",
      urgency: "Immediate",
      certainty: "Observed",
      category: "Safety",
      headline: `Reduced Visibility Down to < 400 Meters in ${location.name}`,
      description: `High boundary layer relative humidity (${current.relative_humidity_2m}%) and light winds have formed widespread radiation fog across ${locationName}, severely impairing horizontal visibility.`,
      instruction: "Use low-beam headlights only (high beams reflect off water droplets). Maintain generous following distances and reduce travel velocity on thoroughfares.",
      effective: effectiveIso,
      expires: getExpiryIso(4),
      senderName: "Aviation & Surface Visibility Bureau",
      affectedArea: locationName,
      source: "Transmissometer Optical Visibility Station",
      tags: ["Fog", "Aviation", "Low Visibility"],
      triggerMetric: `Humidity: ${current.relative_humidity_2m}% • WMO Code ${current.weather_code}`,
    });
  }

  // 7. Extreme Ultraviolet Radiation Hazard (UV Index >= 8)
  if (current.uv_index >= 8) {
    const isExtremeUV = current.uv_index >= 10;
    alerts.push({
      id: `alert-uv-${Date.now()}`,
      event: isExtremeUV ? "Extreme UV Radiation Alert" : "Very High UV Index Advisory",
      severity: isExtremeUV ? "severe" : "minor",
      urgency: "Expected",
      certainty: "Observed",
      category: "Health",
      headline: `Solar UV Index of ${current.uv_index.toFixed(1)} Presents Rapid Sunburn Risk`,
      description: `Unfiltered solar radiation levels in ${locationName} are reaching critical UV index values of ${current.uv_index.toFixed(1)}. Unprotected skin can sustain UV erythema (burns) in under 15 minutes.`,
      instruction: "Apply broad-spectrum SPF 30+ sunscreen every 2 hours. Wear UV-blocking sunglasses, wide-brimmed hats, and seek shade during midday solar transit.",
      effective: effectiveIso,
      expires: getExpiryIso(4),
      senderName: "Solar Radiation & Atmospheric Ozone Division",
      affectedArea: locationName,
      source: "Radiometer Spectroradiometer Satellite Data",
      tags: ["UV Index", "Solar Radiation", "Dermatology"],
      triggerMetric: `UV Index: ${current.uv_index.toFixed(1)} / 12+`,
    });
  }

  // 8. Low Barometric Pressure Watch (Pressure < 995 hPa)
  if (current.pressure_msl < 995) {
    alerts.push({
      id: `alert-pressure-${Date.now()}`,
      event: "Barometric Low Pressure Disturbance Watch",
      severity: "minor",
      urgency: "Expected",
      certainty: "Likely",
      category: "Met",
      headline: `Deep Low Pressure System (${Math.round(current.pressure_msl)} hPa) In Transit`,
      description: `Rapid barometric deepening indicates an active cyclonic depression passing across ${locationName}. Frontal boundaries may generate rapid wind shifts and sudden weather transitions.`,
      instruction: "Monitor regional radar and satellite feeds for rapid storm evolution over the next 6-12 hours.",
      effective: effectiveIso,
      expires: getExpiryIso(8),
      senderName: "Synoptic Meteorology Analysis Unit",
      affectedArea: locationName,
      source: "Barometric Sensor Array",
      tags: ["Pressure Gradient", "Cyclonic Disturbance", "Synoptic"],
      triggerMetric: `MSL Pressure: ${Math.round(current.pressure_msl)} hPa (Sub-1000 threshold)`,
    });
  }

  // 9. If no urgent hazardous conditions exist, provide a baseline status advisory
  if (alerts.length === 0) {
    alerts.push({
      id: `alert-baseline-${Date.now()}`,
      event: "Active Atmospheric Surveillance (All Clear)",
      severity: "advisory",
      urgency: "Expected",
      certainty: "Observed",
      category: "Met",
      headline: `Standard Atmospheric Stability Verified Over ${location.name}`,
      description: `Continuous Doppler radar and meteorological sensor networks report nominal baseline conditions across ${locationName}. No hazardous squalls, flash floods, or convective warnings are currently in effect.`,
      instruction: "Atmospheric indicators remain favorable for standard outdoor, commute, and recreational activities.",
      effective: effectiveIso,
      expires: getExpiryIso(12),
      senderName: "National Weather Service & TWC Grounded Monitor",
      affectedArea: locationName,
      source: "Synchronized Open-Meteo & Ground Station Telemetry",
      tags: ["Nominal Baseline", "Clear Sky Index", "All Clear"],
      triggerMetric: `Standard metrics: ${current.temperature_2m}°C, ${current.wind_speed_10m} km/h, ${current.relative_humidity_2m}% humidity`,
    });
  }

  return alerts;
}

/**
 * Pre-configured simulated severe weather alert scenarios for testing
 * and demonstration in the UWP Weather App.
 */
export function getSimulatedAlertScenarios(location: GeocodedLocation): WeatherAlert[] {
  const now = new Date();
  const locationName = `${location.name}${location.admin1 ? `, ${location.admin1}` : ""}`;
  const effectiveIso = now.toISOString();
  const getExpiryIso = (hoursAhead: number) =>
    new Date(now.getTime() + hoursAhead * 60 * 60 * 1000).toISOString();

  return [
    {
      id: "sim-tornado",
      event: "Tornado Warning (SIMULATED)",
      severity: "extreme",
      urgency: "Immediate",
      certainty: "Observed",
      category: "Met",
      headline: `EMERGENCY: Doppler Radar Indicates Rotation Approaching ${location.name}`,
      description: `The National Weather Service has detected a severe tornadic storm capable of producing a destructive tornado moving northeast at 45 mph towards ${locationName}. Flying debris will be dangerous to those caught without shelter.`,
      instruction: "TAKE COVER NOW! Move to an interior room on the lowest floor of a sturdy building. Avoid windows. If in a mobile home or vehicle, evacuate to the nearest substantial shelter.",
      effective: effectiveIso,
      expires: getExpiryIso(1),
      senderName: "National Severe Storms Laboratory",
      affectedArea: locationName,
      source: "Dual-Pol Doppler Radar Simulated Trigger",
      tags: ["Tornado Warning", "Extreme Hazard", "Life Safety"],
      triggerMetric: "Simulated Rotation Signature: Gate-to-Gate Shear > 50 kts",
    },
    {
      id: "sim-blizzard",
      event: "Blizzard Warning (SIMULATED)",
      severity: "extreme",
      urgency: "Expected",
      certainty: "Likely",
      category: "Safety",
      headline: `Life-Threatening Blizzard & Whiteout Conditions Forecast for ${location.name}`,
      description: `Heavy snowfall with sustained winds of 65 km/h and gusts over 85 km/h will produce zero-visibility whiteout conditions and severe snow drifting across ${locationName}.`,
      instruction: "Travel should be restricted to emergency personnel only. If stranded in a vehicle, stay inside with the engine running intermittently for heat and hazard flashers active.",
      effective: effectiveIso,
      expires: getExpiryIso(18),
      senderName: "Winter Weather Warning Bureau",
      affectedArea: locationName,
      source: "High-Resolution Ensemble Forecast Matrix",
      tags: ["Blizzard", "Zero Visibility", "Severe Cold"],
      triggerMetric: "Simulated Wind: 75 km/h • Snow Accumulation: 30+ cm",
    },
    {
      id: "sim-gale",
      event: "Marine Gale & Coastal Surge Warning (SIMULATED)",
      severity: "severe",
      urgency: "Immediate",
      certainty: "Observed",
      category: "Marine",
      headline: `Dangerous Wave Action & Gale Force Winds Near ${location.name}`,
      description: `Coastal weather stations are recording sustained gale-force winds exceeding 60 km/h with offshore wave heights reaching 4.5 meters. Coastal inundation is expected in low-lying harbors.`,
      instruction: "Mariners are urged to remain in port or seek safe anchorage. Secure moorings and stay clear of exposed jetties and breakwaters.",
      effective: effectiveIso,
      expires: getExpiryIso(8),
      senderName: "Oceanic & Atmospheric Marine Prediction Group",
      affectedArea: `${locationName} Marine Zones`,
      source: "Offshore Buoy Array #46041",
      tags: ["Marine Hazard", "Gale Warning", "High Surf"],
      triggerMetric: "Simulated Wave: 4.8m • Winds: 65 km/h",
    },
    {
      id: "sim-airquality",
      event: "Air Quality Action Alert (SIMULATED)",
      severity: "moderate",
      urgency: "Expected",
      certainty: "Likely",
      category: "Health",
      headline: `Elevated Fine Particulate (PM2.5) Index Reaching Unhealthy Range`,
      description: `Atmospheric temperature inversion layer is trapping atmospheric particulate matter (PM2.5 index 168) across ${locationName}. Air quality is unhealthy for sensitive groups.`,
      instruction: "Individuals with asthma, respiratory illness, or cardiac conditions should reduce strenuous outdoor activity and run indoor HEPA filtration.",
      effective: effectiveIso,
      expires: getExpiryIso(12),
      senderName: "Environmental Protection & Air Resources Board",
      affectedArea: locationName,
      source: "Continuous Air Quality Telemetry Station",
      tags: ["Air Quality", "PM2.5", "Respiratory Safety"],
      triggerMetric: "Simulated PM2.5: 168 µg/m³ (AQI: Unhealthy)",
    },
  ];
}

/**
 * Returns color classes and styling attributes matching the alert severity.
 */
export function getSeverityStyle(severity: AlertSeverity, darkMode: boolean = true) {
  switch (severity) {
    case "extreme":
      return {
        badgeBg: "bg-red-600 text-white animate-pulse",
        borderClass: "border-red-500",
        containerBg: darkMode ? "bg-red-950/30 border-red-500/40" : "bg-red-50 border-red-300",
        textColor: "text-red-500",
        accentColor: "#ef4444",
        icon: "alert-triangle",
        label: "EXTREME EMERGENCY",
        priority: 1,
      };
    case "severe":
      return {
        badgeBg: "bg-orange-600 text-white",
        borderClass: "border-orange-500",
        containerBg: darkMode ? "bg-orange-950/30 border-orange-500/40" : "bg-orange-50 border-orange-300",
        textColor: "text-orange-400",
        accentColor: "#f97316",
        icon: "alert-octagon",
        label: "SEVERE WARNING",
        priority: 2,
      };
    case "moderate":
      return {
        badgeBg: "bg-amber-600 text-white",
        borderClass: "border-amber-500",
        containerBg: darkMode ? "bg-amber-950/20 border-amber-500/30" : "bg-amber-50 border-amber-300",
        textColor: "text-amber-400",
        accentColor: "#f59e0b",
        icon: "shield-alert",
        label: "WEATHER WATCH",
        priority: 3,
      };
    case "minor":
      return {
        badgeBg: "bg-sky-600 text-white",
        borderClass: "border-sky-500",
        containerBg: darkMode ? "bg-sky-950/20 border-sky-500/30" : "bg-sky-50 border-sky-300",
        textColor: "text-sky-400",
        accentColor: "#0284c7",
        icon: "info",
        label: "SPECIAL ADVISORY",
        priority: 4,
      };
    case "advisory":
    default:
      return {
        badgeBg: "bg-emerald-600 text-white",
        borderClass: "border-emerald-500",
        containerBg: darkMode ? "bg-emerald-950/20 border-emerald-500/30" : "bg-emerald-50 border-emerald-300",
        textColor: "text-emerald-400",
        accentColor: "#10b981",
        icon: "check-circle",
        label: "MONITORED STATUS",
        priority: 5,
      };
  }
}

/**
 * Synthesizes an emergency warning audio chime using Web Audio API.
 */
export function playAlertChime(severity: AlertSeverity = "severe") {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    if (severity === "extreme") {
      // High-low emergency siren tone
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(853, now);
      osc1.frequency.exponentialRampToValueAtTime(960, now + 0.3);
      osc1.frequency.exponentialRampToValueAtTime(853, now + 0.6);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(960, now);
      osc2.frequency.exponentialRampToValueAtTime(853, now + 0.3);
      osc2.frequency.exponentialRampToValueAtTime(960, now + 0.6);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc1.stop(now + 0.9);
      osc2.stop(now + 0.9);
    } else if (severity === "severe") {
      // Dual harmonic attention chime
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(880, now + 0.15); // A5

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(440, now); // A4
      osc2.frequency.setValueAtTime(659.25, now + 0.15); // E5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc1.stop(now + 0.8);
      osc2.stop(now + 0.8);
    } else {
      // Gentle notification bell
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc1.frequency.setValueAtTime(783.99, now + 0.2); // G5

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc1.stop(now + 0.7);
    }

    osc1.connect(gain);
    if (severity !== "advisory" && severity !== "minor") {
      osc2.connect(gain);
    }
    gain.connect(ctx.destination);
    osc1.start(now);
    if (severity !== "advisory" && severity !== "minor") {
      osc2.start(now);
    }
  } catch (e) {
    console.warn("Audio chime playback unavailable:", e);
  }
}

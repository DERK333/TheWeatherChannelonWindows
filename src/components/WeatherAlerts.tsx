/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  Info,
  CheckCircle2,
  Volume2,
  VolumeX,
  Bell,
  Clock,
  MapPin,
  Flame,
  Wind,
  Droplets,
  Radio,
  Share2,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileCode,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { WeatherResponse, GeocodedLocation, WeatherAlert, AlertSeverity } from "../types";
import {
  deriveWeatherAlerts,
  getSimulatedAlertScenarios,
  getSeverityStyle,
  playAlertChime,
} from "../utils/alertUtils";

interface WeatherAlertsProps {
  darkMode: boolean;
  activeLocation: GeocodedLocation | null;
  weatherData: WeatherResponse | null;
  onTriggerToast: (title: string, message: string, type: "info" | "warning" | "success") => void;
  compact?: boolean; // When rendered as a top banner on the dashboard
  onViewAllAlerts?: () => void;
}

export default function WeatherAlerts({
  darkMode,
  activeLocation,
  weatherData,
  onTriggerToast,
  compact = false,
  onViewAllAlerts,
}: WeatherAlertsProps) {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "severe" | "safety" | "health">("all");
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showXmlCap, setShowXmlCap] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Compute or load active alerts whenever weatherData or location changes
  useEffect(() => {
    if (!weatherData || !activeLocation) {
      setAlerts([]);
      return;
    }

    // Derive calculated alerts based on real meteorological parameters
    const derived = deriveWeatherAlerts(weatherData.weather, activeLocation);
    setAlerts(derived);
    if (derived.length > 0 && !selectedAlertId) {
      setSelectedAlertId(derived[0].id);
    }
  }, [weatherData, activeLocation]);

  if (!weatherData || !activeLocation) {
    return null;
  }

  // Count severe/extreme active threats
  const hazardousCount = alerts.filter(
    (a) => a.severity === "extreme" || a.severity === "severe" || a.severity === "moderate"
  ).length;

  const highestSeverity: AlertSeverity = alerts.some((a) => a.severity === "extreme")
    ? "extreme"
    : alerts.some((a) => a.severity === "severe")
    ? "severe"
    : alerts.some((a) => a.severity === "moderate")
    ? "moderate"
    : alerts.some((a) => a.severity === "minor")
    ? "minor"
    : "advisory";

  const topSeverityStyle = getSeverityStyle(highestSeverity, darkMode);

  // Filter alerts according to category/severity
  const filteredAlerts = alerts.filter((a) => {
    if (activeFilter === "severe") return a.severity === "extreme" || a.severity === "severe";
    if (activeFilter === "safety") return a.category === "Safety" || a.category === "Met";
    if (activeFilter === "health") return a.category === "Health";
    return true;
  });

  const handleCopyAlert = (alert: WeatherAlert) => {
    const text = `[${alert.event.toUpperCase()}] ${alert.headline}\nArea: ${alert.affectedArea}\nSeverity: ${alert.severity.toUpperCase()} | Urgency: ${alert.urgency}\nEffective: ${alert.effective} to ${alert.expires}\n\nInstructions:\n${alert.instruction}\n\nSource: ${alert.senderName}`;
    navigator.clipboard.writeText(text);
    setCopiedId(alert.id);
    onTriggerToast("Warning Copied", "Official meteorological advisory copied to clipboard.", "success");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePlayAudio = (severity: AlertSeverity) => {
    playAlertChime(severity);
    onTriggerToast("Emergency Chime", `Simulating ${severity.toUpperCase()} tone broadcast.`, "info");
  };

  const handleApplySimulation = (scenarioAlert: WeatherAlert) => {
    setAlerts([scenarioAlert, ...alerts.filter((a) => !a.id.startsWith("sim-"))]);
    setSelectedAlertId(scenarioAlert.id);
    setIsSimulating(true);
    if (soundEnabled) {
      playAlertChime(scenarioAlert.severity);
    }
    onTriggerToast(
      "Scenario Loaded",
      `Simulated ${scenarioAlert.event} triggered for ${activeLocation.name}.`,
      scenarioAlert.severity === "extreme" ? "warning" : "info"
    );
  };

  const handleResetToRealData = () => {
    if (weatherData && activeLocation) {
      const derived = deriveWeatherAlerts(weatherData.weather, activeLocation);
      setAlerts(derived);
      if (derived.length > 0) setSelectedAlertId(derived[0].id);
      setIsSimulating(false);
      onTriggerToast("Live Alerts Synchronized", "Restored live station observations.", "success");
    }
  };

  // -------------------------------------------------------------
  // COMPACT DASHBOARD BANNER VIEW
  // -------------------------------------------------------------
  if (compact) {
    if (hazardousCount === 0) {
      return (
        <div
          className={`px-4 py-2.5 rounded-xl border flex items-center justify-between transition-all backdrop-blur-md ${
            darkMode
              ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-300"
              : "bg-emerald-50/80 border-emerald-200 text-emerald-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
            <div className="text-xs font-medium">
              <span className="font-semibold">Station Surveillance Active:</span> No severe weather warnings for {activeLocation.name}
            </div>
          </div>
          {onViewAllAlerts && (
            <button
              onClick={onViewAllAlerts}
              className="text-[11px] font-semibold text-emerald-400 hover:underline flex items-center gap-1"
            >
              Advisories & Tests →
            </button>
          )}
        </div>
      );
    }

    const primaryAlert = alerts[0];
    const style = getSeverityStyle(primaryAlert.severity, darkMode);

    return (
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg transition-all backdrop-blur-xl ${style.containerBg} ${style.borderClass}`}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-black/20 shrink-0 mt-0.5">
            <AlertTriangle className={style.textColor} size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${style.badgeBg}`}>
                {style.label}
              </span>
              <span className="text-xs font-bold text-gray-200 dark:text-white">
                {primaryAlert.event}
              </span>
              <span className="text-[10.5px] text-gray-400 font-mono">
                • {activeLocation.name}
              </span>
            </div>
            <p className="text-xs text-gray-300 dark:text-gray-200 mt-1 leading-snug line-clamp-1">
              {primaryAlert.headline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={() => handlePlayAudio(primaryAlert.severity)}
            title="Play Alert Tone"
            className="p-1.5 rounded-md bg-black/20 hover:bg-black/30 text-gray-300 hover:text-white transition-colors"
          >
            <Volume2 size={14} />
          </button>
          {onViewAllAlerts && (
            <button
              onClick={onViewAllAlerts}
              className="px-3 py-1.5 rounded-lg bg-[#0078d4] text-white hover:bg-[#006cbd] text-xs font-semibold shadow transition-colors flex items-center gap-1.5"
            >
              <span>View Active Alerts ({alerts.length})</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // FULL ALERTS & ADVISORIES WORKSPACE VIEW
  // -------------------------------------------------------------
  const selectedAlert = alerts.find((a) => a.id === selectedAlertId) || alerts[0];

  return (
    <div className="p-5 flex-1 overflow-y-auto space-y-6">
      
      {/* Header with Location context & Control buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-gray-400">
              National Meteorological Advisory Stream
            </span>
            {isSimulating && (
              <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.2 rounded-full font-mono uppercase">
                Simulation Active
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold font-sans tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-[#0078d4]" size={26} />
            <span>Severe Weather Alerts & Warnings</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Station surveillance for <strong className="text-gray-300">{activeLocation.name}, {activeLocation.admin1 || activeLocation.country}</strong> • Common Alerting Protocol (CAP) compliant
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? darkMode
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-black/5 border-black/10 text-gray-900"
                : "opacity-60 border-transparent text-gray-500"
            }`}
            title={soundEnabled ? "Audio chimes active" : "Audio chimes muted"}
          >
            {soundEnabled ? <Volume2 size={14} className="text-[#0078d4]" /> : <VolumeX size={14} />}
            <span className="text-[11px] hidden sm:inline">{soundEnabled ? "Chimes On" : "Muted"}</span>
          </button>

          {isSimulating ? (
            <button
              onClick={handleResetToRealData}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition-colors"
            >
              <RefreshCw size={13} />
              <span>Restore Live Observations</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onTriggerToast("Scanning Stations", "Queried atmospheric radar arrays for active advisories.", "info");
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-500/20 hover:bg-slate-500/10 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw size={13} />
              <span>Poll Status</span>
            </button>
          )}
        </div>
      </div>

      {/* EMERGENCY SUMMARY TICKER BANNER */}
      <div
        className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-fluent backdrop-blur-xl ${topSeverityStyle.containerBg} ${topSeverityStyle.borderClass}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${topSeverityStyle.badgeBg} flex items-center justify-center shrink-0`}>
            {highestSeverity === "extreme" || highestSeverity === "severe" ? (
              <AlertTriangle size={22} className="text-white animate-bounce" />
            ) : highestSeverity === "moderate" ? (
              <ShieldAlert size={22} className="text-white" />
            ) : (
              <CheckCircle2 size={22} className="text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight">
                {hazardousCount > 0
                  ? `${hazardousCount} Active Meteorological Threat${hazardousCount > 1 ? "s" : ""} in Effect`
                  : "All Clear • Baseline Atmospheric Stability"}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/20 text-gray-300">
                {alerts.length} Bulletin{alerts.length > 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-xs opacity-80 mt-0.5">
              {hazardousCount > 0
                ? "Immediate preparedness recommended. Review local precautions and protective measures below."
                : "Atmospheric radar stations report no convective squalls, high winds, or freezing hazards."}
            </p>
          </div>
        </div>

        {/* Audio Test button */}
        <button
          onClick={() => handlePlayAudio(highestSeverity)}
          className="px-3.5 py-1.5 rounded-xl bg-black/20 hover:bg-black/30 border border-white/10 text-xs font-semibold flex items-center gap-2 transition-colors self-end md:self-auto"
        >
          <Radio size={13} className="text-[#0078d4]" />
          <span>Sound Emergency Chime</span>
        </button>
      </div>

      {/* FILTER BUTTONS & EMERGENCY SIMULATOR DRAWER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === "all"
                ? "bg-[#0078d4] text-white shadow-sm"
                : darkMode
                ? "bg-[#28292d] text-gray-400 hover:text-white"
                : "bg-white text-gray-600 hover:text-gray-900 border"
            }`}
          >
            All Bulletins ({alerts.length})
          </button>
          <button
            onClick={() => setActiveFilter("severe")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === "severe"
                ? "bg-red-600 text-white shadow-sm"
                : darkMode
                ? "bg-[#28292d] text-gray-400 hover:text-white"
                : "bg-white text-gray-600 hover:text-gray-900 border"
            }`}
          >
            Severe & Extreme Threats
          </button>
          <button
            onClick={() => setActiveFilter("safety")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === "safety"
                ? "bg-amber-600 text-white shadow-sm"
                : darkMode
                ? "bg-[#28292d] text-gray-400 hover:text-white"
                : "bg-white text-gray-600 hover:text-gray-900 border"
            }`}
          >
            Public Safety & Storms
          </button>
          <button
            onClick={() => setActiveFilter("health")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === "health"
                ? "bg-purple-600 text-white shadow-sm"
                : darkMode
                ? "bg-[#28292d] text-gray-400 hover:text-white"
                : "bg-white text-gray-600 hover:text-gray-900 border"
            }`}
          >
            Thermal & UV Index
          </button>
        </div>

        {/* Quick simulator dropdown/buttons */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-gray-400 text-[11px] hidden md:inline">Test Scenarios:</span>
          {getSimulatedAlertScenarios(activeLocation).map((sim) => (
            <button
              key={sim.id}
              onClick={() => handleApplySimulation(sim)}
              className="px-2 py-1 rounded-md text-[10.5px] font-medium bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-colors"
            >
              + {sim.event.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN TWO-COLUMN ALERTS LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT LIST: Alert Cards (4 cols on lg) */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-[10.5px] font-mono uppercase tracking-wider text-gray-400 block mb-1">
            Active Warning Queue ({filteredAlerts.length})
          </span>

          {filteredAlerts.length === 0 ? (
            <div className={`p-8 text-center rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
              <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2 opacity-80" />
              <p className="text-xs font-semibold">No alerts matching active filter</p>
              <p className="text-[11px] text-gray-400 mt-1">Switch to 'All Bulletins' to review standard surveillance advisories.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isSelected = selectedAlert?.id === alert.id;
              const style = getSeverityStyle(alert.severity, darkMode);

              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlertId(alert.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? `${style.containerBg} ${style.borderClass} shadow-lg ring-1 ring-offset-0 ring-[#0078d4]`
                      : darkMode
                      ? "bg-[#25262b]/80 border-white/10 hover:border-white/20"
                      : "bg-white border-black/10 hover:border-black/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.badgeBg}`}>
                        {style.label}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {alert.urgency}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayAudio(alert.severity);
                      }}
                      className="p-1 rounded text-gray-400 hover:text-white transition-colors"
                      title="Play alert tone"
                    >
                      <Volume2 size={13} />
                    </button>
                  </div>

                  <h3 className="text-xs font-bold mt-2 font-sans text-gray-200 dark:text-white">
                    {alert.event}
                  </h3>

                  <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {alert.headline}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-500/10 text-[10px] text-gray-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> Expires in ~3h
                    </span>
                    <span className="truncate max-w-[150px]">{alert.affectedArea}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT DETAIL: Detailed Alert Telemetry & Safety Actions (7 cols on lg) */}
        {selectedAlert && (
          <div className="lg:col-span-7 space-y-4">
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-gray-400 block mb-1">
              Official Common Alerting Protocol (CAP) Bulletin
            </span>

            <div
              className={`p-6 rounded-2xl border shadow-fluent backdrop-blur-2xl transition-all space-y-6 ${
                darkMode ? "bg-white/5 border-white/10 text-white" : "bg-white border-black/10 text-[#202020]"
              }`}
            >
              {/* Header block with Alert Badges & Copy/Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-500/10">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        getSeverityStyle(selectedAlert.severity, darkMode).badgeBg
                      }`}
                    >
                      {selectedAlert.severity.toUpperCase()} PRIORITY
                    </span>
                    <span className="text-xs font-mono text-gray-400 bg-slate-500/10 px-2 py-0.5 rounded-md">
                      Category: {selectedAlert.category}
                    </span>
                    <span className="text-xs font-mono text-gray-400 bg-slate-500/10 px-2 py-0.5 rounded-md">
                      Certainty: {selectedAlert.certainty}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold font-sans mt-2 tracking-tight">
                    {selectedAlert.event}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePlayAudio(selectedAlert.severity)}
                    className="p-2 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-gray-300 hover:text-white transition-colors"
                    title="Audio Chime"
                  >
                    <Volume2 size={15} />
                  </button>
                  <button
                    onClick={() => handleCopyAlert(selectedAlert)}
                    className="px-3 py-1.5 rounded-lg bg-[#0078d4] hover:bg-[#006cbd] text-white text-xs font-semibold flex items-center gap-1.5 shadow transition-colors"
                  >
                    {copiedId === selectedAlert.id ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === selectedAlert.id ? "Copied" : "Copy Alert"}</span>
                  </button>
                </div>
              </div>

              {/* Headline Callout */}
              <div
                className={`p-4 rounded-xl border ${
                  getSeverityStyle(selectedAlert.severity, darkMode).containerBg
                } ${getSeverityStyle(selectedAlert.severity, darkMode).borderClass}`}
              >
                <div className="flex items-start gap-3">
                  <AlertOctagon className={getSeverityStyle(selectedAlert.severity, darkMode).textColor} size={20} />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 dark:text-gray-200">
                      Meteorological Statement
                    </h4>
                    <p className="text-xs font-medium mt-1 leading-relaxed text-gray-200 dark:text-white">
                      {selectedAlert.headline}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Meteorological Narrative */}
              <div>
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-2">
                  Synoptic Analysis & Hazard Synopsis
                </h4>
                <p className="text-xs leading-relaxed text-gray-300 dark:text-gray-200 whitespace-pre-line font-sans">
                  {selectedAlert.description}
                </p>
              </div>

              {/* Safety Instructions & Action Checklist */}
              <div className={`p-4 rounded-xl border ${darkMode ? "bg-black/30 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Recommended Protective Actions
                  </h4>
                </div>
                <div className="space-y-2 text-xs text-gray-300 dark:text-gray-200">
                  <p className="leading-relaxed font-medium">
                    {selectedAlert.instruction}
                  </p>
                </div>
              </div>

              {/* Trigger Telemetry Metrics Box */}
              {selectedAlert.triggerMetric && (
                <div className="p-3 rounded-lg bg-slate-500/10 border border-slate-500/20 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-amber-400" />
                    <span className="text-gray-400 text-[11px]">TRIGGER TELEMETRY:</span>
                  </div>
                  <span className="font-mono font-bold text-[#60cdff]">
                    {selectedAlert.triggerMetric}
                  </span>
                </div>
              )}

              {/* Station Metadata & Validity Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono pt-3 border-t border-slate-500/10 text-gray-400">
                <div>
                  <span className="text-[10px] block text-gray-500">ISSUING AUTHORITY:</span>
                  <span className="text-gray-300 font-semibold">{selectedAlert.senderName}</span>
                </div>
                <div>
                  <span className="text-[10px] block text-gray-500">TARGET GEOGRAPHIC ZONE:</span>
                  <span className="text-gray-300 font-semibold">{selectedAlert.affectedArea}</span>
                </div>
                <div>
                  <span className="text-[10px] block text-gray-500">OBSERVATION SOURCE:</span>
                  <span className="text-gray-300">{selectedAlert.source}</span>
                </div>
                <div>
                  <span className="text-[10px] block text-gray-500">STATUS VALIDITY:</span>
                  <span className="text-emerald-400">Active Surveillance</span>
                </div>
              </div>

              {/* Tags Row */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {selectedAlert.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-500/10 border border-slate-500/20 text-gray-300 font-mono"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              {/* CAP Payload Raw Code Toggle */}
              <div className="pt-2">
                <button
                  onClick={() => setShowXmlCap(showXmlCap === selectedAlert.id ? null : selectedAlert.id)}
                  className="text-[11px] text-gray-400 hover:text-gray-200 flex items-center gap-1.5 transition-colors font-mono"
                >
                  <FileCode size={13} />
                  <span>{showXmlCap === selectedAlert.id ? "Hide CAP XML Payload" : "Inspect CAP 1.2 XML Document"}</span>
                </button>

                {showXmlCap === selectedAlert.id && (
                  <div className="mt-3 p-3 rounded-lg bg-zinc-950 text-gray-300 font-mono text-[10px] overflow-x-auto leading-relaxed border border-white/10">
                    <pre>{`<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>${selectedAlert.id}</identifier>
  <sender>${selectedAlert.senderName}</sender>
  <sent>${selectedAlert.effective}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <category>${selectedAlert.category}</category>
    <event>${selectedAlert.event}</event>
    <urgency>${selectedAlert.urgency}</urgency>
    <severity>${selectedAlert.severity}</severity>
    <certainty>${selectedAlert.certainty}</certainty>
    <headline>${selectedAlert.headline}</headline>
    <description>${selectedAlert.description}</description>
    <instruction>${selectedAlert.instruction}</instruction>
    <expires>${selectedAlert.expires}</expires>
    <area>
      <areaDesc>${selectedAlert.affectedArea}</areaDesc>
    </area>
  </info>
</alert>`}</pre>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}

import React from "react";
import {
  Activity,
  Clock,
  Database,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

const StatusSummaryBar = ({
  healthData,
  queueData,
  isFetching,
  onRefresh,
  autoRefreshInterval,
  setAutoRefreshInterval,
  lastUpdated,
}) => {
  // Overall status styling
  const overallStatus = healthData?.status?.toLowerCase() || "healthy";

  const getStatusConfig = (status) => {
    switch (status) {
      case "critical":
        return {
          bg: "bg-red-500/10 border-red-500/30 text-red-700",
          dot: "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]",
          label: "Critical Issues",
          icon: XCircle,
        };
      case "moderate":
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-700",
          dot: "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]",
          label: "Moderate Load",
          icon: AlertTriangle,
        };
      case "healthy":
      default:
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700",
          dot: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]",
          label: "All Systems Operational",
          icon: CheckCircle2,
        };
    }
  };

  const statusConfig = getStatusConfig(overallStatus);
  const StatusIcon = statusConfig.icon;

  // Uptime formatting
  const uptime = healthData?.uptime;
  const formattedUptime = uptime
    ? `${uptime.days ?? 0}d ${uptime.hours ?? 0}h ${uptime.minutes ?? 0}m`
    : "Active";

  // Database status
  const dbConnected =
    healthData?.database?.status === "connected" ||
    healthData?.database?.readyState === 1;

  // Redis status & ping
  const redisConnected =
    healthData?.redis?.status === "connected" ||
    queueData?.redis?.connected === true;
  const pingMs = queueData?.redis?.pingMs;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left Section: Status & Uptime */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          {/* Main Status Badge */}
          <div
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border text-sm font-semibold tracking-wide ${statusConfig.bg}`}
          >
            <span className="relative flex h-3 w-3">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusConfig.dot}`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${statusConfig.dot}`}
              ></span>
            </span>
            <StatusIcon className="w-4 h-4" />
            <span className="capitalize">{healthData?.status || "Healthy"}</span>
            <span className="hidden sm:inline text-xs opacity-75 font-normal">
              • {statusConfig.label}
            </span>
          </div>

          {/* Uptime Indicator */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200/60 text-gray-700 text-xs sm:text-sm font-medium">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-gray-500">Uptime:</span>
            <span className="font-semibold text-gray-800">{formattedUptime}</span>
          </div>

          {/* MongoDB Pill Indicator */}
          <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-colors ${
              dbConnected
                ? "bg-emerald-50/60 border-emerald-200 text-emerald-800"
                : "bg-red-50/60 border-red-200 text-red-800"
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              {dbConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  dbConnected ? "bg-emerald-500" : "bg-red-500"
                }`}
              ></span>
            </span>
            <Database className="w-3.5 h-3.5 opacity-80" />
            <span>MongoDB:</span>
            <span className="font-semibold">
              {dbConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          {/* Redis Pill Indicator */}
          <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-colors ${
              redisConnected
                ? "bg-rose-50/70 border-rose-200 text-rose-900"
                : "bg-red-50/60 border-red-200 text-red-800"
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              {redisConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  redisConnected ? "bg-rose-500" : "bg-red-500"
                }`}
              ></span>
            </span>
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span>Redis:</span>
            <span className="font-semibold">
              {redisConnected ? "Connected" : "Disconnected"}
            </span>
            {redisConnected && pingMs !== undefined && (
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white border border-rose-200/80 text-[11px] font-bold text-primary">
                {pingMs}ms
              </span>
            )}
          </div>
        </div>

        {/* Right Section: Auto-Refresh & Manual Refresh */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Auto Refresh Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl border border-gray-200/60 text-xs">
            <span className="px-2 text-gray-500 font-medium hidden sm:inline">
              Auto:
            </span>
            <button
              onClick={() => setAutoRefreshInterval(0)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                autoRefreshInterval === 0
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Off
            </button>
            <button
              onClick={() => setAutoRefreshInterval(10000)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                autoRefreshInterval === 10000
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              10s
            </button>
            <button
              onClick={() => setAutoRefreshInterval(30000)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                autoRefreshInterval === 30000
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              30s
            </button>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#CA3939] to-[#DE5555] hover:opacity-95 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-medium shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            <span>{isFetching ? "Syncing..." : "Refresh"}</span>
          </button>

          {/* Last updated */}
          {lastUpdated && (
            <span className="text-[11px] text-gray-400 hidden xl:inline">
              Updated: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusSummaryBar;

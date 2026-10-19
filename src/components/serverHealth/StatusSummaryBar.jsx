import React from "react";
import {
  Clock,
  Database,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

const StatusSummaryBar = ({
  healthData,
  queueData,
}) => {
  const overallStatus = (healthData?.status || "healthy").toLowerCase();

  // Status configuration - restrained, functional enterprise indicators
  const getStatusBadge = () => {
    switch (overallStatus) {
      case "critical":
        return {
          pill: "bg-rose-50 text-rose-700 border-rose-200",
          dot: "bg-rose-600",
          label: "Critical",
          description: "System requires immediate attention",
          icon: XCircle,
        };
      case "moderate":
        return {
          pill: "bg-amber-50 text-amber-700 border-amber-200",
          dot: "bg-amber-600",
          label: "Moderate Load",
          description: "High resource consumption",
          icon: AlertTriangle,
        };
      case "healthy":
      default:
        return {
          pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: "bg-emerald-600",
          label: "Operational",
          description: "All services running normally",
          icon: CheckCircle2,
        };
    }
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  // Uptime formatting
  const uptime = healthData?.uptime;
  const formattedUptime = uptime
    ? `${uptime.days ?? 0}d ${uptime.hours ?? 0}h ${uptime.minutes ?? 0}m`
    : "—";

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
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* Metric 1: System Status */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1">
              System Health
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium border ${status.pill}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                {status.label}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Uptime */}
        <div className="flex items-center gap-3 md:pl-4 pt-3 md:pt-0">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1">
              System Uptime
            </span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm font-semibold text-gray-900 font-mono">
                {formattedUptime}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: MongoDB */}
        <div className="flex items-center gap-3 md:pl-4 pt-3 md:pt-0">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1">
              Database (MongoDB)
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${
                  dbConnected
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    dbConnected ? "bg-emerald-600" : "bg-rose-600"
                  }`}
                ></span>
                {dbConnected ? "Connected" : "Disconnected"}
              </span>
              {dbConnected && healthData?.database?.readyState !== undefined && (
                <span className="text-[11px] text-gray-400 font-mono">
                  (state: {healthData.database.readyState})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 4: Redis */}
        <div className="flex items-center gap-3 md:pl-4 pt-3 md:pt-0">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1">
              Queue Store (Redis)
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${
                  redisConnected
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    redisConnected ? "bg-emerald-600" : "bg-rose-600"
                  }`}
                ></span>
                {redisConnected ? "Connected" : "Disconnected"}
              </span>
              {redisConnected && pingMs !== undefined && (
                <span className="text-xs font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                  {pingMs}ms
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusSummaryBar;

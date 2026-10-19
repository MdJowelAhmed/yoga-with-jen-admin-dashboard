import React, { useState } from "react";
import { Modal } from "antd";
import { Trash2, AlertCircle } from "lucide-react";

const SystemResourcesGrid = ({
  healthData,
  queueData,
  onFlushCache,
  isFlushing,
}) => {
  const [isFlushModalOpen, setIsFlushModalOpen] = useState(false);
  const [flushType, setFlushType] = useState("cache-only");

  // Memory stats
  const memory = healthData?.memory || {};
  const usedPercentage = Math.min(
    100,
    Math.max(0, parseFloat(memory.usedMemoryPercentage ?? 0))
  );
  const usedGB = (memory.usedMemory?.GB ?? 0).toFixed(1);
  const totalGB = (memory.totalMemory?.GB ?? 0).toFixed(1);
  const freeGB = (memory.freeMemory?.GB ?? 0).toFixed(1);
  const usedMB = memory.usedMemory?.MB ?? 0;
  const totalMB = memory.totalMemory?.MB ?? 0;

  // Functional color for RAM threshold
  const getMemoryBarColor = (pct) => {
    if (pct >= 85) return "bg-rose-500";
    if (pct >= 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  // CPU stats
  const cpuCores = healthData?.cpuCores || 1;
  const loadAvg = healthData?.loadAverage || {};
  const load1m = parseFloat(loadAvg["1min"] ?? 0);
  const load5m = parseFloat(loadAvg["5min"] ?? 0);
  const load15m = parseFloat(loadAvg["15min"] ?? 0);

  // Redis stats
  const redis = queueData?.redis || {};
  const usedMemoryHuman = redis.usedMemoryHuman || "0 MB";
  const totalKeys = redis.totalKeys ?? 0;
  const appCacheKeys = redis.appCacheKeys ?? 0;
  const bullKeys = redis.bullKeys ?? 0;
  const redisVersion = redis.version || "N/A";
  const redisUptimeDays = redis.uptimeSeconds
    ? (redis.uptimeSeconds / 86400).toFixed(1)
    : null;

  // Cache breakdown ratio
  const cacheRatio =
    totalKeys > 0 ? Math.round((appCacheKeys / totalKeys) * 100) : 0;
  const bullRatio = totalKeys > 0 ? Math.round((bullKeys / totalKeys) * 100) : 0;

  const handleConfirmFlush = () => {
    onFlushCache(flushType);
    setIsFlushModalOpen(false);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: RAM USAGE */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                RAM Utilization
              </span>
              <span
                className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded border ${
                  usedPercentage >= 85
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : usedPercentage >= 70
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {usedPercentage.toFixed(1)}%
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 my-2">
              <span className="text-2xl font-semibold text-gray-900 font-mono">
                {usedGB}
              </span>
              <span className="text-sm text-gray-500 font-mono">
                / {totalGB} GB
              </span>
            </div>

            {/* Flat Minimal Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-1.5 my-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getMemoryBarColor(
                  usedPercentage
                )}`}
                style={{ width: `${usedPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-mono">
            <span>Free: {freeGB} GB</span>
            <span>Total: {totalMB} MB</span>
          </div>
        </div>

        {/* CARD 2: CPU LOAD AVERAGE */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                CPU Load Average
              </span>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700">
                {cpuCores} {cpuCores === 1 ? "Core" : "Cores"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 my-2.5">
              <div className="border border-gray-100 rounded p-2 text-center bg-gray-50/50">
                <span className="text-[10px] text-gray-400 uppercase font-mono block">
                  1 Min
                </span>
                <span className="text-sm font-semibold text-gray-900 font-mono">
                  {load1m.toFixed(2)}
                </span>
              </div>
              <div className="border border-gray-100 rounded p-2 text-center bg-gray-50/50">
                <span className="text-[10px] text-gray-400 uppercase font-mono block">
                  5 Min
                </span>
                <span className="text-sm font-semibold text-gray-900 font-mono">
                  {load5m.toFixed(2)}
                </span>
              </div>
              <div className="border border-gray-100 rounded p-2 text-center bg-gray-50/50">
                <span className="text-[10px] text-gray-400 uppercase font-mono block">
                  15 Min
                </span>
                <span className="text-sm font-semibold text-gray-900 font-mono">
                  {load15m.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Load State</span>
            <span
              className={`font-medium ${
                load1m > cpuCores
                  ? "text-rose-600"
                  : load1m > cpuCores * 0.7
                  ? "text-amber-600"
                  : "text-emerald-600"
              }`}
            >
              {load1m > cpuCores
                ? "Elevated"
                : load1m > cpuCores * 0.7
                ? "Moderate"
                : "Normal"}
            </span>
          </div>
        </div>

        {/* CARD 3: REDIS MEMORY & KEYS */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                Redis Storage
              </span>
              <span className="text-xs font-mono text-gray-500">
                v{redisVersion}
              </span>
            </div>

            <div className="flex items-baseline gap-2 my-2">
              <span className="text-2xl font-semibold text-gray-900 font-mono">
                {usedMemoryHuman}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                ({totalKeys.toLocaleString()} keys)
              </span>
            </div>

            {/* Distribution Bar */}
            <div className="w-full bg-gray-100 rounded-full h-1.5 my-2 flex overflow-hidden">
              <div
                className="bg-gray-700 h-full"
                style={{ width: `${cacheRatio}%` }}
                title={`Cache Keys: ${appCacheKeys}`}
              ></div>
              <div
                className="bg-gray-400 h-full"
                style={{ width: `${bullRatio}%` }}
                title={`BullMQ Keys: ${bullKeys}`}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-gray-700 inline-block"></span>
                Cache: {appCacheKeys}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-gray-400 inline-block"></span>
                Bull: {bullKeys}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Uptime</span>
            <span className="font-mono text-gray-700">
              {redisUptimeDays ? `${redisUptimeDays} days` : "Active"}
            </span>
          </div>
        </div>

        {/* CARD 4: CACHE MANAGEMENT */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                Cache Management
              </span>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700">
                {appCacheKeys} Keys
              </span>
            </div>

            <p className="text-xs text-gray-500 leading-normal my-2">
              Purges in-memory and Redis query caches while keeping background queue jobs intact.
            </p>
          </div>

          <div className="pt-3">
            <button
              onClick={() => setIsFlushModalOpen(true)}
              disabled={isFlushing}
              className="w-full h-8 px-3 text-xs font-medium border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 rounded transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5 text-gray-500" />
              <span>{isFlushing ? "Purging..." : "Flush App Cache"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL FOR CACHE FLUSH */}
      <Modal
        centered
        open={isFlushModalOpen}
        onCancel={() => setIsFlushModalOpen(false)}
        onOk={handleConfirmFlush}
        confirmLoading={isFlushing}
        title={
          <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>Confirm Cache Flush</span>
          </div>
        }
        okText="Confirm Flush"
        cancelText="Cancel"
        okButtonProps={{
          className:
            "!h-8 !px-3 !text-xs !font-medium !rounded !bg-[#de5555] hover:!bg-[#ca3939] !border-[#de5555]",
        }}
        cancelButtonProps={{
          className:
            "!h-8 !px-3 !text-xs !font-medium !rounded !border-gray-300 !text-gray-700 hover:!bg-gray-50",
        }}
      >
        <div className="py-2 space-y-3">
          <p className="text-xs text-gray-600 leading-relaxed">
            Flushing the cache will invalidate temporary stored responses ({appCacheKeys} active keys). Subsequent queries will read directly from the database until the cache repopulates.
          </p>

          <div className="border border-gray-200 rounded p-3 bg-gray-50/50 space-y-2">
            <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider block">
              Flush Scope
            </span>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs text-gray-800 cursor-pointer">
                <input
                  type="radio"
                  name="flushType"
                  value="cache-only"
                  checked={flushType === "cache-only"}
                  onChange={() => setFlushType("cache-only")}
                  className="w-3.5 h-3.5 text-[#de5555] focus:ring-[#de5555]"
                />
                <span>Application Cache Only (Preserves BullMQ queues)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-800 cursor-pointer">
                <input
                  type="radio"
                  name="flushType"
                  value="all"
                  checked={flushType === "all"}
                  onChange={() => setFlushType("all")}
                  className="w-3.5 h-3.5 text-[#de5555] focus:ring-[#de5555]"
                />
                <span>Entire Redis Store (All Keys)</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SystemResourcesGrid;

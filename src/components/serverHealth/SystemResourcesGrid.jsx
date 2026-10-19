import React, { useState } from "react";
import {
  HardDrive,
  Cpu,
  Database,
  Flame,
  AlertCircle,
  Layers,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { Modal, Progress } from "antd";

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

  // Memory progress bar color
  const getProgressStroke = (pct) => {
    if (pct >= 85) return "#ef4444"; // red
    if (pct >= 70) return "#f59e0b"; // amber
    return "#10b981"; // emerald
  };

  // CPU stats
  const cpuCores = healthData?.cpuCores || 1;
  const loadAvg = healthData?.loadAverage || {};
  const load1m = parseFloat(loadAvg["1min"] ?? 0);
  const load5m = parseFloat(loadAvg["5min"] ?? 0);
  const load15m = parseFloat(loadAvg["15min"] ?? 0);

  // Normalize load against core count (e.g., load / cores * 100)
  const calcLoadPct = (val) =>
    Math.min(100, Math.round((val / Math.max(1, cpuCores)) * 100));

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* CARD 1: RAM USAGE */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    RAM Usage
                  </h3>
                  <p className="text-xs text-gray-400">System Memory</p>
                </div>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  usedPercentage >= 85
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : usedPercentage >= 70
                    ? "bg-amber-50 text-amber-600 border border-amber-200"
                    : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                }`}
              >
                {usedPercentage.toFixed(1)}%
              </span>
            </div>

            {/* Circular / Linear Progress */}
            <div className="my-3">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-2xl font-bold text-gray-800">
                  {usedGB} <span className="text-sm font-normal text-gray-400">/ {totalGB} GB</span>
                </span>
                <span className="text-xs text-gray-500">
                  {freeGB} GB free
                </span>
              </div>
              <Progress
                percent={Math.round(usedPercentage)}
                strokeColor={getProgressStroke(usedPercentage)}
                showInfo={false}
                strokeWidth={10}
                className="my-1"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Used: {usedMB} MB</span>
            <span>Total: {totalMB} MB</span>
          </div>
        </div>

        {/* CARD 2: CPU LOAD AVERAGE */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    CPU Load
                  </h3>
                  <p className="text-xs text-gray-400">Processing Load</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                {cpuCores} {cpuCores === 1 ? "Core" : "Cores"}
              </span>
            </div>

            {/* Load average chips */}
            <div className="grid grid-cols-3 gap-2 my-2">
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-center">
                <p className="text-[11px] font-medium text-gray-400 mb-0.5">1 min</p>
                <p className="text-base font-bold text-gray-800">
                  {load1m.toFixed(2)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {calcLoadPct(load1m)}% cap
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-center">
                <p className="text-[11px] font-medium text-gray-400 mb-0.5">5 min</p>
                <p className="text-base font-bold text-gray-800">
                  {load5m.toFixed(2)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {calcLoadPct(load5m)}% cap
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-center">
                <p className="text-[11px] font-medium text-gray-400 mb-0.5">15 min</p>
                <p className="text-base font-bold text-gray-800">
                  {load15m.toFixed(2)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {calcLoadPct(load15m)}% cap
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Status:</span>
            <span
              className={`font-semibold ${
                load1m > cpuCores
                  ? "text-red-500"
                  : load1m > cpuCores * 0.7
                  ? "text-amber-500"
                  : "text-emerald-600"
              }`}
            >
              {load1m > cpuCores
                ? "Heavy Load"
                : load1m > cpuCores * 0.7
                ? "Moderate"
                : "Optimal"}
            </span>
          </div>
        </div>

        {/* CARD 3: REDIS MEMORY & KEYS */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 text-primary">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    Redis Storage
                  </h3>
                  <p className="text-xs text-gray-400">v{redisVersion}</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-rose-50 text-primary font-bold border border-rose-200">
                {usedMemoryHuman}
              </span>
            </div>

            <div className="space-y-2 my-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Total Keys:</span>
                <span className="font-bold text-gray-800 text-sm">
                  {totalKeys.toLocaleString()}
                </span>
              </div>

              {/* Progress bar showing Cache Keys vs Bull Keys */}
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden flex">
                <div
                  style={{ width: `${cacheRatio}%` }}
                  className="bg-primary h-full"
                  title={`Cache: ${appCacheKeys} (${cacheRatio}%)`}
                ></div>
                <div
                  style={{ width: `${bullRatio}%` }}
                  className="bg-indigo-400 h-full"
                  title={`BullMQ: ${bullKeys} (${bullRatio}%)`}
                ></div>
              </div>

              <div className="flex justify-between text-[11px] text-gray-500 pt-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                  Cache: <b className="text-gray-700">{appCacheKeys}</b>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block"></span>
                  BullMQ: <b className="text-gray-700">{bullKeys}</b>
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Uptime:</span>
            <span className="font-medium text-gray-700">
              {redisUptimeDays ? `${redisUptimeDays} days` : "Active"}
            </span>
          </div>
        </div>

        {/* CARD 4: CACHE MANAGEMENT CARD */}
        <div className="bg-gradient-to-br from-rose-50/50 via-white to-amber-50/30 rounded-2xl border border-rose-100 p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary text-white shadow-sm">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    Cache Control
                  </h3>
                  <p className="text-xs text-gray-400">Redis Cache Layer</p>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-md bg-white border border-rose-200 text-primary font-bold">
                {appCacheKeys} Keys
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              Purges all query caches and warmed responses without terminating or
              clearing background queue jobs.
            </p>
          </div>

          <div>
            <button
              onClick={() => setIsFlushModalOpen(true)}
              disabled={isFlushing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-rose-300 hover:bg-rose-50 active:scale-[0.98] text-primary rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 text-primary" />
              <span>{isFlushing ? "Flushing..." : "Flush App Cache"}</span>
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
        okText="Yes, Flush Cache"
        cancelText="Cancel"
        okButtonProps={{
          style: {
            backgroundColor: "#DE5555",
            borderColor: "#DE5555",
            fontWeight: "bold",
          },
        }}
      >
        <div className="pt-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-2xl bg-red-100 text-red-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Confirm Cache Flush
              </h3>
              <p className="text-xs text-gray-500">
                This will purge in-memory / Redis cache keys.
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to flush the cache? This action will remove
            all cached query responses ({appCacheKeys} keys). The system will
            re-query the database for subsequent requests until cache warms up again.
          </p>

          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/80 mb-2">
            <span className="text-xs font-semibold text-gray-700 block mb-2">
              Select Flush Scope:
            </span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer">
                <input
                  type="radio"
                  name="flushType"
                  value="cache-only"
                  checked={flushType === "cache-only"}
                  onChange={() => setFlushType("cache-only")}
                  className="text-primary focus:ring-primary"
                />
                App Cache Only (Recommended)
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer">
                <input
                  type="radio"
                  name="flushType"
                  value="all"
                  checked={flushType === "all"}
                  onChange={() => setFlushType("all")}
                  className="text-primary focus:ring-primary"
                />
                All Redis Keys
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SystemResourcesGrid;

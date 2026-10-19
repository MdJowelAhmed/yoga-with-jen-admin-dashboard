import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  useGetServerHealthQuery,
  useGetQueueAndCacheQuery,
  useExecuteQueueActionMutation,
  useFlushCacheMutation,
} from "../../redux/apiSlices/serverHealthApi";
import StatusSummaryBar from "../../components/serverHealth/StatusSummaryBar";
import SystemResourcesGrid from "../../components/serverHealth/SystemResourcesGrid";
import QueueManagementTable from "../../components/serverHealth/QueueManagementTable";
import ServerHealthSkeleton from "../../components/serverHealth/ServerHealthSkeleton";
import {
  mockServerHealth,
  mockQueueAndCache,
} from "../../components/serverHealth/mockData";
import { RefreshCw, AlertCircle, RotateCcw } from "lucide-react";

const ServerHealth = () => {
  // Polling interval in ms: 0 (off), 10000 (10s), 30000 (30s)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(10000);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());

  // RTK Query endpoints
  const {
    data: rawHealthData,
    isLoading: isHealthLoading,
    isFetching: isHealthFetching,
    isError: isHealthError,
    error: healthError,
    refetch: refetchHealth,
  } = useGetServerHealthQuery(undefined, {
    pollingInterval: autoRefreshInterval,
  });

  const {
    data: rawQueueData,
    isLoading: isQueueLoading,
    isFetching: isQueueFetching,
    isError: isQueueError,
    error: queueError,
    refetch: refetchQueue,
  } = useGetQueueAndCacheQuery(undefined, {
    pollingInterval: autoRefreshInterval,
  });

  const [executeQueueAction, { isLoading: isExecutingAction }] =
    useExecuteQueueActionMutation();

  const [flushCache, { isLoading: isFlushing }] = useFlushCacheMutation();

  const hasApiError = isHealthError || isQueueError;

  useEffect(() => {
    if (rawHealthData || rawQueueData) {
      setLastUpdated(new Date().toISOString());
    }
  }, [rawHealthData, rawQueueData]);

  // Handle Manual Refresh
  const handleRefresh = async () => {
    const toastId = toast.loading("Updating telemetry...");
    try {
      if (isDemoMode) {
        setTimeout(() => {
          setLastUpdated(new Date().toISOString());
          toast.success("Telemetry updated (Demo)", { id: toastId });
        }, 300);
        return;
      }

      await Promise.all([refetchHealth(), refetchQueue()]);
      setLastUpdated(new Date().toISOString());
      toast.success("Telemetry updated", { id: toastId });
    } catch (err) {
      toast.error("Failed to update telemetry", { id: toastId });
    }
  };

  // Handle Queue Action
  const handleQueueAction = async (queueName, action) => {
    const targetLabel = queueName === "all" ? "all queues" : queueName;
    const toastId = toast.loading(`Executing ${action} on ${targetLabel}...`);

    if (isDemoMode) {
      setTimeout(() => {
        toast.success(`Executed "${action}" on ${targetLabel} (Demo)`, {
          id: toastId,
        });
      }, 500);
      return;
    }

    try {
      const res = await executeQueueAction({ queueName, action }).unwrap();
      toast.success(res?.message || `Queue action "${action}" completed`, {
        id: toastId,
      });
      refetchQueue();
    } catch (err) {
      const errMsg =
        err?.data?.message || err?.error || `Failed to execute ${action}`;
      toast.error(errMsg, { id: toastId });
    }
  };

  // Handle Cache Flush
  const handleFlushCache = async (type = "cache-only") => {
    const toastId = toast.loading(`Flushing ${type} cache...`);

    if (isDemoMode) {
      setTimeout(() => {
        toast.success("App cache flushed (Demo)", { id: toastId });
      }, 500);
      return;
    }

    try {
      const res = await flushCache({ type }).unwrap();
      toast.success(res?.message || "Cache purged successfully", {
        id: toastId,
      });
      refetchQueue();
      refetchHealth();
    } catch (err) {
      const errMsg =
        err?.data?.message || err?.error || "Failed to flush cache";
      toast.error(errMsg, { id: toastId });
    }
  };

  // Resolved data (either real API response or demo mock)
  const healthData =
    isDemoMode || (hasApiError && !rawHealthData)
      ? mockServerHealth
      : rawHealthData;

  const queueData =
    isDemoMode || (hasApiError && !rawQueueData)
      ? mockQueueAndCache
      : rawQueueData;

  const isLoading =
    (isHealthLoading || isQueueLoading) && !isDemoMode && !hasApiError;
  const isFetching = isHealthFetching || isQueueFetching;

  return (
    <div className="space-y-4 pb-10">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 tracking-tight">
            Server Health & Queue Management
          </h1>
          <p className="text-xs text-gray-500">
            Real-time infrastructure telemetry and BullMQ worker queue control
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          {/* Auto Refresh Segmented Toggle */}
          <div className="inline-flex items-center bg-gray-100 p-0.5 rounded border border-gray-200 text-xs font-mono">
            <span className="px-1.5 text-[11px] text-gray-400 font-sans hidden md:inline">
              Auto:
            </span>
            <button
              onClick={() => setAutoRefreshInterval(0)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                autoRefreshInterval === 0
                  ? "bg-white text-gray-900 font-semibold shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Off
            </button>
            <button
              onClick={() => setAutoRefreshInterval(10000)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                autoRefreshInterval === 10000
                  ? "bg-white text-gray-900 font-semibold shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              10s
            </button>
            <button
              onClick={() => setAutoRefreshInterval(30000)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                autoRefreshInterval === 30000
                  ? "bg-white text-gray-900 font-semibold shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              30s
            </button>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="h-8 px-3 text-xs font-medium border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 rounded transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-gray-500 ${
                isFetching ? "animate-spin" : ""
              }`}
            />
            <span className="hidden sm:inline">
              {isFetching ? "Updating..." : "Refresh"}
            </span>
          </button>

          {/* Fallback Simulation Switch */}
          <button
            onClick={() => setIsDemoMode((prev) => !prev)}
            className={`h-8 px-2.5 text-xs font-mono rounded border transition-colors ${
              isDemoMode
                ? "bg-amber-50 text-amber-800 border-amber-300 font-medium"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
            title="Toggle between live backend and simulation preview"
          >
            {isDemoMode ? "Mode: Demo" : "Mode: Live"}
          </button>
        </div>
      </div>

      {/* Backend API Notice (Subtle, non-disruptive) */}
      {hasApiError && !isDemoMode && (
        <div className="border-l-2 border-amber-500 bg-amber-50/70 p-3 rounded-r text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Backend server-health endpoint returned an error (
              {healthError?.status || queueError?.status || "Offline"}). Showing
              fallback data for UI validation.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleRefresh()}
              className="text-xs font-medium text-amber-900 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <ServerHealthSkeleton />
      ) : (
        <>
          {/* 1. Top Status Summary Bar */}
          <StatusSummaryBar healthData={healthData} queueData={queueData} />

          {/* 2. System Resources Grid */}
          <SystemResourcesGrid
            healthData={healthData}
            queueData={queueData}
            onFlushCache={handleFlushCache}
            isFlushing={isFlushing}
          />

          {/* 3. Background Queues Table */}
          <QueueManagementTable
            queues={queueData?.queues || []}
            onQueueAction={handleQueueAction}
            isExecutingAction={isExecutingAction}
          />
        </>
      )}

      {/* Footer Timestamp */}
      <div className="pt-2 flex justify-between items-center text-[11px] text-gray-400 font-mono">
        <span>Infrastructure Monitor • Norlan Dashboard</span>
        <span>Last Polled: {new Date(lastUpdated).toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

export default ServerHealth;

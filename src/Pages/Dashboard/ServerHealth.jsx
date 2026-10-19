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
import {
  Server,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

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

  // If both endpoints error or return 404, we can auto-enable or offer demo mode
  const hasApiError = isHealthError || isQueueError;

  // Track last updated time
  useEffect(() => {
    if (rawHealthData || rawQueueData) {
      setLastUpdated(new Date().toISOString());
    }
  }, [rawHealthData, rawQueueData]);

  // Handle Manual Refresh
  const handleRefresh = async () => {
    const toastId = toast.loading("Fetching latest server telemetry...");
    try {
      if (isDemoMode) {
        setTimeout(() => {
          setLastUpdated(new Date().toISOString());
          toast.success("Metrics refreshed (Demo Mode)", { id: toastId });
        }, 500);
        return;
      }

      await Promise.all([refetchHealth(), refetchQueue()]);
      setLastUpdated(new Date().toISOString());
      toast.success("Server telemetry updated", { id: toastId });
    } catch (err) {
      toast.error("Failed to refresh telemetry", { id: toastId });
    }
  };

  // Handle Queue Action (Retry, Clean, Pause, Resume)
  const handleQueueAction = async (queueName, action) => {
    const toastId = toast.loading(
      `Executing ${action} on ${queueName === "all" ? "all queues" : queueName}...`
    );

    if (isDemoMode) {
      setTimeout(() => {
        toast.success(
          `Successfully triggered "${action}" on ${queueName} (Demo Mode)`,
          { id: toastId }
        );
      }, 700);
      return;
    }

    try {
      const res = await executeQueueAction({ queueName, action }).unwrap();
      toast.success(
        res?.message || `Queue action "${action}" completed successfully`,
        { id: toastId }
      );
      refetchQueue();
    } catch (err) {
      const errMsg =
        err?.data?.message ||
        err?.error ||
        `Failed to execute ${action} on queue`;
      toast.error(errMsg, { id: toastId });
    }
  };

  // Handle Cache Flush
  const handleFlushCache = async (type = "cache-only") => {
    const toastId = toast.loading(`Flushing ${type} cache...`);

    if (isDemoMode) {
      setTimeout(() => {
        toast.success(
          `App cache flushed successfully (Demo Mode)`,
          { id: toastId }
        );
      }, 700);
      return;
    }

    try {
      const res = await flushCache({ type }).unwrap();
      toast.success(res?.message || "Cache flushed successfully", {
        id: toastId,
      });
      refetchQueue();
      refetchHealth();
    } catch (err) {
      const errMsg =
        err?.data?.message || err?.error || "Failed to flush application cache";
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

  const isLoading = (isHealthLoading || isQueueLoading) && !isDemoMode && !hasApiError;
  const isFetching = isHealthFetching || isQueueFetching;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#CA3939] to-[#DE5555] text-white shadow-md shadow-red-200">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Server Health & Queue Management
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Real-time infrastructure health, resource telemetry & BullMQ queue orchestration
              </p>
            </div>
          </div>
        </div>

        {/* Live mode / Demo simulation toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDemoMode((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isDemoMode
                ? "bg-amber-50 border-amber-300 text-amber-800 shadow-sm"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
            title="Toggle preview with realistic simulation data"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{isDemoMode ? "Demo Mode Active" : "Preview Demo Data"}</span>
          </button>
        </div>
      </div>

      {/* Backend API Warning Banner (if backend API returned error and not explicitly in demo mode) */}
      {hasApiError && !isDemoMode && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <p className="font-bold">
                Backend Server Health API Unreachable or Route Pending Deployment
              </p>
              <p className="text-amber-700 mt-0.5">
                The live API returned an error ({healthError?.status || queueError?.status || "Connection Error"}).
                Displaying interactive fallback metrics so you can test all features and UI interactions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleRefresh()}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry API
            </button>
            <button
              onClick={() => setIsDemoMode(true)}
              className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-semibold shadow-sm transition-all"
            >
              Enable Demo
            </button>
          </div>
        </div>
      )}

      {/* Skeleton while initial loading */}
      {isLoading ? (
        <ServerHealthSkeleton />
      ) : (
        <>
          {/* 1. Top Status Summary Bar */}
          <StatusSummaryBar
            healthData={healthData}
            queueData={queueData}
            isFetching={isFetching}
            onRefresh={handleRefresh}
            autoRefreshInterval={autoRefreshInterval}
            setAutoRefreshInterval={setAutoRefreshInterval}
            lastUpdated={lastUpdated}
          />

          {/* 2. System Resources Grid */}
          <SystemResourcesGrid
            healthData={healthData}
            queueData={queueData}
            onFlushCache={handleFlushCache}
            isFlushing={isFlushing}
          />

          {/* 3. Background Queues Management Table */}
          <QueueManagementTable
            queues={queueData?.queues || []}
            onQueueAction={handleQueueAction}
            isExecutingAction={isExecutingAction}
          />
        </>
      )}
    </div>
  );
};

export default ServerHealth;

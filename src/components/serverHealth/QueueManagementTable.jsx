import React, { useState } from "react";
import {
  Table,
  Badge,
  Dropdown,
  Modal,
  Button,
  Tooltip,
} from "antd";
import {
  RotateCcw,
  Trash2,
  Pause,
  Play,
  MoreVertical,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Clock,
  Zap,
} from "lucide-react";

const QueueManagementTable = ({
  queues = [],
  onQueueAction,
  isExecutingAction,
}) => {
  const [selectedQueueAction, setSelectedQueueAction] = useState(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState(null);

  // Compute aggregated stats
  const totalFailed = queues.reduce(
    (sum, q) => sum + (q?.counts?.failed || 0),
    0
  );
  const totalWaiting = queues.reduce(
    (sum, q) => sum + (q?.counts?.waiting || 0),
    0
  );
  const totalActive = queues.reduce(
    (sum, q) => sum + (q?.counts?.active || 0),
    0
  );
  const totalCompleted = queues.reduce(
    (sum, q) => sum + (q?.counts?.completed || 0),
    0
  );

  const handleAction = (queueName, action) => {
    onQueueAction(queueName, action);
  };

  const handleConfirmBulk = () => {
    if (bulkActionType) {
      onQueueAction("all", bulkActionType);
      setIsBulkModalOpen(false);
      setBulkActionType(null);
    }
  };

  const triggerBulkAction = (action) => {
    setBulkActionType(action);
    setIsBulkModalOpen(true);
  };

  const columns = [
    {
      title: "Queue Name",
      dataIndex: "name",
      key: "name",
      render: (name) => {
        return (
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-gray-100 text-gray-700">
              <Layers className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="font-semibold text-gray-900 block font-mono text-xs sm:text-sm">
                {name}
              </span>
              <span className="text-[11px] text-gray-400 capitalize">
                BullMQ Worker
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "isPaused",
      key: "isPaused",
      align: "center",
      render: (isPaused) => {
        return isPaused ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Paused
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Active
          </span>
        );
      },
    },
    {
      title: "Waiting",
      dataIndex: ["counts", "waiting"],
      key: "waiting",
      align: "center",
      render: (val = 0) => (
        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
          {val.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Active",
      dataIndex: ["counts", "active"],
      key: "active",
      align: "center",
      render: (val = 0) => (
        <span
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
            val > 0
              ? "bg-blue-50 text-blue-700 border border-blue-200 animate-pulse"
              : "bg-gray-50 text-gray-500"
          }`}
        >
          {val.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Completed",
      dataIndex: ["counts", "completed"],
      key: "completed",
      align: "center",
      render: (val = 0) => (
        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
          {val.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Failed",
      dataIndex: ["counts", "failed"],
      key: "failed",
      align: "center",
      render: (val = 0, record) => {
        if (val > 0) {
          return (
            <div className="inline-flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
                {val.toLocaleString()}
              </span>
              <button
                onClick={() => handleAction(record.name, "retry-failed")}
                disabled={isExecutingAction}
                className="px-2 py-0.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50 inline-flex items-center gap-1"
                title="Retry failed jobs in this queue"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </button>
            </div>
          );
        }
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-400">
            0
          </span>
        );
      },
    },
    {
      title: "Delayed",
      dataIndex: ["counts", "delayed"],
      key: "delayed",
      align: "center",
      render: (val = 0) => (
        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-700">
          {val.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, record) => {
        const isPaused = record.isPaused;
        const failedCount = record.counts?.failed || 0;

        const menuItems = [
          {
            key: "retry",
            label: "Retry Failed",
            icon: <RotateCcw className="w-3.5 h-3.5 text-blue-600" />,
            disabled: failedCount === 0 || isExecutingAction,
            onClick: () => handleAction(record.name, "retry-failed"),
          },
          {
            key: "clean-completed",
            label: "Clean Completed",
            icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
            disabled: isExecutingAction,
            onClick: () => handleAction(record.name, "clean-completed"),
          },
          {
            key: "pause-resume",
            label: isPaused ? "Resume Queue" : "Pause Queue",
            icon: isPaused ? (
              <Play className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Pause className="w-3.5 h-3.5 text-amber-600" />
            ),
            disabled: isExecutingAction,
            onClick: () =>
              handleAction(record.name, isPaused ? "resume" : "pause"),
          },
          {
            type: "divider",
          },
          {
            key: "clean-failed",
            label: "Clean Failed",
            icon: <Trash2 className="w-3.5 h-3.5 text-red-600" />,
            danger: true,
            disabled: failedCount === 0 || isExecutingAction,
            onClick: () => handleAction(record.name, "clean-failed"),
          },
        ];

        return (
          <div className="flex items-center justify-center gap-1">
            {/* Quick Pause/Resume button */}
            <Tooltip title={isPaused ? "Resume Queue" : "Pause Queue"}>
              <button
                onClick={() =>
                  handleAction(record.name, isPaused ? "resume" : "pause")
                }
                disabled={isExecutingAction}
                className={`p-1.5 rounded-lg border transition-all active:scale-95 disabled:opacity-50 ${
                  isPaused
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                    : "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
                }`}
              >
                {isPaused ? (
                  <Play className="w-3.5 h-3.5" />
                ) : (
                  <Pause className="w-3.5 h-3.5" />
                )}
              </button>
            </Tooltip>

            {/* Dropdown Menu */}
            <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
              <button
                disabled={isExecutingAction}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 active:scale-95 disabled:opacity-50"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </Dropdown>
          </div>
        );
      },
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      {/* Table Top Header & Bulk Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-gray-900">
              Background Queues (BullMQ)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
              {queues.length} {queues.length === 1 ? "Queue" : "Queues"}
            </span>
            {totalFailed > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold animate-pulse">
                {totalFailed} Failed
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Real-time queue metrics, worker state and dead-letter retry actions
          </p>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => triggerBulkAction("retry-failed")}
            disabled={totalFailed === 0 || isExecutingAction}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-95 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry All Failed</span>
            {totalFailed > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                {totalFailed}
              </span>
            )}
          </button>

          <button
            onClick={() => triggerBulkAction("clean-completed")}
            disabled={totalCompleted === 0 || isExecutingAction}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 active:scale-95 text-gray-700 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Clean All Completed</span>
          </button>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <Table
          dataSource={queues.map((q) => ({ ...q, key: q.name }))}
          columns={columns}
          pagination={false}
          size="middle"
          rowClassName="hover:bg-gray-50/70 transition-colors"
        />
      </div>

      {/* BULK ACTION CONFIRMATION MODAL */}
      <Modal
        centered
        open={isBulkModalOpen}
        onCancel={() => {
          setIsBulkModalOpen(false);
          setBulkActionType(null);
        }}
        onOk={handleConfirmBulk}
        confirmLoading={isExecutingAction}
        okText={
          bulkActionType === "retry-failed"
            ? "Retry All Failed Jobs"
            : "Clean All Completed Jobs"
        }
        cancelText="Cancel"
        okButtonProps={{
          style: {
            backgroundColor:
              bulkActionType === "retry-failed" ? "#DE5555" : "#10B981",
            borderColor:
              bulkActionType === "retry-failed" ? "#DE5555" : "#10B981",
            fontWeight: "bold",
          },
        }}
      >
        <div className="pt-2">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`p-3 rounded-2xl ${
                bulkActionType === "retry-failed"
                  ? "bg-red-100 text-red-600"
                  : "bg-emerald-100 text-emerald-600"
              }`}
            >
              {bulkActionType === "retry-failed" ? (
                <RotateCcw className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {bulkActionType === "retry-failed"
                  ? "Retry All Failed Jobs?"
                  : "Clean All Completed Jobs?"}
              </h3>
              <p className="text-xs text-gray-500">
                Target: All active queues
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            {bulkActionType === "retry-failed"
              ? `This will move all failed jobs across all BullMQ queues back into the waiting state for re-processing (${totalFailed} failed jobs).`
              : "This will remove and purge all completed jobs across all queues from Redis storage to free up memory."}
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default QueueManagementTable;

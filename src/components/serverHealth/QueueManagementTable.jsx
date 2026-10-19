import React, { useState } from "react";
import { Table, Dropdown, Modal, Tooltip } from "antd";
import {
  RotateCcw,
  Trash2,
  Pause,
  Play,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const QueueManagementTable = ({
  queues = [],
  onQueueAction,
  isExecutingAction,
}) => {
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
      title: "Queue",
      dataIndex: "name",
      key: "name",
      width: 220,
      render: (name) => {
        return (
          <div className="flex flex-col">
            <span className="font-mono text-xs font-semibold text-gray-900">
              {name}
            </span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">
              BullMQ Worker
            </span>
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "isPaused",
      key: "isPaused",
      width: 110,
      align: "center",
      render: (isPaused) => {
        return isPaused ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Paused
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Active
          </span>
        );
      },
    },
    {
      title: "Waiting",
      dataIndex: ["counts", "waiting"],
      key: "waiting",
      align: "right",
      render: (val = 0) => (
        <span className="font-mono text-xs text-gray-700">
          {val.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Active",
      dataIndex: ["counts", "active"],
      key: "active",
      align: "right",
      render: (val = 0) => (
        <span
          className={`font-mono text-xs ${
            val > 0 ? "font-semibold text-blue-700" : "text-gray-400"
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
      align: "right",
      render: (val = 0) => (
        <span className="font-mono text-xs text-gray-700">
          {val.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Failed",
      dataIndex: ["counts", "failed"],
      key: "failed",
      align: "right",
      render: (val = 0, record) => {
        if (val > 0) {
          return (
            <div className="inline-flex items-center gap-1.5 justify-end">
              <span className="px-1.5 py-0.5 rounded text-[11px] font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200">
                {val.toLocaleString()}
              </span>
              <button
                onClick={() => handleAction(record.name, "retry-failed")}
                disabled={isExecutingAction}
                className="h-5 px-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                title="Retry failed jobs"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Retry
              </button>
            </div>
          );
        }
        return <span className="font-mono text-xs text-gray-400">0</span>;
      },
    },
    {
      title: "Delayed",
      dataIndex: ["counts", "delayed"],
      key: "delayed",
      align: "right",
      render: (val = 0) => (
        <span className="font-mono text-xs text-gray-700">
          {val.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: 100,
      render: (_, record) => {
        const isPaused = record.isPaused;
        const failedCount = record.counts?.failed || 0;

        const menuItems = [
          {
            key: "retry",
            label: "Retry Failed",
            icon: <RotateCcw className="w-3.5 h-3.5 text-gray-600" />,
            disabled: failedCount === 0 || isExecutingAction,
            onClick: () => handleAction(record.name, "retry-failed"),
          },
          {
            key: "clean-completed",
            label: "Clean Completed",
            icon: <CheckCircle2 className="w-3.5 h-3.5 text-gray-600" />,
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
            icon: <Trash2 className="w-3.5 h-3.5 text-rose-600" />,
            danger: true,
            disabled: failedCount === 0 || isExecutingAction,
            onClick: () => handleAction(record.name, "clean-failed"),
          },
        ];

        return (
          <div className="flex items-center justify-center gap-1">
            <Tooltip title={isPaused ? "Resume" : "Pause"}>
              <button
                onClick={() =>
                  handleAction(record.name, isPaused ? "resume" : "pause")
                }
                disabled={isExecutingAction}
                className="h-7 w-7 rounded border border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-600 flex items-center justify-center transition-colors disabled:opacity-40"
              >
                {isPaused ? (
                  <Play className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Pause className="w-3 h-3 text-amber-600" />
                )}
              </button>
            </Tooltip>

            <Dropdown
              menu={{ items: menuItems }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <button
                disabled={isExecutingAction}
                className="h-7 w-7 rounded border border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-600 flex items-center justify-center transition-colors disabled:opacity-40"
              >
                <MoreVertical className="w-3 h-3" />
              </button>
            </Dropdown>
          </div>
        );
      },
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Table Header Bar */}
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900">
              Background Queues
            </h2>
            <span className="px-1.5 py-0.5 rounded text-xs font-mono font-medium bg-gray-100 border border-gray-200 text-gray-700">
              {queues.length}
            </span>
          </div>
          {/* Quick Aggregate Indicators */}
          <div className="flex items-center gap-3 text-xs text-gray-500 font-mono mt-1">
            <span>Waiting: {totalWaiting.toLocaleString()}</span>
            <span>•</span>
            <span className={totalActive > 0 ? "text-blue-700 font-semibold" : ""}>
              Active: {totalActive.toLocaleString()}
            </span>
            <span>•</span>
            <span>Completed: {totalCompleted.toLocaleString()}</span>
            <span>•</span>
            <span
              className={
                totalFailed > 0
                  ? "text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200"
                  : ""
              }
            >
              Failed: {totalFailed.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerBulkAction("retry-failed")}
            disabled={totalFailed === 0 || isExecutingAction}
            className="h-8 px-3 text-xs font-medium rounded bg-[#de5555] hover:bg-[#ca3939] active:bg-[#b83030] text-white transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-none"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry All Failed</span>
            {totalFailed > 0 && (
              <span className="font-mono text-[10px] px-1 py-0.2 bg-white/20 rounded">
                {totalFailed}
              </span>
            )}
          </button>

          <button
            onClick={() => triggerBulkAction("clean-completed")}
            disabled={totalCompleted === 0 || isExecutingAction}
            className="h-8 px-3 text-xs font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-none"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-gray-500" />
            <span>Clean Completed</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <Table
          dataSource={queues.map((q) => ({ ...q, key: q.name }))}
          columns={columns}
          pagination={false}
          size="small"
          bordered={false}
          className="enterprise-table"
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
        title={
          <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>
              {bulkActionType === "retry-failed"
                ? "Retry All Failed Queue Jobs"
                : "Clean All Completed Queue Jobs"}
            </span>
          </div>
        }
        okText={
          bulkActionType === "retry-failed"
            ? "Retry All Failed"
            : "Clean Completed"
        }
        cancelText="Cancel"
        okButtonProps={{
          className: `!h-8 !px-3 !text-xs !font-medium !rounded !border-transparent ${
            bulkActionType === "retry-failed"
              ? "!bg-[#de5555] hover:!bg-[#ca3939]"
              : "!bg-gray-800 hover:!bg-gray-900"
          }`,
        }}
        cancelButtonProps={{
          className:
            "!h-8 !px-3 !text-xs !font-medium !rounded !border-gray-300 !text-gray-700 hover:!bg-gray-50",
        }}
      >
        <div className="py-2">
          <p className="text-xs text-gray-600 leading-relaxed">
            {bulkActionType === "retry-failed"
              ? `This operation will requeue all ${totalFailed} failed jobs across all active BullMQ queues back into the waiting state for reprocessing.`
              : "This operation will purge completed job records across all queues to free up Redis storage. Job histories will be removed."}
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default QueueManagementTable;

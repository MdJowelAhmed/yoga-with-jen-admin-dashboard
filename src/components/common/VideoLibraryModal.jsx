import React, { useEffect, useState } from "react";
import { Modal, Button, Table, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { getVideoAndThumbnail } from "./imageUrl";
import Thumbnail from "../videoManagement/Thumbnail";

const VideoLibraryModal = ({
  visible,
  onCancel,
  onSelectVideo,
  onSelectMultiple,
  availableVideos = [],
  loading = false,
  pagination = { current: 1, pageSize: 10, total: 0 },
  onPaginationChange,
  title = "Video Library",
  selectButtonText = "Add Video",
  multiSelect = false,
  pageSizeOptions = ["10", "20", "50", "100"],
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);

  useEffect(() => {
    if (!visible) {
      setSelectedRowKeys([]);
      setSelectedVideos([]);
    }
  }, [visible]);

  const handlePaginationChange = (page, size) => {
    if (onPaginationChange) {
      onPaginationChange(page, size);
    }
    setSelectedRowKeys([]);
    setSelectedVideos([]);
  };

  const handleSelectVideo = (video) => {
    if (onSelectVideo) {
      onSelectVideo(video);
    }
  };

  const handleAddSelected = () => {
    if (!selectedVideos.length) return;
    if (onSelectMultiple) {
      onSelectMultiple(selectedVideos);
      setSelectedRowKeys([]);
      setSelectedVideos([]);
    }
  };

  const rowSelection = multiSelect
    ? {
        selectedRowKeys,
        onChange: (keys, rows) => {
          setSelectedRowKeys(keys);
          setSelectedVideos(rows);
        },
        getCheckboxProps: (record) => ({
          name: record.title,
        }),
      }
    : undefined;

  // Same layout as Category video library modal
  const videoColumns = [
    {
      title: "Video",
      dataIndex: "title",
      key: "video",
      width: "20%",
      render: (_, record) => (
        <div className="flex items-center">
          {record.thumbnailUrl && (
            <Thumbnail
              thumbnailUrl={getVideoAndThumbnail(record.thumbnailUrl)}
              alt={record.title || "Thumbnail"}
              style={{ width: 80, height: 45, objectFit: "cover" }}
              className="mr-3 rounded"
            />
          )}
        </div>
      ),
    },
    {
      title: "Title",
      key: "title",
      width: "60%",
      render: (_, record) => (
        <div>
          <p className="font-medium max-w-[400px] overflow-hidden text-ellipsis whitespace-nowrap">
            {record.title || "Untitled Video"}
          </p>
          {record.duration && (
            <p className="text-xs text-gray-500">
              Duration: {record.duration}
            </p>
          )}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: "20%",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => handleSelectVideo(record)}
          className="bg-primary text-white h-10"
        >
          {selectButtonText}
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      footer={
        <div className="flex justify-between items-center">
          <div>
            {multiSelect && selectedVideos.length > 0 && (
              <span className="text-sm text-gray-600">
                {selectedVideos.length} video(s) selected
              </span>
            )}
          </div>
          <Space>
            <Button onClick={onCancel} className="text-black h-10">
              Cancel
            </Button>
            {multiSelect && (
              <Button
                type="primary"
                onClick={handleAddSelected}
                disabled={selectedVideos.length === 0}
                icon={<PlusOutlined />}
                className="bg-primary text-white h-10"
              >
                Add Selected Videos ({selectedVideos.length})
              </Button>
            )}
          </Space>
        </div>
      }
      width={800}
    >
      <div style={{ width: "100%" }}>
        <Table
          columns={videoColumns}
          dataSource={availableVideos}
          rowKey="_id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} videos`,
            onChange: handlePaginationChange,
            onShowSizeChange: handlePaginationChange,
          }}
          locale={{ emptyText: "No videos found" }}
          scroll={{ x: "max-content" }}
          style={{ width: "100%" }}
          tableLayout="auto"
          size="middle"
          className="custom-table"
        />
      </div>
    </Modal>
  );
};

export default VideoLibraryModal;

import React, { useState, useEffect } from "react";
import {
  useGetTodayPlaylistQuery,
  useAddVideosToTodayPlaylistMutation,
  useUpdateTodayPlaylistOrderMutation,
  useDeleteTodayPlaylistVideoMutation,
} from "../../redux/apiSlices/todayPlaylistApi";
import { useGetAllVideosQuery } from "../../redux/apiSlices/videoApi";
import { Button, Modal, Space, Table, message } from "antd";
import {
  CalendarOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import GradientButton from "../common/GradiantButton";
import DragDropList from "../common/DragDropList";
import { getVideoAndThumbnail } from "../common/imageUrl";
import VideoDetailsModal from "../retailerManagement/VideoDetailsModal";
import VideoLibraryModal from "../common/VideoLibraryModal";
import Thumbnail from "../videoManagement/Thumbnail";

const getVideoId = (item) => {
  if (typeof item?.videoMongoId === "string") return item.videoMongoId;
  if (item?.videoId && typeof item.videoId === "object") return item.videoId._id;
  if (typeof item?.videoId === "string") return item.videoId;
  if (item?.video?._id) return item.video._id;
  return undefined;
};

const TodayVideoManagement = () => {
  const [deleteTodayPlaylistVideo] = useDeleteTodayPlaylistVideoMutation();
  const [updateTodayPlaylistOrder] = useUpdateTodayPlaylistOrderMutation();
  const [addVideosToTodayPlaylist] = useAddVideosToTodayPlaylistMutation();

  const [libraryModalVisible, setLibraryModalVisible] = useState(false);
  const [localPlaylistVideos, setLocalPlaylistVideos] = useState([]);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);
  const [viewMode, setViewMode] = useState("table");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const [modalPageSize, setModalPageSize] = useState(10);

  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedVideoDetails, setSelectedVideoDetails] = useState(null);

  useEffect(() => {
    if (viewMode === "drag") {
      setPageSize(100);
      setCurrentPage(1);
    } else {
      setPageSize(10);
      setCurrentPage(1);
    }
  }, [viewMode]);

  const queryParams = [
    { name: "limit", value: pageSize },
    { name: "page", value: currentPage },
  ];

  const {
    data: allVideosData,
    isLoading: allVideosLoading,
    refetch: refetchAllVideos,
  } = useGetAllVideosQuery([
    { name: "limit", value: modalPageSize },
    { name: "page", value: modalCurrentPage },
  ]);

  const {
    data: playlistData,
    isLoading: playlistLoading,
    refetch: refetchPlaylist,
  } = useGetTodayPlaylistQuery(queryParams);

  const playlistVideos = Array.isArray(playlistData?.data)
    ? playlistData.data
    : [];
  const allVideos = Array.isArray(allVideosData?.data) ? allVideosData.data : [];
  const allVideosPagination = allVideosData?.pagination || {};

  useEffect(() => {
    if (playlistVideos.length > 0) {
      const sorted = [...playlistVideos].sort(
        (a, b) => (a.serial || 0) - (b.serial || 0)
      );
      setLocalPlaylistVideos(sorted);
      setHasOrderChanges(false);
    } else {
      setLocalPlaylistVideos([]);
      setHasOrderChanges(false);
    }
  }, [playlistVideos]);

  const handleModalPaginationChange = (page, size) => {
    setModalCurrentPage(page);
    setModalPageSize(size);
  };

  const VideoCard = ({
    video,
    onView,
    onDelete,
    isDragging,
    serialNumber,
  }) => (
    <div
      className={`bg-white rounded-lg shadow-md p-4 mb-4 border transition-all duration-200 ${
        isDragging ? "opacity-50 transform rotate-2" : "hover:shadow-lg"
      }`}
      style={{
        cursor: "grab",
        border: isDragging ? "2px dashed #1890ff" : "1px solid #e8e8e8",
      }}
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
          {serialNumber || "#"}
        </div>

        <div className="flex-shrink-0">
          <Thumbnail
            thumbnailUrl={getVideoAndThumbnail(video.thumbnailUrl)}
            alt={video.title}
            className="w-20 h-12 object-cover rounded"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {video.title}
          </h3>
          {video.duration && (
            <p className="text-sm text-gray-500 truncate">{video.duration}</p>
          )}
        </div>

        <div className="flex-shrink-0">
          <Space size="small">
            <Button
              type="text"
              icon={<EyeOutlined style={{ color: "#55f" }} />}
              onClick={() => onView(video)}
              title="View Video Details"
            />
            <Button
              type="text"
              icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
              onClick={() => onDelete(video._id)}
              title="Delete Video"
            />
          </Space>
        </div>
      </div>
    </div>
  );

  const handleReorder = (reorderedVideos) => {
    setLocalPlaylistVideos(reorderedVideos);
    setHasOrderChanges(true);
  };

  // Save Order (shuffle) → PATCH /today/playlist/order { videoIds: [...] }
  const handleUpdateOrder = async (orderData) => {
    try {
      const orderedList =
        Array.isArray(orderData) && orderData.length
          ? orderData
              .map((row) =>
                localPlaylistVideos.find((item) => item._id === row._id)
              )
              .filter(Boolean)
          : localPlaylistVideos;

      const videoIds = orderedList
        .map((item) => getVideoId(item))
        .filter((id) => typeof id === "string" && id.length > 0);

      if (!videoIds.length) {
        message.error("No videos found to update order");
        return;
      }

      await updateTodayPlaylistOrder({ videoIds }).unwrap();

      message.success("Video order updated successfully!");
      setHasOrderChanges(false);
      await refetchPlaylist();
    } catch (error) {
      message.error(
        error?.data?.message || "Failed to update video order"
      );
      console.error("Update order error:", error);
    }
  };

  const showDetailsModal = (item) => {
    const details =
      item?.videoId && typeof item.videoId === "object"
        ? { ...item.videoId, ...item }
        : item;
    setSelectedVideoDetails(details);
    setDetailsModalVisible(true);
  };

  const handleDeleteItem = async (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this video?",
      content: "This will remove the video from Today's playlist.",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await deleteTodayPlaylistVideo(id).unwrap();
          message.success("Video removed successfully");
          await refetchPlaylist();
        } catch (error) {
          message.error("Failed to remove video");
        }
      },
    });
  };

  const handleAddSingleVideo = async (video) => {
    try {
      if (!video?._id) {
        message.error("Video is required");
        return;
      }

      await addVideosToTodayPlaylist({ videoIds: [video._id] }).unwrap();
      message.success("Video added to Today's playlist successfully!");

      await refetchPlaylist();
      await refetchAllVideos();
    } catch (error) {
      console.error("Failed to add video:", error);
      message.error(
        error?.data?.message || "Failed to add video to Today's playlist"
      );
    }
  };

  const handleAddMultipleVideos = async (selectedVideos) => {
    if (!selectedVideos?.length) {
      message.warning("Please select at least one video");
      return;
    }

    try {
      const videoIds = selectedVideos.map((video) => video._id);
      await addVideosToTodayPlaylist({ videoIds }).unwrap();
      message.success(
        `${selectedVideos.length} video(s) added to Today's playlist successfully!`
      );
      setLibraryModalVisible(false);
      setModalCurrentPage(1);
      await refetchPlaylist();
      await refetchAllVideos();
    } catch (error) {
      console.error("Failed to add videos:", error);
      message.error(
        error?.data?.message || "Failed to add videos to Today's playlist"
      );
    }
  };

  const playlistColumns = React.useMemo(
    () => [
      {
        title: "SL",
        key: "id",
        width: 70,
        align: "center",
        render: (text, record, index) => {
          const actualIndex = (currentPage - 1) * pageSize + index + 1;
          return `# ${actualIndex}`;
        },
      },
      {
        title: "Video",
        dataIndex: "title",
        key: "video",
        align: "center",
        render: (_, record) => (
          <div className="flex justify-center">
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
        dataIndex: "title",
        key: "title",
        align: "center",
      },
      {
        title: "Duration",
        dataIndex: "duration",
        key: "duration",
        align: "center",
      },
      {
        title: "Action",
        key: "action",
        align: "center",
        render: (_, record) => (
          <Space size="small">
            <Button
              type="text"
              icon={<EyeOutlined style={{ color: "#55f" }} />}
              onClick={() => showDetailsModal(record)}
            />
            <Button
              type="text"
              icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
              onClick={() => handleDeleteItem(record._id)}
            />
          </Space>
        ),
      },
    ],
    [currentPage, pageSize]
  );

  return (
    <div className="w-full">
      <div className="mb-6 flex justify-end">
        <div>
          <button
            onClick={() => setViewMode(viewMode === "table" ? "drag" : "table")}
            className="py-2 rounded-md px-4 border-none mr-2 bg-primary text-white hover:bg-secondary"
          >
            {viewMode === "table" ? "Do Shuffle" : "Table Mode"}
          </button>
        </div>

        <GradientButton
          onClick={() => setLibraryModalVisible(true)}
          icon={<CalendarOutlined />}
          className="ml-2"
        >
          Video Library
        </GradientButton>
      </div>

      {viewMode === "table" ? (
        <div className="border-2 rounded-lg">
          <Table
            columns={playlistColumns}
            dataSource={localPlaylistVideos}
            rowKey="_id"
            loading={playlistLoading}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: playlistData?.pagination?.total || 0,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
            }}
            scroll={{ x: "max-content" }}
            className="custom-table"
            size="middle"
          />
        </div>
      ) : (
        <DragDropList
          items={localPlaylistVideos}
          onReorder={handleReorder}
          onUpdateOrder={handleUpdateOrder}
          hasChanges={hasOrderChanges}
          renderItem={(video, index, draggedItem) => (
            <VideoCard
              video={video}
              onView={showDetailsModal}
              onDelete={handleDeleteItem}
              isDragging={draggedItem?._id === video._id}
              serialNumber={video.serial || index + 1}
            />
          )}
        />
      )}

      <VideoLibraryModal
        visible={libraryModalVisible}
        onCancel={() => {
          setLibraryModalVisible(false);
          setModalCurrentPage(1);
        }}
        multiSelect
        onSelectVideo={handleAddSingleVideo}
        onSelectMultiple={handleAddMultipleVideos}
        availableVideos={allVideos}
        loading={allVideosLoading}
        pagination={{
          current: modalCurrentPage,
          pageSize: modalPageSize,
          total: allVideosPagination.total || 0,
        }}
        onPaginationChange={handleModalPaginationChange}
        title="Video Library — Today's Video"
        selectButtonText="Add Video"
        pageSizeOptions={["10", "20", "50", "100"]}
      />

      <VideoDetailsModal
        visible={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedVideoDetails(null);
        }}
        currentVideo={selectedVideoDetails}
      />
    </div>
  );
};

export default TodayVideoManagement;

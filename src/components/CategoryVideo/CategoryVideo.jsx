import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Table,
  Button,
  Modal,
  Space,
  Switch,
  Dropdown,
  Menu,
  message,
  Tag,
  Input,
  Select,
} from "antd";
import {
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  DownOutlined,
  PlusOutlined,
  CalendarOutlined,
  SaveOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import moment from "moment/moment";
import {
  useDeleteCategoryVideoMutation,
  useGetByCategoryAllVideosQuery,
  useGetCategoryQuery,
  useGetCategoryVideoDetailsQuery,
  useUpdateVideoOrderInCategoryMutation,
  useVideoAddInCategoryMutation,
} from "../../redux/apiSlices/categoryApi";
import {
  useDeleteVideoMutation,
  useGetAllVideosQuery,
  useGetVideoByIdQuery,
  useUpdateVideoStatusMutation,
  useUpdateVideoOrderMutation,
  useUpdateVideoINCategoryAndSubcategoryMutation,
} from "../../redux/apiSlices/videoApi";
import { useScheduleDailyInspirationMutation } from "../../redux/apiSlices/dailyInspiraton";
import { Filtering } from "../common/Svg";
import Spinner from "../common/Spinner";
import GradientButton from "../common/GradiantButton";
// import EditVideoModal from "./EditVideoModal";
// import VideoDetailsModal from "../retailerManagement/VideoDetailsModal";
import DragDropList from "../common/DragDropList";
import { getVideoAndThumbnail } from "../common/imageUrl";
import EditVideoModal from "./EditVideoModal";
import VideoDetailsModal from "../videoManagement/VideoDetailsModal";
import Thumbnail from "../videoManagement/Thumbnail";
import DebouncedSearch from "../common/DebouncedSearch";

const { Search } = Input;
const { Option } = Select;

const CategoryVideos = () => {
  const { categoryId } = useParams();

  // Modal and editing states
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [equipmentTags, setEquipmentTags] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Drag and drop states
  const [localVideos, setLocalVideos] = useState([]);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // "table" or "drag"

  // Filters and pagination for main table
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal filters and pagination
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const [modalPageSize, setModalPageSize] = useState(10);
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [modalCategoryFilter, setModalCategoryFilter] = useState("all");

  // Update pageSize based on viewMode
useEffect(() => {
  if (viewMode === "drag") {
    setPageSize(1000); // Drag mode e 100 items per page
    setCurrentPage(1); // Reset to first page
  } else {
    setPageSize(10); // Table mode e 10 items per page
    setCurrentPage(1); // Reset to first page
  }
}, [viewMode]);

  // API calls
  const {
    data,
    isLoading: isLoadingVideos,
    refetch,
  } = useGetByCategoryAllVideosQuery({
    id: categoryId,
    page: currentPage,
    limit: pageSize,
    searchTerm: searchTerm || undefined,
  });
  const { data: categoryData } = useGetCategoryQuery();
  const categories = categoryData?.data || [];

  // Enhanced API call for all videos with pagination and filters
  const queryParams = [
    { name: "limit", value: modalPageSize },
    { name: "page", value: modalCurrentPage },
  ];

  if (modalSearchTerm) {
    queryParams.push({ name: "search", value: modalSearchTerm });
  }

  if (modalCategoryFilter !== "all") {
    queryParams.push({ name: "category", value: modalCategoryFilter });
  }

  const { data: allVideosData, isLoading: allVideosLoading } =
    useGetAllVideosQuery(queryParams);

  const TotalVideo = allVideosData?.data || [];
  const allVideosPagination = allVideosData?.pagination;

  // Schedule API
  const [videoAddInCategory] = useVideoAddInCategoryMutation();

  const allVideos = data?.data?.videos || [];
  const paginationData = data?.data?.meta || {
    total: allVideosPagination?.total || 0,
    page: 1,
    limit: 10,
    totalPage: 1,
  };
  // Use localVideos if available, otherwise use allVideos
  const videosToUse = localVideos.length > 0 ? localVideos : allVideos;

  // Filter videos based on filters
  const filteredVideos = videosToUse.filter((video) => {
    const statusMatch = statusFilter === "all" || video.status === statusFilter;
    const typeMatch = typeFilter === "all" || video.type === typeFilter;
    return statusMatch && typeMatch;
  });

  // Paginate filtered videos
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedVideos = filteredVideos.slice(startIndex, endIndex);
  // const totalVideos = paginatedVideos;

  // Fetch single video data when editingId is set
  const { data: videoDetail } = useGetCategoryVideoDetailsQuery(editingId, {
    skip: !editingId,
  });
  const videoDetails = videoDetail?.data;
  const [deleteCategoryVideo] = useDeleteCategoryVideoMutation();
  const [updateVideoStatus] = useUpdateVideoStatusMutation();
  const [updateVideoINCategoryAndSubcategory, { isLoading }] =
    useUpdateVideoINCategoryAndSubcategoryMutation();

  const [updateVideoOrderInCategory] = useUpdateVideoOrderInCategoryMutation();

  // Update currentVideo and equipmentTags whenever videoDetails or editingId changes
  useEffect(() => {
    if (editingId && videoDetails) {
      setCurrentVideo({
        ...videoDetails,
        id: videoDetails._id || videoDetails.id,
      });
      setEquipmentTags(videoDetails.equipment || []);
    } else if (!editingId) {
      setCurrentVideo(null);
      setEquipmentTags([]);
    }
  }, [editingId, videoDetails]);

  // Reset page on filter / search change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter, searchTerm]);

  const handleSearch = (value) => {
    setSearchTerm(value || "");
  };

  // Update local videos when allVideos changes
  useEffect(() => {
    if (allVideos.length > 0) {
      const sortedVideos = [...allVideos].sort(
        (a, b) => (a.serial || 0) - (b.serial || 0)
      );
      setLocalVideos(sortedVideos);
      setHasOrderChanges(false);
    }
  }, [allVideos]);

  // Reset modal pagination when filters change
  useEffect(() => {
    setModalCurrentPage(1);
  }, [modalSearchTerm, modalCategoryFilter]);


  // VideoCard component for drag and drop view
  const VideoCard = ({
    video,
    onEdit,
    onView,
    onDelete,
    onStatusChange,
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
        {/* Serial Number */}
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
          {serialNumber || "#"}
        </div>

        {/* Thumbnail */}
        <div className="flex-shrink-0">
          <Thumbnail
            thumbnailUrl={getVideoAndThumbnail(video.thumbnailUrl)}
            alt={video.title}
            className="w-20 h-12 object-cover rounded"
          />
        </div>

        {/* Video Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {video.title}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Duration: {video.duration}</span>
            <span>Category: {video.category}</span>
            <span>Created: {moment(video.createdAt).format("L")}</span>
          </div>
        </div>

        {/* Status */}
        <div className="flex-shrink-0">
          <Tag
            color={video.status?.toLowerCase() === "active" ? "green" : "red"}
          >
            {video.status?.toUpperCase()}
          </Tag>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0">
          <Space size="small">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: "#f55" }} />}
              onClick={() => onEdit(video)}
              title="Edit Video"
            />
            <Button
              type="text"
              icon={<EyeOutlined style={{ color: "#55f" }} />}
              onClick={() => onView(video)}
              title="View Video Details"
            />
            {/* <Switch
              size="small"
              checked={video.status === "active"}
              onChange={(checked) => onStatusChange(checked, video)}
              style={{
                backgroundColor: video.status === "active" ? "red" : "gray",
              }}
            /> */}
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

  // Show form modal for add or edit
  const showFormModal = (record = null) => {
    if (record) {
      setEditingId(record._id);
      // currentVideo & equipmentTags will update automatically via useEffect above
    } else {
      setEditingId(null);
    }
    setIsFormModalVisible(true);
  };

  // Show details modal and set editingId to fetch video details
  const showDetailsModal = (record) => {
    setEditingId(record._id);
    setIsDetailsModalVisible(true);
  };

  // Close form modal and reset states
  const closeFormModal = () => {
    setIsFormModalVisible(false);
    setEditingId(null);
    setCurrentVideo(null);
    setEquipmentTags([]);
  };

  // Close details modal and reset states
  const closeDetailsModal = () => {
    setIsDetailsModalVisible(false);
    setEditingId(null);
    setCurrentVideo(null);
    setEquipmentTags([]);
  };

  // Close schedule modal
  const closeScheduleModal = () => {
    setIsScheduleModalVisible(false);
    setSelectedVideos([]);
    setSelectedRowKeys([]);
    // Reset modal filters and pagination
    setModalCurrentPage(1);
    setModalPageSize(10);
    setModalSearchTerm("");
    setModalCategoryFilter("all");
  };

  // After form submission, close modal and refresh list
  const handleFormSubmit = async () => {
    closeFormModal();
    await refetch();
  };

  // Delete video with confirmation
  const handleDeleteVideo = (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this video?",
      content: "This action cannot be undone.",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await deleteCategoryVideo(id).unwrap();
          message.success("Video deleted successfully");
          refetch();
        } catch {
          message.error("Failed to delete video");
        }
      },
    });
  };

  // Change video status with confirmation
  const handleStatusChange = (checked, record) => {
    const newStatus = checked ? "active" : "inactive";
    Modal.confirm({
      title: `Are you sure you want to set the status to "${newStatus}"?`,
      okText: "Yes",
      cancelText: "No",
      okButtonProps: { style: { backgroundColor: "red", borderColor: "red" } },
      onOk: async () => {
        try {
          await updateVideoStatus({
            id: record._id,
            ...record,
            status: newStatus,
          }).unwrap();
          message.success(`Video status updated to ${newStatus}`);
          refetch();
        } catch {
          message.error("Failed to update video status");
        }
      },
    });
  };

  // Handle adding single video to category
  const handleAddToSchedule = async (video) => {
    try {
      if (!video || !categoryId) {
        message.error("Video or category ID is missing");
        return;
      }

      const scheduleData = {
        videoIds: [video._id],
        categoryId: categoryId,
      };

      await videoAddInCategory(scheduleData);
      message.success("Video added to category successfully!");
    } catch (error) {
      console.error("Failed to add video to category:", error);
      message.error("Failed to add video to category");
    }
  };

  // Handle adding multiple selected videos
  const handleAddSelectedVideos = async () => {
    if (selectedVideos.length === 0) {
      message.warning("Please select at least one video");
      return;
    }

    try {
      const videoIds = selectedVideos.map((video) => video._id);
      const scheduleData = {
        videoIds: videoIds,
        categoryId: categoryId,
      };

      await videoAddInCategory(scheduleData);
      message.success(
        `${selectedVideos.length} videos added to category successfully!`
      );
      setSelectedVideos([]);
      setSelectedRowKeys([]);
      setIsScheduleModalVisible(false);
    } catch (error) {
      console.error("Failed to add videos to category:", error);
      message.error("Failed to add videos to category");
    }
  };

  // Handle video reordering (local state only)
  const handleReorder = (reorderedVideos) => {
    setLocalVideos(reorderedVideos);
    setHasOrderChanges(true);
  };

  // Handle actual order update to server
  const handleUpdateOrder = async (orderData) => {
    try {
      // Use provided orderData or create from localVideos
      const dataToSend =
        orderData ||
        localVideos.map((video, index) => ({
          _id: video._id,
          serial: index + 1, // Update serial based on new order
        }));

      await updateVideoOrderInCategory(dataToSend).unwrap();

      message.success("Video order updated successfully!");
      setHasOrderChanges(false);
      await refetch();
    } catch (error) {
      message.error("Failed to update video order");
      console.error("Update order error:", error);
    }
  };

  // Pagination handler for main table
  const handleTableChange = (paginationConfig) => {
    setCurrentPage(paginationConfig.current);
    setPageSize(paginationConfig.pageSize);
    // Refetch data when pagination changes
    refetch();
  };

  // Pagination handler for modal table
  const handleModalPaginationChange = (page, size) => {
    setModalCurrentPage(page);
    setModalPageSize(size);
    // Clear selections when page changes
    setSelectedVideos([]);
    setSelectedRowKeys([]);
  };

  // Filter handlers
  const handleStatusFilter = (status) => setStatusFilter(status.toLowerCase());
  const handleTypeFilter = (type) => setTypeFilter(type.toLowerCase());

  // Modal filter handlers
  const handleModalSearch = (value) => {
    setModalSearchTerm(value);
  };

  const handleModalCategoryFilter = (value) => {
    setModalCategoryFilter(value);
  };

  // Clear all modal filters
  const clearModalFilters = () => {
    setModalSearchTerm("");
    setModalCategoryFilter("all");
    setModalCurrentPage(1);
  };

  // Filter menus
  const statusMenu = (
    <Menu>
      <Menu.Item key="all" onClick={() => handleStatusFilter("all")}>
        All Status
      </Menu.Item>
      <Menu.Item key="active" onClick={() => handleStatusFilter("active")}>
        Active
      </Menu.Item>
      <Menu.Item key="inactive" onClick={() => handleStatusFilter("inactive")}>
        Inactive
      </Menu.Item>
    </Menu>
  );

  // Row selection configuration for schedule modal
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRowKeys(selectedRowKeys);
      setSelectedVideos(selectedRows);
    },
    getCheckboxProps: (record) => ({
      disabled: false,
      name: record.title,
    }),
  };

  // Schedule Modal Video Columns
  const scheduleVideoColumns = [
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
          <p className="font-medium max-w-[400px] overflow-hidden text-ellipsis whitespace-nowrap">{record.title || "Untitled Video"}</p>
          {record.duration && (
            <p className="text-xs text-gray-500">Duration: {record.duration}</p>
          )}
        </div>
      ),
    },
    // {
    //   title: "Category",
    //   dataIndex: "category",
    //   key: "category",
    //   width: "25%",
    //   render: (category) => <Tag color="blue">{category || "No Category"}</Tag>,
    // },
    {
      title: "Actions",
      key: "actions",
      width: "20%",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => handleAddToSchedule(record)}
          className="bg-primary text-white h-10"
        >
          Add Video
        </Button>
      ),
    },
  ];

  // Table columns
  const columns = [
    {
      title: "SL",
      key: "id",
      width: 70,
      align: "center",
      render: (_, __, index) => `# ${(currentPage - 1) * pageSize + index + 1}`,
    },
    {
      title: "Thumbnail",
      dataIndex: "thumbnailUrl",
      key: "thumbnail",
      align: "center",
      width: 120,
      render: (thumbnailUrl) => (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Thumbnail
            thumbnailUrl={getVideoAndThumbnail(thumbnailUrl)}
            alt="thumbnail"
            className="object-cover rounded-xl"
            style={{ width: 100, height: 60 }}
          />
        </div>
      ),
    },
    {
      title: "Video Title",
      dataIndex: "title",
      key: "title",
      align: "center",
      width: 300,
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      align: "center",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      align: "center",
    },
    // {
    //   title: "Created Date",
    //   dataIndex: "createdAt",
    //   key: "createdAt",
    //   align: "center",

    //   render: (createdAt) => moment(createdAt).format("L"),
    // },
    // {
    //   title: "Status",
    //   dataIndex: "status",
    //   key: "status",
    //   align: "center",
    //   render: (status) => (
    //     <Tag color={status.toLowerCase() === "active" ? "green" : "red"}>
    //       {status.toUpperCase()}
    //     </Tag>
    //   ),
    // },
    {
      title: "Action",
      key: "action",
      align: "center",
      // width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#f55" }} />}
            onClick={() => showFormModal(record)}
            title="Edit Video"
          />
          <Button
            type="text"
            icon={<EyeOutlined style={{ color: "#55f" }} />}
            onClick={() => showDetailsModal(record)}
            title="View Video Details"
          />
          {/* <Switch
            size="small"
            checked={record.status === "active"}
            onChange={(checked) => handleStatusChange(checked, record)}
            style={{
              backgroundColor: record.status === "active" ? "red" : "gray",
            }}
          /> */}
          <Button
            type="text"
            icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
            onClick={() => handleDeleteVideo(record._id)}
            title="Delete Video"
          />
        </Space>
      ),
    },
  ];

  // Display text helpers
  const getTypeDisplayText = () => {
    if (typeFilter === "all") return "All Type";
    return typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1);
  };

  const getStatusDisplayText = () => {
    if (statusFilter === "all") return "All Status";
    return statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
  };

  if (isLoadingVideos) {
    return <Spinner />;
  }

  return (
    <div style={{ padding: 24 }}>
      <style jsx>{`
        .drag-item {
          transition: all 0.2s ease;
          cursor: grab;
        }
        .drag-item:active {
          cursor: grabbing;
        }
        .drag-over {
          border: 2px dashed #1890ff !important;
          background-color: #f0f8ff;
        }
        .drag-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      `}</style>

      <div className="flex justify-between items-center gap-6 mb-6">
      <DebouncedSearch
          placeholder="Search videos..."
          onChange={handleSearch}
          delay={300}
        />

        <Space>
          <button
            onClick={() => setViewMode(viewMode === "table" ? "drag" : "table")}
            className="py-2 rounded-md px-4 border-none mr-2 bg-primary text-white hover:bg-secondary"
          >
            {viewMode === "table" ? "Do Shuffle" : "Table Mode"}
          </button>

          <GradientButton
            type="primary"
            onClick={() => setIsScheduleModalVisible(true)}
            className="py-5"
            icon={<CalendarOutlined />}
          >
            Video Library
          </GradientButton>
        </Space>
      </div>

      {viewMode === "table" ? (
        <Table
          columns={columns}
          dataSource={allVideos}
          rowKey="_id"
          loading={isLoadingVideos}
          pagination={{
            current: currentPage,
            total: paginationData.total,
            pageSize: pageSize,
          }}
          onChange={handleTableChange}
          bordered
          size="middle"
          className="custom-table"
          scroll={{ x: "max-content" }}
        />
      ) : (
        <DragDropList
          items={localVideos}
          onReorder={handleReorder}
          onUpdateOrder={handleUpdateOrder}
          hasChanges={hasOrderChanges}
          renderItem={(video, index, draggedItem) => (
            <VideoCard
              video={video}
              onEdit={showFormModal}
              onView={showDetailsModal}
              onDelete={handleDeleteVideo}
              onStatusChange={handleStatusChange}
              isDragging={draggedItem?._id === video._id}
              serialNumber={video.serial || index + 1}
            />
          )}
        />
      )}

      {/* Edit Video Modal */}
      <EditVideoModal
        visible={isFormModalVisible}
        onCancel={closeFormModal}
        onSuccess={handleFormSubmit}
        currentVideo={currentVideo}
        onUpdateVideo={updateVideoINCategoryAndSubcategory}
        isLoading={isLoading}
      />

      {/* Video Details Modal */}
      <VideoDetailsModal
        visible={isDetailsModalVisible}
        onCancel={closeDetailsModal}
        currentVideo={currentVideo}
      />

      {/* Schedule Videos Modal */}
      <Modal
        title="Add Videos to library"
        open={isScheduleModalVisible}
        onCancel={closeScheduleModal}
        footer={
          <div className="flex justify-between items-center">
            <div>
              {selectedVideos.length > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedVideos.length} video(s) selected
                </span>
              )}
            </div>
            <Space>
              <Button onClick={closeScheduleModal} className="text-black h-10">
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleAddSelectedVideos}
                disabled={selectedVideos.length === 0}
                icon={<PlusOutlined />}
                className="bg-primary text-white h-10"
              >
                Add Selected Videos ({selectedVideos.length})
              </Button>
            </Space>
          </div>
        }
        width={800}
      >
        {/* Modal Filters */}

        <Table
          columns={scheduleVideoColumns}
          dataSource={TotalVideo}
          rowKey="_id"
          loading={allVideosLoading}
          pagination={{
            current: modalCurrentPage,
            pageSize: modalPageSize,
            total: allVideosPagination?.total,
            onChange: handleModalPaginationChange,
            onShowSizeChange: handleModalPaginationChange,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} videos`,
          }}
          locale={{ emptyText: "No videos found" }}
          rowSelection={rowSelection}
          scroll={{ x: "max-content" }}
        />
      </Modal>
    </div>
  );
};

export default CategoryVideos;

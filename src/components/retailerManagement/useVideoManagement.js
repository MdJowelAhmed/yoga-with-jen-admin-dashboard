import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Modal, message } from "antd";
import {
  // useGetVideoByIdQuery,
  useCourserVideoDetailsQuery,
  useGetSubCategoryByIdQuery,
  useDeleteVideoMutation,
  useUpdateVideoStatusMutation,
  useUpdateVideoOrderMutation,
  useGetAllVideosQuery,
  useDeleteVideoByCategoryANdSubCategoryMutation,
} from "../../redux/apiSlices/videoApi";
import {
  useGetCategoryQuery,
  useVideoAddInCategoryMutation,
} from "../../redux/apiSlices/categoryApi";

export const useVideoManagement = () => {
  const { subCategoryId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const categoryId = queryParams.get("categoryId");

  // Modal states
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [equipmentTags, setEquipmentTags] = useState([]);

  // Video selection states
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [libraryPage, setLibraryPage] = useState(1);
const [libraryPageSize, setLibraryPageSize] = useState(10);


  // View mode state
  const [viewMode, setViewMode] = useState("table");

  // Drag and drop state
  const [localVideos, setLocalVideos] = useState([]);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // API calls
  const { data: categoryData } = useGetCategoryQuery();
  const categories = categoryData?.data || [];

  const { data: allVideosData, isLoading: allVideosLoading } =
  useGetAllVideosQuery([
    { name: "page", value: libraryPage },
    { name: "limit", value: libraryPageSize },
  ]);

const TotalVideo = allVideosData?.data || [];
const libraryPagination = allVideosData?.pagination || {
  total: 0,
  current: 1,
  pageSize: 10,
};


  const {
    data: videosData,
    isLoading: isLoadingVideos,
    refetch,
  } = useGetSubCategoryByIdQuery({
    subCategoryId: subCategoryId,
    page: currentPage,
    limit: pageSize
  });

  const { data: videoDetails } = useCourserVideoDetailsQuery(editingId, {
    skip: !editingId,
  });
  const [deleteVideoByCategoryANdSubCategory] = useDeleteVideoByCategoryANdSubCategoryMutation();
  const [updateVideoStatus] = useUpdateVideoStatusMutation();
  const [updateVideoOrder] = useUpdateVideoOrderMutation();
  const [videoAddInCategory] = useVideoAddInCategoryMutation();

  const videos = videosData?.data || [];
  const paginationData = videosData?.pagination || {
    total: videosData?.meta?.total || 0,
    current: videosData?.meta?.currentPage || 1,
    pageSize: videosData?.meta?.perPage || 10,
  };
  // Sort videos by serial number and update local state
  useEffect(() => {
    if (videos.length > 0) {
      const sortedVideos = [...videos].sort((a, b) => a.serial - b.serial);
      setLocalVideos(sortedVideos);
      setHasOrderChanges(false);
    }
  }, [videos]);

  // Update current video when editing
  useEffect(() => {
    if (editingId) {
      if (videoDetails) {
        setCurrentVideo({
          ...videoDetails,
          id: videoDetails._id || videoDetails.id,
        });
        setEquipmentTags(videoDetails.equipment || []);
      }
    } else {
      setCurrentVideo(null);
      setEquipmentTags([]);
    }
  }, [editingId, videoDetails]);

  // Handle video reordering (local state only)
  const handleReorder = (reorderedVideos) => {
    setLocalVideos(reorderedVideos);
    setHasOrderChanges(true);
  };

  // Handle actual order update to server
  const handleUpdateOrder = async (orderData) => {
    try {
      const res = await updateVideoOrder(orderData).unwrap();

      message.success("Video order updated successfully!");
      setHasOrderChanges(false);

      await refetch();
    } catch (error) {
      message.error("Failed to update video order");
      console.error("Update order error:", error);
    }
  };

  // Modal handlers
  const showFormModal = (record = null) => {
    if (record) {
      setEditingId(record._id);
    } else {
      setEditingId(null);
    }
    setIsFormModalVisible(true);
  };

  const showDetailsModal = (record) => {
    setEditingId(record._id);
    setIsDetailsModalVisible(true);
  };

  const closeFormModal = () => {
    setIsFormModalVisible(false);
    setEditingId(null);
    setCurrentVideo(null);
    setEquipmentTags([]);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalVisible(false);
    setEditingId(null);
    setCurrentVideo(null);
    setEquipmentTags([]);
  };

  const closeScheduleModal = () => {
    setIsScheduleModalVisible(false);
    setSelectedVideos([]);
    setSelectedRowKeys([]);
  };

  const handleFormSubmit = async () => {
    closeFormModal();
    await refetch();
  };

  // Handle adding single video to subcategory
  const handleAddToSchedule = async (video) => {
    try {
      if (!video || !categoryId || !subCategoryId) {
        message.error("Video, category ID, or subcategory ID is missing");
        return;
      }

      const scheduleData = {
        videoIds: [video._id],
        categoryId: categoryId,
        subCategoryId: subCategoryId,
      };

      await videoAddInCategory(scheduleData);
      message.success("Video added to subcategory successfully!");
      
      // Refresh the video list to show the newly added video
      await refetch();
    } catch (error) {
      console.error("Failed to add video to subcategory:", error);
      message.error("Failed to add video to subcategory");
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
        subCategoryId: subCategoryId,
      };

      await videoAddInCategory(scheduleData);
      message.success(
        `${selectedVideos.length} videos added to subcategory successfully!`
      );
      setSelectedVideos([]);
      setSelectedRowKeys([]);
      setIsScheduleModalVisible(false);
      
      // Refresh the video list to show the newly added videos
      await refetch();
    } catch (error) {
      console.error("Failed to add videos to subcategory:", error);
      message.error("Failed to add videos to subcategory");
    }
  };

  // Delete video
  const handleDeleteVideo = (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this video?",
      content: "This action cannot be undone.",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await deleteVideoByCategoryANdSubCategory(id).unwrap();
          message.success("Video deleted successfully");
          refetch();
        } catch (error) {
          message.error("Failed to delete video");
        }
      },
    });
  };

  // Status change
  const handleStatusChange = (checked, record) => {
    const newStatus = checked ? "active" : "inactive";
    Modal.confirm({
      title: `Are you sure you want to set the status to "${newStatus}"?`,
      okText: "Yes",
      cancelText: "No",
      okButtonProps: {
        style: { backgroundColor: "red", borderColor: "red" },
      },
      onOk: async () => {
        try {
          await updateVideoStatus({
            id: record._id,
            ...record,
            status: newStatus,
          }).unwrap();
          message.success(`Video status updated to ${newStatus}`);
          refetch();
        } catch (error) {
          message.error("Failed to update video status");
        }
      },
    });
  };

  // Table pagination with backend support
  const handleTableChange = async (paginationConfig) => {
    const page = paginationConfig.current;
    const limit = paginationConfig.pageSize;
    
    setCurrentPage(page);
    setPageSize(limit);
    
    // Refetch data with new pagination parameters
    await refetch({ subCategoryId, page, limit });
  };

  return {
    // State
    subCategoryId,
    categoryId,
    isFormModalVisible,
    isDetailsModalVisible,
    isScheduleModalVisible,
    editingId,
    currentVideo,
    equipmentTags,
    selectedVideos,
    selectedRowKeys,
    viewMode,
    localVideos,
    hasOrderChanges,
    currentPage,
    pageSize,
    categories,
   
    videosData,
    isLoadingVideos,
    allVideosLoading,
    paginationData,
    TotalVideo,
  allVideosLoading,
  libraryPagination,
  libraryPage,
  libraryPageSize,
  setLibraryPage,
  setLibraryPageSize,

    // Setters
    setEquipmentTags,
    setSelectedVideos,
    setSelectedRowKeys,
    setViewMode,
    setIsScheduleModalVisible,

    // Handlers
    handleReorder,
    handleUpdateOrder,
    showFormModal,
    showDetailsModal,
    closeFormModal,
    closeDetailsModal,
    closeScheduleModal,
    handleFormSubmit,
    handleAddToSchedule,
    handleAddSelectedVideos,
    handleDeleteVideo,
    handleStatusChange,
    handleTableChange,

    // API
    refetch,
  };
};

export default useVideoManagement;
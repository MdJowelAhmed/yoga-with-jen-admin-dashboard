import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Space,
  message,
  Image,
} from "antd";
import {
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import GradientButton from "../common/GradiantButton";
import DebouncedSearch from "../common/DebouncedSearch";
import {
  useGetAllVideosQuery,
  useDeleteVideoMutation,
  useGetVideoByIdQuery,
} from "../../redux/apiSlices/videoApi";
import Spinner from "../common/Spinner";
// import VideoFormModal from "./VideoFormModal";
// import VideoDetailsModal from "./VideoDetailsModal";
import { getVideoAndThumbnail } from "../common/imageUrl";
// import SecureVideoPlayer from "./bunnyPlayer";
import VideoUploadModal from "./VideoUploadModal";
import VideoDetailsModal from "./VideoDetailsModal";
import SecureVideoPlayer from "./BunnyPlayerSecure";
import Thumbnail from "./Thumbnail";

// const VideoManagementContainer = () => {
//   // Modal and editing states
//   const [isFormModalVisible, setIsFormModalVisible] = useState(false);
//   const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
//   const [isPlayerModalVisible, setIsPlayerModalVisible] = useState(false);
//   const [editingId, setEditingId] = useState(null);
//   const [currentVideo, setCurrentVideo] = useState(null);
//   const [equipmentTags, setEquipmentTags] = useState([]);

//   // Filters and pagination
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);

//   // Build query params
//   const queryParams = [];
//   if (statusFilter !== "all")
//     queryParams.push({ name: "status", value: statusFilter });
//   queryParams.push({ name: "page", value: currentPage });
//   queryParams.push({ name: "limit", value: pageSize });

//   // API calls
//   const {
//     data: videosData,
//     isLoading: isLoadingVideos,
//     refetch,
//   } = useGetAllVideosQuery(queryParams);

//   const videos = videosData?.data || [];
//   const paginationData = videosData?.pagination || {
//     total: 0,
//     current: 1,
//     pageSize: 10,
//   };

//   // Fetch single video data when editingId is set
//   const { data: videoDetails } = useGetVideoByIdQuery(editingId, {
//     skip: !editingId,
//   });

//   const [deleteVideo, { isLoading: isDeleting }] = useDeleteVideoMutation();

//   // Update currentVideo and equipmentTags whenever videoDetails or editingId changes
//   useEffect(() => {
//     if (editingId && videoDetails) {
//       setCurrentVideo({
//         ...videoDetails,
//         id: videoDetails._id || videoDetails.id,
//       });
//       setEquipmentTags(videoDetails.equipment || []);
//     } else if (!editingId) {
//       setCurrentVideo(null);
//       setEquipmentTags([]);
//     }
//   }, [editingId, videoDetails]);

//   // Reset page on filter change
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [statusFilter]);

//   // Show form modal for add or edit
//   const showFormModal = (record = null) => {
//     if (record) {
//       setEditingId(record._id);
//     } else {
//       setEditingId(null);
//       setCurrentVideo(null);
//       setEquipmentTags([]);
//     }
//     setIsFormModalVisible(true);
//   };

//   // Show details modal
//   const showDetailsModal = (record) => {
//     setEditingId(record._id);
//     setIsDetailsModalVisible(true);
//   };

//   // // Show video player modal
//   // const showPlayerModal = (record) => {
//   //   setCurrentVideo(record);
//   //   setIsPlayerModalVisible(true);
//   // };

//   const closeFormModal = () => {
//     setIsFormModalVisible(false);
//     setEditingId(null);
//     setCurrentVideo(null);
//     setEquipmentTags([]);
//   };

//   const closeDetailsModal = () => {
//     setIsDetailsModalVisible(false);
//     setEditingId(null);
//     setCurrentVideo(null);
//     setEquipmentTags([]);
//   };

//   const closePlayerModal = () => {
//     setIsPlayerModalVisible(false);
//     setCurrentVideo(null);
//   };

//   const handleFormSubmit = async () => {
//     closeFormModal();
//     await refetch();
//   };

//   // Delete video with confirmation
//   const handleDeleteVideo = (record) => {
//     Modal.confirm({
//       title: "Are you sure you want to delete this video?",
//       content: "This action cannot be undone.",
//       okText: "Yes",
//       okType: "danger",
//       cancelText: "No",
//       onOk: async () => {
//         try {
//           await deleteVideo(record._id).unwrap();
//           message.success("Video deleted successfully");
//           refetch();
//         } catch (error) {
//           console.error("Delete error:", error);
//           message.error("Failed to delete video");
//         }
//       },
//     });
//   };

//   // Pagination handler
//   const handleTableChange = (paginationConfig) => {
//     setCurrentPage(paginationConfig.current);
//     setPageSize(paginationConfig.pageSize);
//   };

//   // Table columns
//   const columns = [
//     {
//       title: "SL",
//       key: "id",
//       width: 50,
//       align: "center",
//       render: (_, __, index) => `# ${(currentPage - 1) * pageSize + index + 1}`,
//     },
//     {
//       title: "Thumbnail",
//       dataIndex: "thumbnailUrl",
//       key: "thumbnailUrl",
//       align: "center",
//       width: 110,
//       render: (_, record) => (
//         <div style={{ display: "flex", justifyContent: "center" }}>
//           <img
//             src={getVideoAndThumbnail(record?.thumbnailUrl)}
//             alt="thumbnail"
//             style={{ width: 120, height: 55, objectFit: "cover" }}
//             className="rounded-lg"
//           />
//         </div>
//       ),
//     },
//     {
//       title: "Video Title",
//       dataIndex: "title",
//       key: "title",
//       align: "center",
//       width: 200,
//       render: (title) => (
//         <span className="font-medium">{title}</span>
//       ),
//     },
//     {
//       title: "Duration",
//       dataIndex: "duration",
//       key: "duration",
//       align: "center",
//       width: 70,
//     },
//     {
//       title: "Equipment",
//       dataIndex: "equipment",
//       key: "equipment",
//       align: "center",
//       width: 150,
//       render: (equipment) => (
//         <div className="flex flex-wrap gap-1 justify-center">
//           {equipment?.slice(0, 2).map((item, index) => (
//             <span
//               key={index}
//               className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs"
//             >
//               {item}
//             </span>
//           ))}
//           {equipment?.length > 2 && (
//             <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
//               +{equipment.length - 2}
//             </span>
//           )}
//         </div>
//       ),
//     },
//     // {
//     //   title: "Description",
//     //   dataIndex: "description",
//     //   key: "description",
//     //   align: "center",
//     //   width: 250,
//     //   render: (description) => (
//     //     <span className="line-clamp-2 text-sm text-gray-600">
//     //       {description}
//     //     </span>
//     //   ),
//     // },
//     {
//       title: "Action",
//       key: "action",
//       align: "center",
//       width: 150,
//       fixed: 'right',
//       render: (_, record) => (
//         <Space size="small">
//           {/* <Button
//             type="text"
//             icon={<PlayCircleOutlined style={{ color: "#52c41a", fontSize: "18px" }} />}
//             onClick={() => showPlayerModal(record)}
//             title="Play Video"
//           /> */}
//           <Button
//             type="text"
//             icon={<EditOutlined style={{ color: "#f55", fontSize: "18px" }} />}
//             onClick={() => showFormModal(record)}
//             title="Edit Video"
//           />
//           <Button
//             type="text"
//             icon={<EyeOutlined style={{ color: "#1890ff", fontSize: "18px" }} />}
//             onClick={() => showDetailsModal(record)}
//             title="View Details"
//           />
//           <Button
//             type="text"
//             icon={<DeleteOutlined style={{ color: "#ff4d4f", fontSize: "18px" }} />}
//             onClick={() => handleDeleteVideo(record)}
//             loading={isDeleting}
//             title="Delete Video"
//           />
//         </Space>
//       ),
//     },
//   ];

//   if (isLoadingVideos) {
//     return <Spinner />;
//   }

//   return (
//     <div>
//       <div className="flex justify-end gap-6 mb-6">
//         <GradientButton
//           type="primary"
//           onClick={() => showFormModal()}
//           className="py-5"
//           icon={<PlusOutlined />}
//         >
//           Upload New Video
//         </GradientButton>
//       </div>

//      <div className="border-2 rounded-lg">
//      <Table
//         columns={columns}
//         dataSource={videos}
//         pagination={{
//           current: currentPage,
//           pageSize: pageSize,
//           total: paginationData.total || 0,
//           showSizeChanger: true,
//           showTotal: (total) => `Total ${total} videos`,
//         }}
//         onChange={handleTableChange}
//         rowKey="_id"
//         // bordered
//         size="middle"
//         className="custom-table"
//         scroll={{ x: 800 }}
//       />
//      </div>

//       {/* Video Player Modal */}
//       <SecureVideoPlayer
//         visible={isPlayerModalVisible}
//         onClose={closePlayerModal}
//         video={currentVideo}
//       />

//       {/* Add/Edit Video Modal */}
//       <VideoUploadModal
//         visible={isFormModalVisible}
//         onCancel={closeFormModal}
//         onSuccess={handleFormSubmit}
//         currentVideo={currentVideo}
//         editingId={editingId}
//         equipmentTags={equipmentTags}
//         setEquipmentTags={setEquipmentTags}
//       />

//       {/* Video Details Modal */}
//       <VideoDetailsModal
//         visible={isDetailsModalVisible}
//         onCancel={closeDetailsModal}
//         currentVideo={currentVideo}
//       />
//     </div>
//   );
// };

// export default VideoManagementContainer;


const VideoManagementContainer = () => {
  // Modal and editing states
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isPlayerModalVisible, setIsPlayerModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [equipmentTags, setEquipmentTags] = useState([]);

  // Filters and pagination
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Build query params
  const queryParams = [];
  if (statusFilter !== "all")
    queryParams.push({ name: "status", value: statusFilter });
  if (searchTerm) {
    queryParams.push({ name: "searchTerm", value: searchTerm });
  }
  queryParams.push({ name: "page", value: currentPage });
  queryParams.push({ name: "limit", value: pageSize });

  // API calls
  const {
    data: videosData,
    isLoading: isLoadingVideos,
    refetch,
  } = useGetAllVideosQuery(queryParams);

  const videos = videosData?.data || [];
  const paginationData = videosData?.pagination || {
    total: 0,
    current: 1,
    pageSize: 10,
  };

  // Fetch single video data when editingId is set
  const { data: videoDetails } = useGetVideoByIdQuery(editingId, {
    skip: !editingId,
  });

  const [deleteVideo, { isLoading: isDeleting }] = useDeleteVideoMutation();

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
  }, [statusFilter, searchTerm]);

  const handleSearch = (value) => {
    setSearchTerm(value || "");
  };

  // Show form modal for add or edit
  const showFormModal = (record = null) => {
    if (record) {
      setEditingId(record._id);
    } else {
      setEditingId(null);
      setCurrentVideo(null);
      setEquipmentTags([]);
    }
    setIsFormModalVisible(true);
  };

  // Show details modal
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

  const closePlayerModal = () => {
    setIsPlayerModalVisible(false);
    setCurrentVideo(null);
  };

  const handleFormSubmit = async () => {
    closeFormModal();
    await refetch();
  };

  // Delete video with confirmation
  const handleDeleteVideo = (record) => {
    Modal.confirm({
      title: "Are you sure you want to delete this video?",
      content: "This action cannot be undone.",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await deleteVideo(record._id).unwrap();
          message.success("Video deleted successfully");
          refetch();
        } catch (error) {
          console.error("Delete error:", error);
          message.error("Failed to delete video");
        }
      },
    });
  };

  // Pagination handler
  const handleTableChange = (paginationConfig) => {
    setCurrentPage(paginationConfig.current);
    setPageSize(paginationConfig.pageSize);
  };

  // Table columns
  const columns = [
    {
      title: "SL",
      key: "id",
      width: 50,
      align: "center",
      render: (_, __, index) => `# ${(currentPage - 1) * pageSize + index + 1}`,
    },
    {
      title: "Thumbnail",
      dataIndex: "thumbnailUrl",
      key: "thumbnailUrl",
      align: "center",
      width: 110,
      render: (_, record) => (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Thumbnail 
            thumbnailUrl={getVideoAndThumbnail(record?.thumbnailUrl)} 
            alt={record?.title || "thumbnail"}
          />
        </div>
      ),
    },
    {
      title: "Video Title",
      dataIndex: "title",
      key: "title",
      align: "center",
      width: 200,
      render: (title) => (
        <span className="font-medium">{title}</span>
      ),
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      align: "center",
      width: 70,
    },
    {
      title: "Equipment",
      dataIndex: "equipment",
      key: "equipment",
      align: "center",
      width: 150,
      render: (equipment) => (
        <div className="flex flex-wrap gap-1 justify-center">
          {equipment?.slice(0, 2).map((item, index) => (
            <span
              key={index}
              className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs"
            >
              {item}
            </span>
          ))}
          {equipment?.length > 2 && (
            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
              +{equipment.length - 2}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#f55", fontSize: "18px" }} />}
            onClick={() => showFormModal(record)}
            title="Edit Video"
          />
          <Button
            type="text"
            icon={<EyeOutlined style={{ color: "#1890ff", fontSize: "18px" }} />}
            onClick={() => showDetailsModal(record)}
            title="View Details"
          />
          <Button
            type="text"
            icon={<DeleteOutlined style={{ color: "#ff4d4f", fontSize: "18px" }} />}
            onClick={() => handleDeleteVideo(record)}
            loading={isDeleting}
            title="Delete Video"
          />
        </Space>
      ),
    },
  ];

  if (isLoadingVideos) {
    return <Spinner />;
  }

  return (
    <div>
      <div className="flex justify-between items-center gap-6 mb-6">
        <DebouncedSearch
          placeholder="Search videos..."
          onChange={handleSearch}
          delay={300}
        />

        <button
          type="primary"
          onClick={() => showFormModal()}
          className="h-[45px] px-10 rounded-md bg-primary text-white"
          icon={<PlusOutlined />}
        >
          Upload New Video
        </button>
      </div>

      <div className="border-2 rounded-lg">
        <Table
          columns={columns}
          dataSource={videos}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: paginationData.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} videos`,
          }}
          onChange={handleTableChange}
          rowKey="_id"
          size="middle"
          className="custom-table"
          scroll={{ x: 800 }}
        />
      </div>

      {/* Video Player Modal */}
      <SecureVideoPlayer
        visible={isPlayerModalVisible}
        onClose={closePlayerModal}
        video={currentVideo}
      />

      {/* Add/Edit Video Modal */}
      <VideoUploadModal
        visible={isFormModalVisible}
        onCancel={closeFormModal}
        onSuccess={handleFormSubmit}
        currentVideo={currentVideo}
        editingId={editingId}
        equipmentTags={equipmentTags}
        setEquipmentTags={setEquipmentTags}
      />

      {/* Video Details Modal */}
      <VideoDetailsModal
        visible={isDetailsModalVisible}
        onCancel={closeDetailsModal}
        currentVideo={currentVideo}
      />
    </div>
  );
};

export default VideoManagementContainer;
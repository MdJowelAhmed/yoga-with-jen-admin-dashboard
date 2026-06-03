import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Space,
  Switch,
  Modal,
  Tag,
  Typography,
  Card,
} from "antd";
import {
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  TableOutlined,
  AppstoreOutlined,
  PlusOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
// import VideoFormModal from "./VideoFormModal";
import VideoDetailsModal from "./VideoDetailsModal";
import GradientButton from "../common/GradiantButton";
import DraggableVideoList from "./DraggableVideoList";
// import { useVideoManagement } from "./useVideoManagement";
import { getTableColumns, getScheduleVideoColumns } from "./VideoTableConfig";
import { getVideoAndThumbnail } from "../common/imageUrl";
import moment from "moment/moment";
import Spinner from "../common/Spinner";
// import VideoFormModal from "./VideoFormModal";

const { Title } = Typography;

const CourseDetails = () => {
  const navigate = useNavigate();
  
  const {
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
    TotalVideo,
    videosData,
    isLoadingVideos,
    allVideosLoading,
    paginationData,

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
  } = useRetailerManageTable();



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

  // Get table columns configuration
  const columns = getTableColumns({
    showFormModal,
    showDetailsModal,
    handleStatusChange,
    handleDeleteVideo,
  });

  // Get schedule modal columns configuration
  const scheduleVideoColumns = getScheduleVideoColumns({
    handleAddToSchedule,
  });

  if (isLoadingVideos) {
    return <Spinner />;
  }

  return (
    <div style={{ padding: 24, minHeight: "100vh" }}>
      {/* Header Section */}
      <Card className="mb-6">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Title level={3} className="mb-2">
              {videosData?.subCategoryId?.name || "Course"} Videos
            </Title>
            <div className="text-gray-600">
              Total Videos: {paginationData.total || 0}
            </div>
          </div>

          {/* Back Button */}
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{
              borderRadius: "8px",
              height: "40px",
              padding: "0 16px",
            }}
          >
            Back
          </Button>
        </div>
      </Card>

      {/* Controls */}
      <div
        className="flex justify-between items-center mb-6"
        style={{ marginBottom: 24 }}
      >
        <div></div> {/* Empty div for spacing */}

        <Space size="middle">
          <Button.Group>
            <Button
              type="default"
              icon={<AppstoreOutlined />}
              onClick={() => setViewMode("card")}
              style={{
                borderRadius: "8px 0 0 8px",
                backgroundColor: viewMode === "card" ? "#CA3939" : undefined,
                color: viewMode === "card" ? "#fff" : undefined,
                padding: "10px 16px",
              }}
              className="h-10"
            >
              Do Shuffle
            </Button>
            <Button
              type="default"
              icon={<TableOutlined />}
              onClick={() => setViewMode("table")}
              style={{
                borderRadius: "0 8px 8px 0",
                backgroundColor: viewMode === "table" ? "#CA3939" : undefined,
                color: viewMode === "table" ? "#fff" : undefined,
                padding: "10px 16px",
              }}
              className="h-10"
            >
              Table View
            </Button>
          </Button.Group>

          <GradientButton
            type="primary"
            onClick={() => setIsScheduleModalVisible(true)}
            className="py-5"
            icon={<CalendarOutlined />}
          >
            Video Library
          </GradientButton>

          {/* <GradientButton
            type="primary"
            onClick={() => showFormModal()}
            className="py-5"
            icon={<PlusOutlined />}
          >
            Add New Video
          </GradientButton> */}
        </Space>
      </div>

      {/* Content */}
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        {viewMode === "card" ? (
          <DraggableVideoList
            videos={localVideos}
            onReorder={handleReorder}
            onEdit={showFormModal}
            onView={showDetailsModal}
            onDelete={handleDeleteVideo}
            onStatusChange={handleStatusChange}
            hasChanges={hasOrderChanges}
            onUpdateOrder={handleUpdateOrder}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={localVideos}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: paginationData.total || 0,
            }}
            onChange={handleTableChange}
            rowKey="_id"
            bordered
            size="small"
            className="custom-table"
            scroll={{ x: "max-content" }}
            locale={{
              emptyText: "No videos found in this subcategory",
            }}
          />
        )}
      </div>

      {localVideos.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#999",
          }}
        >
          <h3>No videos found</h3>
          <p>Add new videos to this course</p>
        </div>
      )}

      {/* Add/Edit Video Modal */}
      <VideoFormModal
        visible={isFormModalVisible}
        onCancel={closeFormModal}
        onSuccess={handleFormSubmit}
        currentVideo={currentVideo}
        editingId={editingId}
        categories={categories}
        equipmentTags={equipmentTags}
        setEquipmentTags={setEquipmentTags}
      />

      {/* Video Details Modal */}
      <VideoDetailsModal
        visible={isDetailsModalVisible}
        onCancel={closeDetailsModal}
        currentVideo={currentVideo}
      />

      {/* Schedule Videos Modal */}
      <Modal
        title="Add Videos to Course"
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
        width={900}
      >
        <Table 
          columns={scheduleVideoColumns}
          dataSource={TotalVideo}
          rowKey="_id"
          loading={allVideosLoading}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: "No videos found" }}
          rowSelection={rowSelection}
        />
      </Modal>
    </div>
  );
};

export default CourseDetails;
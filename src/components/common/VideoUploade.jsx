import React, { useState, useEffect, useCallback } from "react";
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
} from "antd";
import {
  EditOutlined,
  EyeOutlined,
  DownOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import GradientButton from "../common/GradiantButton";
import { Filtering } from "../common/Svg";
import moment from "moment/moment";
import VideoFormModal from "./VideoUploadModal";
import Spinner from "./Spinner";
import { getVideoAndThumbnail } from "./imageUrl";
import VideoDetailsModal from "../retailerManagement/VideoDetailsModal";
import Thumbnail from "../videoManagement/Thumbnail";

// Added additionalButtons prop with default empty fragment
const VideoUploadSystem = ({ pageType, apiHooks, additionalButtons = <></> }) => {
  const {
    useGetAllQuery,
    useGetByIdQuery,
    deleteItem,
    updateItemStatus,
    createItem,
    updateItem,
  } = apiHooks;

  // State management
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtering and pagination
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Build query params for getAllQuery
  const queryParams = React.useMemo(() => {
    const params = [];
    if (statusFilter !== "all") {
      params.push({ name: "status", value: statusFilter });
    }
    params.push({ name: "page", value: currentPage });
    params.push({ name: "limit", value: pageSize });
    return params;
  }, [statusFilter, currentPage, pageSize]);

  // Fetch all items
  const {
    data: itemsData,
    isLoading: isLoadingItems,
    refetch,
  } = useGetAllQuery(queryParams);
  // Fetch single item for details and edit form
  const { data: itemDetails, isLoading: isLoadingDetails } = useGetByIdQuery(
    selectedItemId,
    { skip: !selectedItemId }
  );

  // Handle edit button click - sets both IDs and opens form modal
  const handleEdit = (id) => {
    setSelectedItemId(id);
    setEditingId(id);
    setIsFormModalVisible(true);
  };

  // Handle add new button click - resets IDs and opens form modal
  const showFormModal = () => {
    setSelectedItemId(null);
    setEditingId(null);
    setIsFormModalVisible(true);
  };

  // Show details modal
  const showDetailsModal = (record) => {
    setSelectedItemId(record._id);
    setIsDetailsModalVisible(true);
  };

  const items = itemsData?.data || [];
  const paginationData = itemsData?.pagination || {
    total: 0,
    current: 1,
    pageSize: 10,
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // Helper functions
  const getStatusDisplayText = () => {
    if (statusFilter === "all") return "All Status";
    return statusFilter?.charAt(0)?.toUpperCase() + statusFilter?.slice(1);
  };

  // Status options for the new system
  const statusOptions = [
    { value: "coming-soon", label: "Coming Soon", color: "orange" },
    { value: "its-here", label: "It's Here", color: "green" },
    { value: "check-this-out", label: "Check This Out", color: "blue" }
  ];

  const getStatusConfig = (status) => {
    return statusOptions.find(option => option.value === status) || statusOptions[0];
  };

  const getPageTitle = () => {
    switch (pageType) {
      case "coming-soon":
        return "Coming Soon";
      case "today-video":
        return "Today's Video";
      case "challenge-video":
        return "Challenge Video";
      default:
        return "Content";
    }
  };

  // Form submit handler
  const handleFormSubmit = useCallback(
    async (formData) => {
      setIsSubmitting(true);
      try {
        if (editingId) {
          // Determine the correct parameter name based on pageType
          let updateParams = { id: editingId };
          
          if (pageType === "daily-inspiration") {
            // Make sure we're using the correct parameter structure for daily inspiration
            updateParams.dailyInspirationData = formData;
          } else if (pageType === "coming-soon") {
            updateParams.comingSoonData = formData;
          } else {
            // Default fallback
            updateParams.formData = formData;
          }
          
          // Call the update API
          await updateItem(updateParams);
          message.success(`${getPageTitle()} updated successfully`);
        } else {
          await createItem(formData);
          message.success(`${getPageTitle()} created successfully`);
        }

        setIsFormModalVisible(false);
        setEditingId(null);
        setSelectedItemId(null);
        await refetch();
      } catch (error) {
        console.error("Error in form submit:", error);
        message.error(
          `Failed to ${editingId ? "update" : "create"} ${getPageTitle()}: ${
            error?.message || "Unknown error"
          }`
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingId, createItem, updateItem, refetch, pageType, getPageTitle]
  );

  // Delete handler
  const handleDeleteItem = useCallback(
    (id) => {
      Modal.confirm({
        title: `Are you sure you want to delete this ${getPageTitle()} item?`,
        content: "This action cannot be undone.",
        okText: "Yes",
        okType: "danger",
        cancelText: "No",
        onOk: async () => {
          try {
            await deleteItem(id);
            message.success(`${getPageTitle()} item deleted successfully`);
            refetch();
          } catch (error) {
            message.error(`Failed to delete ${getPageTitle()} item`);
            console.error("Error deleting item:", error);
          }
        },
      });
    },
    [deleteItem, refetch, getPageTitle]
  );

  // Status change handler for new status system
  const handleStatusChange = useCallback(
    (newStatus, record) => {
      const statusConfig = getStatusConfig(newStatus);
      Modal.confirm({
        title: `Are you sure you want to set the status to "${statusConfig.label}"?`,
        okText: "Yes",
        cancelText: "No",
        okButtonProps: {
          style: { backgroundColor: "red", borderColor: "red" },
        },
        onOk: async () => {
          try {
            if (updateItemStatus) {
              await updateItemStatus({
                id: record._id,
                status: newStatus,
              });
            } else {
              // Determine the correct parameter name based on pageType
              let updateParams = { id: record._id };
              
              if (pageType === "daily-inspiration") {
                updateParams.dailyInspirationData = { ...record, status: newStatus };
              } else if (pageType === "coming-soon") {
                updateParams.comingSoonData = { ...record, status: newStatus };
              } else {
                // Default fallback
                updateParams.formData = { ...record, status: newStatus };
              }
              
              await updateItem(updateParams);
            }
            message.success(`Status updated to ${statusConfig.label}`);
            refetch();
          } catch (error) {
            message.error("Failed to update status");
            console.error("Error updating status:", error);
          }
        },
      });
    },
    [updateItemStatus, updateItem, refetch, pageType]
  );

  // Table change handler
  const handleTableChange = useCallback((paginationConfig) => {
    setCurrentPage(paginationConfig.current);
    setPageSize(paginationConfig.pageSize);
  }, []);

  // Modal close handlers
  const handleFormModalClose = () => {
    setIsFormModalVisible(false);
    setEditingId(null);
    setSelectedItemId(null);
  };

  const handleDetailsModalClose = () => {
    setIsDetailsModalVisible(false);
    setSelectedItemId(null);
  };

  const handleStatusFilterChange = useCallback((status) => {
    setStatusFilter(status.toLowerCase());
  }, []);

  const statusMenu = React.useMemo(
    () => (
      <Menu>
        <Menu.Item key="all" onClick={() => handleStatusFilterChange("all")}>
          All Status
        </Menu.Item>
        <Menu.Item
          key="active"
          onClick={() => handleStatusFilterChange("active")}
        >
          Active
        </Menu.Item>
        <Menu.Item
          key="inactive"
          onClick={() => handleStatusFilterChange("inactive")}
        >
          Inactive
        </Menu.Item>
      </Menu>
    ),
    [handleStatusFilterChange]
  );

  // Table columns
  const columns = React.useMemo(
    () => [
      {
        title: "SL",
        key: "id",
        width: 50,
        align: "center",
        render: (text, record, index) => {
          const actualIndex = (currentPage - 1) * pageSize + index + 1;
          return `# ${actualIndex}`;
        },
      },
      {
        title: "Title",
        dataIndex: "title",
        key: "title",
        align: "center",
        width: 300
      },
      // {
      //   title: "Category",
      //   dataIndex: "category",
      //   key: "category",
      //   align: "center",
      //   render: () => "Coming Soon", // Always show "Coming Soon" as category
      // },
      {
        title: "Duration",
        dataIndex: "duration",
        key: "duration",
        align: "center",
      },
      {
        title: "Thumbnail",
        dataIndex: "thumbnailUrl",
        key: "thumbnailUrl",
        align: "center",
        render: (_, record) => (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Thumbnail
              thumbnailUrl={getVideoAndThumbnail(record.thumbnailUrl)}
              alt="thumbnail"
              style={{
                width: 100,
                height: 50,
                objectFit: "cover",
              }}
              className="rounded-lg"
            />
          </div>
        ),
      },
      // {
      //   title: "Publish Date",
      //   dataIndex: "publishAt",
      //   key: "publishAt",
      //   align: "center",
      //   render: (text) => moment(text).format("L"),
      // },
      {
        title: "Status",
        dataIndex: "isReady",
        key: "isReady",
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
              icon={<EditOutlined style={{ color: "#f55" }} />}
              onClick={() => handleEdit(record._id)}
            />
            <Button
              type="text"
              icon={<EyeOutlined style={{ color: "#55f" }} />}
              onClick={() => showDetailsModal(record)}
            />
            <Switch
              size="small"
              checked={record.status === "active"}
              onChange={(checked) => handleStatusChange(checked, record)}
              style={{
                backgroundColor: record.status === "active" ? "red" : "gray",
              }}
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
    [
      currentPage,
      pageSize,
      handleEdit,
      showDetailsModal,
      handleStatusChange,
      handleDeleteItem,
    ]
  );

  if (isLoadingItems) {
    return <Spinner />;
  }

  const handleTurnOffComingSoon = () => {
    setStatusFilter("inactive");
  };

  return (
    <div>
      {/* Header with filters and add button */}
      <div className="flex justify-end gap-6 mb-6">
        <div>
          <Space size="small" className="flex gap-4">
            {/* Status Filter */}
            {/* <Dropdown
              overlay={statusMenu}
              trigger={["click"]}
              placement="bottomLeft"
            >
              <Button
                className="py-5 mr-2 text-white bg-red-600 hover:bg-red-800 hover:text-white hover:icon-black"
                style={{ border: "none" }}
              >
                <Space>
                  <Filtering className="filtering-icon" />
                  <span className="filter-text">{getStatusDisplayText()}</span>
                  <DownOutlined />
                </Space>
              </Button>
            </Dropdown> */}
          </Space>
        </div>

        <div className="flex items-center">
          {/* <button className="py-2 rounded-md px-4  mr-2 text-white bg-secondary hover:bg-secondary hover:text-white hover:icon-black">
            Turn off Coming soon
          </button> */}
          <GradientButton
            type="primary"
            onClick={showFormModal}
            className="py-5"
            icon={<PlusOutlined />}
          >
            Add New {getPageTitle()} 
          </GradientButton>
          {/* Render additionalButtons next to the Add New button */}
          {additionalButtons}
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={items}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: paginationData?.total || 0,
        }}
        onChange={handleTableChange}
        rowKey="_id"
        bordered
        size="middle"
        className="custom-table"
        scroll={{ x: "max-content" }}
      />

      {/* Video Form Modal */}
      <VideoFormModal
        visible={isFormModalVisible}
        onClose={handleFormModalClose}
        onSubmit={handleFormSubmit}
        editingItem={itemDetails?.data}
        loading={isSubmitting}
        pageType={pageType}
        apiHooks={apiHooks}
      />

      {/* Video Details Modal */}
      <VideoDetailsModal
        visible={isDetailsModalVisible}
        onCancel={handleDetailsModalClose}
        currentVideo={itemDetails?.data}
        loading={isLoadingDetails}
      />
    </div>
  );
};

export default VideoUploadSystem;

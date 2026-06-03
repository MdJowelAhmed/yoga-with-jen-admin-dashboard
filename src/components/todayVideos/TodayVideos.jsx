import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useDeleteDailyChallegeMutation,
  useGetDailyChallengeQuery,
  useNewDailyChallengeMutation,
  useUpdateChallengeOrderMutation,
  useUpdateDailyChallengeMutation,
  useUpdateDailyChallengeStatusMutation, 
} from "../../redux/apiSlices/dailyChallangeApi";
import { useGetAllVideosQuery } from "../../redux/apiSlices/videoApi";
import { Button, Modal, Form, Input, Table, message, Tag, Upload, Switch, Space } from "antd";
import { PlusOutlined, EyeOutlined, DeleteOutlined, EditOutlined, UploadOutlined, ReloadOutlined, PictureOutlined, SaveOutlined } from "@ant-design/icons";
import GradientButton from "../common/GradiantButton";
import DragDropList from "../common/DragDropList";
import moment from "moment";
import { getImageUrl } from "../common/imageUrl";

const { TextArea } = Input;

const TodayVideos = () => {
  const navigate = useNavigate();
  const [createDailyChallenge] = useNewDailyChallengeMutation();
  const [updateDailyChallenge] = useUpdateDailyChallengeMutation();
  const [deleteDailyChallenge] = useDeleteDailyChallegeMutation();
  const [updateDailyChallengeStatus] = useUpdateDailyChallengeStatusMutation();
  const [updateChallengeOrder] = useUpdateChallengeOrderMutation();

  const [challengeModalVisible, setChallengeModalVisible] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [challengeForm] = Form.useForm();
  
  // Image handling states
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Drag and drop states
  const [localChallenges, setLocalChallenges] = useState([]);
  const [sortedChallenges, setSortedChallenges] = useState([]);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // "table" or "drag"

  const { data: allVideosData } = useGetAllVideosQuery();
  const allVideos = allVideosData?.data || [];
      


  const { data: challengesData, isLoading: challengesLoading, refetch: refetchChallenges } = useGetDailyChallengeQuery();
  const challenges = challengesData?.data || [];



  // Update local challenges and sorted challenges when challenges changes
  useEffect(() => {
    if (challenges.length > 0) {
      const sorted = [...challenges].sort((a, b) => (a.serial || 0) - (b.serial || 0));
      setLocalChallenges(sorted);
      setSortedChallenges(sorted);
      setHasOrderChanges(false);
    }
  }, [challenges]);

  // ChallengeCard component for drag and drop view
  const ChallengeCard = ({ challenge, onEdit, onView, onDelete, onStatusChange, isDragging, serialNumber }) => (
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
        
        {/* Challenge Image */}
        <div className="flex-shrink-0">
          {challenge.image ? (
            <img
              src={getImageUrl(challenge.image)}
              alt={challenge.name || "Challenge"}
              className="w-20 h-12 object-cover rounded"
            />
          ) : (
            <div className="w-20 h-12 bg-gray-200 rounded flex items-center justify-center">
              <PictureOutlined />
            </div>
          )}
        </div>
        
        {/* Challenge Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 truncate">{challenge.name || "Untitled Challenge"}</h3>
          <p className="text-sm text-gray-500 truncate">{challenge.description}</p>
          <span className="text-xs text-gray-400">Created: {moment(challenge.createdAt).format("L")}</span>
        </div>
        
        {/* Status */}
        <div className="flex-shrink-0">
          <Tag color={challenge.status === "active" ? "green" : "red"}>
            {challenge.status || "inactive"}
          </Tag>
        </div>
        
        {/* Actions */}
        <div className="flex-shrink-0">
          <Space size="small">
            <Button
              size="small"
              className="hover:bg-red-600 border-none hover:text-white text-red-500"
              icon={<EyeOutlined />}
              onClick={() => onView(challenge)}
              title="View Challenge"
            />
            <Button
              size="small"
              className="hover:bg-red-600 border-none hover:text-white text-red-500"
              icon={<EditOutlined />}
              onClick={() => onEdit(challenge)}
              title="Edit Challenge"
            />
            <Switch
              checked={challenge.status === "active"}
              onChange={() => onStatusChange(challenge._id, challenge.status)}
              size="small"
              className="hover:bg-red-600 border-none hover:text-white text-red-500"
            />
            <Button
              className="hover:bg-red-600 border-none hover:text-white text-red-500"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => onDelete(challenge._id)}
              title="Delete Challenge"
            />
          </Space>
        </div>
      </div>
    </div>
  );

  // Handle challenge reordering (local state only)
  const handleReorder = (reorderedChallenges) => {
    setLocalChallenges(reorderedChallenges);
    setHasOrderChanges(true);
  };

  // Handle actual order update to server
  const handleUpdateOrder = async (orderData) => {
    try {
      // Use provided orderData or create from localChallenges
      const dataToSend = orderData || localChallenges.map((challenge, index) => ({
        _id: challenge._id,
        serial: index + 1, // Update serial based on new order
      }));

      await updateChallengeOrder(dataToSend).unwrap();

      message.success("Challenge order updated successfully!");
      setHasOrderChanges(false);
      await refetchChallenges();
    } catch (error) {
      message.error("Failed to update challenge order");
      console.error("Update order error:", error);
    }
  };

  // Reset form and image states when modal opens/closes
  useEffect(() => {
    if (challengeModalVisible) {
      if (editingChallenge) {
        challengeForm.setFieldsValue({
          name: editingChallenge.name || "",
          description: editingChallenge.description || "",
        });

        if (editingChallenge.image) {
          setPreviewUrl(getImageUrl(editingChallenge.image));
          setImageLoaded(false);
          setImageError(false);
        } else {
          setPreviewUrl(null);
          setImageLoaded(false);
          setImageError(false);
        }

        setImageFile(null);
      } else {
        challengeForm.resetFields();
        setPreviewUrl(null);
        setImageFile(null);
        setImageLoaded(false);
        setImageError(false);
      }
    }
  }, [challengeModalVisible, editingChallenge, challengeForm]);

  // Handle image file change
  const handleImageChange = (info) => {
    if (info.file) {
      const file = info.file.originFileObj || info.file;
      setImageFile(file);

      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result);
        setImageLoaded(true);
        setImageError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image load success
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  // Handle image load error
  const handleImageError = () => {
    setImageLoaded(false);
    setImageError(true);
  };

  // Reset image
  const resetImage = () => {
    setPreviewUrl(null);
    setImageFile(null);
    setImageLoaded(false);
    setImageError(false);
  };

  // Render image preview section
  const renderImagePreview = () => {
    if (!previewUrl) {
      return (
        <div className="w-full h-48 bg-gray-200 rounded mb-2 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <PictureOutlined style={{ fontSize: '48px', marginBottom: '8px' }} />
            <div>No image selected</div>
          </div>
        </div>
      );
    }

    if (imageError) {
      return (
        <div className="w-full h-48 bg-red-100 rounded mb-2 flex items-center justify-center">
          <div className="text-center text-red-500">
            <PictureOutlined style={{ fontSize: '48px', marginBottom: '8px' }} />
            <div>Failed to load image</div>
          </div>
        </div>
      );
    }

    return (
      <img
        src={previewUrl}
        alt="Challenge image preview"
        className="w-full rounded mb-2"
        style={{ maxHeight: "200px", objectFit: "contain" }}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    );
  };

  const handleChallengeSubmit = async (values) => {
    try {
      const formData = new FormData();
      const jsonData = {
        name: values.name,
        description: values.description,
      };
  
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (editingChallenge?.image) {
        formData.append('image', editingChallenge.image);
      }
  
      formData.append('data', JSON.stringify(jsonData));
  
      if (editingChallenge) {
        await updateDailyChallenge({
          id: editingChallenge._id,
          challengeData: formData,
        });
        message.success("Challenge updated successfully!");
      } else {
        await createDailyChallenge(formData);
        message.success("Challenge created successfully!");
      }
  
      challengeForm.resetFields();
      setImageFile(null);
      setPreviewUrl(null);
      setEditingChallenge(null);
      setChallengeModalVisible(false);
      setImageLoaded(false);
      setImageError(false);
      refetchChallenges();
    } catch (error) {
      console.error("Failed to save challenge:", error);
      message.error("Failed to save challenge");
    }
  };



const handleStatusToggle = async (challengeId, currentStatus) => {
  const newStatus = currentStatus === "active" ? "inactive" : "active";

  Modal.confirm({
    title: `Are you sure you want to change the challenge status to ${newStatus}?`,
    okText: "Yes",
    cancelText: "No",
    okButtonProps: {
      style: {
        backgroundColor: "#CA3939", 
        // borderColor: "#4CAF50",
        color: "#fff",
      },
    },
    cancelButtonProps: {
      style: {
        // backgroundColor: "#f44336", 
        borderColor: "#000",
        color: "#000",
      },
    },
  

    onOk: async () => {
      try {
        await updateDailyChallengeStatus({
          id: challengeId,
          data: { status: newStatus },
        });
        message.success(`Challenge status updated to ${newStatus}`);
        refetchChallenges();
      } catch (error) {
        console.error("Failed to update challenge status:", error);
        message.error("Failed to update challenge status");
      }
    },
    onCancel() {
      console.log("Status update canceled");
    },
  });
};

  
  const handleDeleteChallenge = async (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this challenge?",
      content: "This action cannot be undone.",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await deleteDailyChallenge(id);
          message.success("Challenge deleted successfully!");
          refetchChallenges();
        } catch (error) {
          console.error("Failed to delete challenge:", error);
          message.error("Failed to delete challenge");
        }
      },
    });
  };

  const handleEditChallenge = (challenge) => {
    setEditingChallenge(challenge);
    setChallengeModalVisible(true);
  };

  const handleViewChallenge = (challenge) => {
    navigate(`/challenge-details/${challenge._id}`, { state: { challenge } });
  };

  const handleModalCancel = () => {
    setChallengeModalVisible(false);
    setEditingChallenge(null);
    challengeForm.resetFields();
    setImageFile(null);
    setPreviewUrl(null);
    setImageLoaded(false);
    setImageError(false);
  };

  const challengeColumns = [
    {
      title: "Challenge Name",
      key: "challengeName",
      width:"20%",
      render: (_, record) => (
        <div className="flex items-center">
          <p className="font-medium text-wrap">{record.name || "Untitled Challenge"}</p>
        </div>
      ),
    },
    {
      title: " Image",
      key: "challengeImage",
      width:"10%",
      render: (_, record) => (
        <div className="flex items-center">
          {record.image && (
            <img
              src={getImageUrl(record.image)}
              alt={record.name || "Challenge"}
              style={{ width: 120, height: 60, objectFit: "cover" }}
              className="rounded "
            />
          )}
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width:"35%",
   
      render: (text) => <p className="truncate max-w-[320px] text-wrap">{text.slice(0, 100)}...</p>,
    },
    // {
    //   title: "Status",
    //   key: "status",
    //   render: (_, record) => (
    //     <div className="flex items-center space-x-2">
    //       <Tag color={record.status === "active" ? "green" : "red"}>
    //         {record.status || "inactive"}
    //       </Tag>
    //     </div>
    //   ),
    // },
    {
      title: "Actions",
      key: "actions",
      width:"10%",
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <Button
            size="middle"
            className="bg-primary text-white hover:bg-primary/80 border-none hover:text-white py-4 px-6"
            icon={<EyeOutlined />}
            onClick={() => handleViewChallenge(record)}
          ></Button>
          <Button
            size="middle"
            className="bg-primary text-white hover:bg-primary/80 border-none hover:text-white py-4 px-6"
            icon={<EditOutlined />}
            onClick={() => handleEditChallenge(record)}
          ></Button>
          {/* <Switch
            checked={record.status === "active"}
            onChange={() => handleStatusToggle(record._id, record.status)}
            size="small"
            className="hover:bg-red-600 border-none hover:text-white text-red-500"
          /> */}
          <Button
            className="bg-primary text-white hover:bg-primary/80 border-none hover:text-white py-4 px-10"
            size="middle"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteChallenge(record._id)}
          ></Button>
        </div>
      ),
    },
  ];

  return (
    <div>
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

      {/* Controls */}
      <div className="mb-4 flex justify-end">
        <div>
          <button
            onClick={() => setViewMode(viewMode === "table" ? "drag" : "table")}
            className="py-2 rounded-md px-4 border-none mr-2 bg-primary text-white hover:bg-secondary"
          >
            {viewMode === "table" ? "Do Shuffle" : "Table Mode"}
          </button>
        </div>
        
        <GradientButton
          onClick={() => {
            setEditingChallenge(null);
            setChallengeModalVisible(true);
          }}
          icon={<PlusOutlined />}
        >
          Add New Challenge
        </GradientButton>
      </div>

      {/* Display challenges - either in table or drag-and-drop mode */}
      {viewMode === "table" ? (
       <div className="border-2 rounded-lg">
         <Table
          columns={challengeColumns}
          dataSource={sortedChallenges}
          rowKey="_id"
          loading={challengesLoading}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: "No challenges found" }}
          className="custom-table"
          size="middle"
          scroll={{ x: "max-content" }}
        />
       </div>
      ) : (
        <DragDropList
          items={localChallenges}
          onReorder={handleReorder}
          onUpdateOrder={handleUpdateOrder}
          hasChanges={hasOrderChanges}
          renderItem={(challenge, index, draggedItem) => (
            <ChallengeCard
              challenge={challenge}
              onEdit={handleEditChallenge}
              onView={handleViewChallenge}
              onDelete={handleDeleteChallenge}
              onStatusChange={handleStatusToggle}
              isDragging={draggedItem?._id === challenge._id}
              serialNumber={challenge.serial || index + 1}
            />
          )}
        />
      )}

      {/* Challenge Modal */}
      <Modal
        title={editingChallenge ? "Edit Challenge" : "Add New Challenge"}
        open={challengeModalVisible}
        onCancel={handleModalCancel}
        footer={[
          <Button key="cancel" onClick={handleModalCancel} className="py-5">
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => challengeForm.submit()}
            className="bg-primary text-white py-5 px-8"
          >
            {editingChallenge ? "Update" : "Create"} Challenge
          </Button>,
        ]}
        width={600}
      >
        <Form form={challengeForm} layout="vertical" onFinish={handleChallengeSubmit}>
          <Form.Item
            name="name"
            label="Challenge Name"
            rules={[{ required: true, message: "Please enter challenge name" }]}
          >
            <Input placeholder="Enter challenge name" className="py-5" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please enter description" }]}
          >
            <TextArea rows={4} placeholder="Enter challenge description" />
          </Form.Item>

          <Form.Item name="image" label="Challenge Image">
            <div className="bg-gray-100 p-1 rounded">
              {renderImagePreview()}
              <div className="flex justify-between">
                <Upload
                  beforeUpload={() => false}
                  onChange={handleImageChange}
                  maxCount={1}
                  showUploadList={false}
                  accept="image/*"
                >
                  <Button icon={<UploadOutlined />}>Select Image</Button>
                </Upload>
                {/* <Button
                  icon={<ReloadOutlined />}
                  size="small"
                  shape="circle"
                  onClick={resetImage}
                  title="Reset image"
                /> */}
              </div>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TodayVideos;
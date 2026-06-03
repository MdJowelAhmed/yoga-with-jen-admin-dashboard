import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  message,
  Upload,
  Image,
} from "antd";
import { UploadOutlined, InboxOutlined } from "@ant-design/icons";
import { useUpdateVideoINCategoryAndSubcategoryMutation } from "../../redux/apiSlices/videoApi";
import { getVideoAndThumbnail } from "../common/imageUrl";

const { TextArea } = Input;

const EditVideoModal = ({
  visible,
  onCancel,
  onSuccess,
  currentVideo,
  onUpdateVideo,
  isLoading
}) => {
  const [form] = Form.useForm();
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [fileList, setFileList] = useState([]);
  
  // Initialize form data when modal opens or currentVideo changes
  useEffect(() => {
    if (visible && currentVideo) {
      form.setFieldsValue({
        title: currentVideo.title || "",
        description: currentVideo.description || "",
      });
      
      // Reset thumbnail preview if there's a thumbnailUrl
      if (currentVideo.thumbnailUrl) {
        setThumbnailPreview(currentVideo.thumbnailUrl);
      } else {
        setThumbnailPreview(null);
      }
      
      setThumbnailFile(null);
      setFileList([]);
    } else if (visible) {
      form.resetFields();
      setThumbnailPreview(null);
      setThumbnailFile(null);
      setFileList([]);
    }
  }, [visible, currentVideo, form]);

  // Handle thumbnail upload - Fixed version
  const handleThumbnailChange = ({ file, fileList }) => {
    setFileList(fileList);
    
    if (file.status === 'removed') {
      setThumbnailFile(null);
      setThumbnailPreview(currentVideo?.thumbnailUrl || null);
      return;
    }

    const selectedFile = file.originFileObj || file;
    
    if (selectedFile) {
      setThumbnailFile(selectedFile);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Alternative method using beforeUpload
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
      return false;
    }

    setThumbnailFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setThumbnailPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    return false; // Prevent automatic upload
  };

  // Submit handler
  const handleSubmit = async (values) => {
    try {
      if (!currentVideo?._id) {
        message.error("Video ID is missing");
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      
      // Add basic data
      const updateData = {
        title: values.title,
        description: values.description,
      };
      
      formData.append("data", JSON.stringify(updateData));
      
      // Add thumbnail if selected
      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      }

      await onUpdateVideo({
        id: currentVideo._id,
        updateData: formData,
      }).unwrap();

      message.success("Video updated successfully");
      onSuccess();
      onCancel();
    } catch (error) {
      console.error("Update error:", error);
      message.error("Failed to update video");
    }
  };

  return (
    <Modal
      title="Edit Video"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: "Please enter title" }]}
        >
          <Input placeholder="Video Title" className="py-3" />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: "Please enter description" }]}
        >
          <TextArea rows={4} placeholder="Video description" />
        </Form.Item>

        <Form.Item
          label="Thumbnail"
          name="thumbnail"
        >
          <div className="flex flex-col gap-4">
            {thumbnailPreview && (
              <div className="mb-4">
                <p className="mb-2">
                  {thumbnailFile ? "New Thumbnail Preview:" : "Current Thumbnail:"}
                </p>
                <Image 
                  src={thumbnailFile ? thumbnailPreview : getVideoAndThumbnail(thumbnailPreview)} 
                  alt="Thumbnail Preview" 
                  style={{ maxWidth: '300px', maxHeight: '200px', borderRadius: '8px' }} 
                />
              </div>
            )}
            <Upload
              name="thumbnail"
              fileList={fileList}
              beforeUpload={beforeUpload}
              onChange={handleThumbnailChange}
              onRemove={() => {
                setThumbnailFile(null);
                setThumbnailPreview(currentVideo?.thumbnailUrl || null);
                setFileList([]);
              }}
              maxCount={1}
              accept="image/*"
              listType="text"
            >
              <Button icon={<UploadOutlined />}>
                {thumbnailFile ? "Change Thumbnail" : "Upload New Thumbnail"}
              </Button>
            </Upload>
          </div>
        </Form.Item>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            onClick={onCancel}
            disabled={isLoading}
            className="py-2 px-6"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            className="bg-primary py-2 px-6"
          >
            Update Video
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditVideoModal;
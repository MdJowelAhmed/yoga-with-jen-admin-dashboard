import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Form,
  Input,
  Tag,
  Button,
  message,
  Upload,
  Progress,
  Alert,
} from "antd";
import {
  InboxOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  useAddVideoMutation,
  useUpdateVideoMutation,
} from "../../redux/apiSlices/videoApi";
import { getBaseUrl } from "../../redux/api/baseUrl";
import { isProduction } from "../../redux/api/baseApi";

const { TextArea } = Input;
const { Dragger } = Upload;

const VideoUploadModal = ({
  visible,
  onCancel,
  onSuccess,
  currentVideo,
  equipmentTags,
  setEquipmentTags,
}) => {
  const [form] = Form.useForm();
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [tagInput, setTagInput] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [bunnyVideoData, setBunnyVideoData] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const xhrRef = useRef(null);
  const startTimeRef = useRef(0);
  const uploadedBytesRef = useRef(0);

  const isEditMode = !!currentVideo?._id;

  const [addVideo, { isLoading: isAdding }] = useAddVideoMutation();
  const [updateVideo, { isLoading: isUpdating }] = useUpdateVideoMutation();

  const isLoading = isAdding || isUpdating || uploadingVideo;

  useEffect(() => {
    if (visible && currentVideo) {
      form.setFieldsValue({
        title: currentVideo.title,
        duration: currentVideo.duration || "",
        description: currentVideo.description || "",
      });

      if (currentVideo.equipment?.length) {
        setEquipmentTags(currentVideo.equipment);
      }

      setThumbnailFile(null);
      setVideoFile(null);
      setTagInput("");
      setBunnyVideoData(null);
      setUploadProgress(0);
    } else if (visible) {
      form.resetFields();
      setThumbnailFile(null);
      setVideoFile(null);
      setTagInput("");
      setEquipmentTags([]);
      setBunnyVideoData(null);
      setUploadProgress(0);
    }
  }, [visible, currentVideo, form, setEquipmentTags]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  // Format time for upload remaining
  const formatTime = (seconds) => {
    if (!seconds || seconds === Infinity) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate upload speed and time remaining
  const calculateProgress = (loaded, total) => {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTimeRef.current) / 1000; // seconds

    if (elapsedTime > 0) {
      const speed = loaded / elapsedTime; // bytes per second
      const remaining = (total - loaded) / speed; // seconds

      setUploadSpeed(speed);
      setTimeRemaining(remaining);
    }
  };

  const handleThumbnailUpload = (info) => {
    const file = info.fileList[0];
    if (!file) return;

    const fileObj = file.originFileObj || file;

    if (!fileObj.type.startsWith('image/')) {
      message.error('Please upload a valid image file');
      return;
    }

    const maxSize = 20 * 1024 * 1024; // 20MB
    if (fileObj.size > maxSize) {
      message.error('Thumbnail must be less than 20MB');
      return;
    }

    setThumbnailFile(fileObj);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result);
    };
    reader.readAsDataURL(fileObj);

    message.success('Thumbnail selected successfully');
  };

  const handleVideoUpload = (info) => {
    const file = info.fileList[0];
    if (!file) return;

    const fileObj = file.originFileObj || file;

    if (!fileObj.type.startsWith('video/')) {
      message.error('Please upload a valid video file');
      return;
    }

    const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
    if (fileObj.size > maxSize) {
      message.error('Video file must be less than 10GB');
      return;
    }

    setVideoFile(fileObj);

    // Create preview (only for smaller files to avoid memory issues)
    if (fileObj.size < 200 * 1024 * 1024) { // Only preview files under 200MB
      const url = URL.createObjectURL(fileObj);
      setVideoPreview(url);
    } else {
      setVideoPreview('large-file'); // Flag for large files
    }

    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = Math.floor(video.duration);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;
      form.setFieldsValue({ duration: formatted });
      message.success('Video selected successfully');
    };
    video.src = URL.createObjectURL(fileObj);
  };

  const addTag = () => {
    if (tagInput.trim() && !equipmentTags.includes(tagInput.trim())) {
      setEquipmentTags([...equipmentTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setEquipmentTags(equipmentTags.filter((tag) => tag !== tagToRemove));
  };

  const handleEquipmentKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  // Cancel upload functionality
  const cancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setUploadingVideo(false);
    setUploadProgress(0);
    setUploadSpeed(0);
    setTimeRemaining(0);
    setUploadStatus("");
    message.info('Upload cancelled');
  };

  const uploadVideoAndThumbnail = async (videoFile, thumbnailFile, title) => {
    return new Promise((resolve, reject) => {
      try {
        setUploadingVideo(true);
        setUploadStatus("Preparing upload...");
        setUploadProgress(0);
        setUploadSpeed(0);
        setTimeRemaining(0);
        startTimeRef.current = Date.now();
        uploadedBytesRef.current = 0;

        // Create FormData with video and thumbnail
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('thumbnail', thumbnailFile);

        setUploadStatus("Uploading video and thumbnail...");

        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        // Progress tracking
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(percentComplete);
            uploadedBytesRef.current = e.loaded;
            calculateProgress(e.loaded, e.total);
            setUploadStatus(`Uploading: ${percentComplete}%`);
          }
        });

        // Success
        xhr.addEventListener("load", () => {
          if (xhr.status === 200 || xhr.status === 201) {
            try {
              const response = JSON.parse(xhr.responseText);
              setUploadStatus("Upload complete! Processing...");
              setUploadProgress(100);
              xhrRef.current = null;

              // Response structure: { data: { videoId, libraryId, videoUrl, downloadUrl, isDrmEnabled } }
              resolve(response.data);
            } catch (parseError) {
              xhrRef.current = null;
              reject(new Error("Failed to parse server response"));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              xhrRef.current = null;
              reject(new Error(error.message || 'Upload failed'));
            } catch {
              xhrRef.current = null;
              reject(new Error(`Upload failed with status: ${xhr.status}`));
            }
          }
        });

        // Error
        xhr.addEventListener("error", () => {
          xhrRef.current = null;
          reject(new Error("Network error occurred. Please check your connection."));
        });

        // Timeout
        xhr.addEventListener("timeout", () => {
          xhrRef.current = null;
          reject(new Error("Upload timeout. Please try again."));
        });

        // Abort
        xhr.addEventListener("abort", () => {
          xhrRef.current = null;
          reject(new Error("Upload cancelled"));
        });

        // Send request with extended timeout
        xhr.open('POST', `${getBaseUrl(isProduction)}/api/v1/admin/videos/library/generate-upload-url`);
        xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("token")}`);
        xhr.timeout = 3600000; // 1 hour timeout for large files
        xhr.send(formData);

      } catch (error) {
        xhrRef.current = null;
        reject(error);
      }
    });
  };

  // const uploadThumbnailToBunnyStorage = async (thumbnailFile) => {
  //   try {
  //     const formData = new FormData();
  //     formData.append("thumbnail", thumbnailFile);

  //     const response = await fetch(`${getBaseUrl(isProduction)}/api/v1/admin/videos/library/thumbnail`, {
  //       method: "POST",
  //       headers: {
  //         "Authorization": `Bearer ${localStorage.getItem("token")}`
  //       },
  //       body: formData,
  //     });

  //     if (!response.ok) return null;

  //     const result = await response.json();
  //     return result.data;
  //   } catch {
  //     return null;
  //   }
  // };

  const handleSubmit = async (values) => {
    if (!isEditMode && (!thumbnailFile || !videoFile)) {
      message.error("Please upload both thumbnail and video");
      return;
    }

    if (equipmentTags.length === 0) {
      message.error("Please add at least one equipment tag");
      return;
    }

    let videoUrl = currentVideo?.videoUrl;
    let thumbnailUrl = currentVideo?.thumbnailUrl;
    let videoId = currentVideo?.videoId;
    let downloadUrl = currentVideo?.downloadUrl;

    try {
      if (!isEditMode && videoFile && thumbnailFile) {
        // Upload video and thumbnail together
        const uploadResponse = await uploadVideoAndThumbnail(videoFile, thumbnailFile, values.title);

        // Response contains: { videoId, libraryId, videoUrl, downloadUrl, thumbnailUrl?, isDrmEnabled }
        videoUrl = uploadResponse.videoUrl;
        videoId = uploadResponse.videoId;
        downloadUrl = uploadResponse.downloadUrl;

        // Thumbnail URL is included in the response if upload was successful
        if (uploadResponse.thumbnailUrl) {
          thumbnailUrl = uploadResponse.thumbnailUrl;
        }

        setBunnyVideoData(uploadResponse);
      }

      let formattedDuration = values.duration;
      if (!formattedDuration.includes("Min")) {
        formattedDuration = `${formattedDuration} Min`;
      }

      const videoData = {
        title: values.title,
        duration: formattedDuration,
        description: values.description || "",
        equipment: equipmentTags,
        videoUrl: videoUrl,
        downloadUrl: downloadUrl,
        videoId: videoId,
        ...(thumbnailUrl && { thumbnailUrl }),
      };

      setUploadStatus("Saving metadata...");

      if (isEditMode) {
        if (thumbnailFile) {
          const uploadedThumbnailUrl = await uploadThumbnailToBunnyStorage(
            thumbnailFile
          );
          if (uploadedThumbnailUrl) {
            videoData.thumbnailUrl = uploadedThumbnailUrl;
          }
        }

        await updateVideo({
          id: currentVideo._id,
          videoData: videoData,
        }).unwrap();
      } else {
        await addVideo(videoData).unwrap();
      }

      message.success(`Video ${isEditMode ? "updated" : "added"} successfully`);

      // Clean up
      if (videoPreview && videoPreview !== 'large-file') {
        URL.revokeObjectURL(videoPreview);
      }

      setUploadingVideo(false);
      setUploadProgress(0);
      setUploadSpeed(0);
      setTimeRemaining(0);
      setVideoPreview('');
      setThumbnailPreview(null);
      onSuccess();
      onCancel();
    } catch (error) {
      setUploadingVideo(false);
      setUploadSpeed(0);
      setTimeRemaining(0);
      xhrRef.current = null;

      const errorMessage = error?.data?.message
        || error?.message
        || `Failed to ${isEditMode ? "update" : "add"} video`;

      message.error(errorMessage);
    }
  };

  const uploadProps = {
    beforeUpload: () => false,
    maxCount: 1,
    showUploadList: false,
  };

  const thumbnailProps = {
    ...uploadProps,
    accept: "image/jpeg,image/jpg,image/png,image/webp",
    onChange: handleThumbnailUpload,
  };

  const videoProps = {
    ...uploadProps,
    accept: "video/mp4,video/webm,video/mov,video/avi",
    onChange: handleVideoUpload,
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <VideoCameraOutlined className="text-xl" />
          <span>{isEditMode ? "Edit Video" : "Upload New Video"}</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={900}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {uploadingVideo && (
          <Alert
            message={
              <div className="flex items-center gap-3">
                <CloudUploadOutlined className="text-blue-600 text-xl animate-pulse" />
                <span className="font-medium">{uploadStatus}</span>
              </div>
            }
            description={
              <div className="space-y-3">
                <Progress
                  percent={uploadProgress}
                  status={uploadProgress === 100 ? "success" : "active"}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                  showInfo={true}
                />

                {/* Upload Stats */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="flex justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <span>Speed:</span>
                      <span className="font-semibold">{formatFileSize(uploadSpeed)}/s</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>⏱</span>
                      <span>{formatTime(timeRemaining)} remaining</span>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Uploading large files may take several minutes. Please don't close this page.
                </p>

                {/* Cancel Button */}
                {uploadProgress < 100 && (
                  <Button
                    size="small"
                    danger
                    onClick={cancelUpload}
                    className="w-full"
                  >
                    Cancel Upload
                  </Button>
                )}
              </div>
            }
            type="info"
            className="mb-4"
          />
        )}

        <Form.Item
          label="Video Title"
          name="title"
          rules={[
            { required: true, message: "Please enter video title" },
            { min: 3, message: "Title must be at least 3 characters" }
          ]}
        >
          <Input
            placeholder="Enter video title"
            size="large"
            disabled={uploadingVideo}
            className="py-6"
          />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label="Duration"
            name="duration"
            rules={[
              { required: true, message: "Please enter duration" },
              {
                pattern: /^\d+:\d{2}$/,
                message: "Format: MM:SS (e.g., 10:30)"
              }
            ]}
          >
            <Input
              placeholder="MM:SS (e.g., 10:30)"
              size="large"
              disabled={uploadingVideo}
              className="py-6"
            />
          </Form.Item>

          <Form.Item
            label="Equipment"
            required
          >
            <div className="space-y-2">
              <Input
                placeholder="Add equipment and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleEquipmentKeyPress}
                size="medium"
                disabled={uploadingVideo}
                suffix={
                  <Button
                    type="text"
                    onClick={addTag}
                    disabled={!tagInput.trim() || uploadingVideo}
                  >
                    Add
                  </Button>
                }
              />
              {equipmentTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {equipmentTags.map((equipment, index) => (
                    <Tag
                      key={index}
                      closable={!uploadingVideo}
                      onClose={() => removeTag(equipment)}
                      color="red"
                    >
                      {equipment}
                    </Tag>
                  ))}
                </div>
              )}
              {equipmentTags.length === 0 && (
                <p className="text-xs text-red-500">At least one equipment is required</p>
              )}
            </div>
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item label="Thumbnail Image" required={!isEditMode}>
            <Dragger {...thumbnailProps} disabled={uploadingVideo}>
              <p className="ant-upload-drag-icon">
                <FileImageOutlined style={{ color: thumbnailFile ? '@CA3939' : '#CA3939' }} />
              </p>
              <p className="ant-upload-text">
                {thumbnailFile ? 'Thumbnail Selected' : 'Click or drag to upload'}
              </p>
              <p className="ant-upload-hint">
                Support: JPG, PNG, WEBP (Max 20MB)
              </p>
            </Dragger>

            {thumbnailFile && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircleOutlined className="text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        {thumbnailFile.name}
                      </p>
                      <p className="text-xs text-green-600">
                        {formatFileSize(thumbnailFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseCircleOutlined />}
                    onClick={() => setThumbnailFile(null)}
                    disabled={uploadingVideo}
                    danger
                  />
                </div>
              </div>
            )}

            {isEditMode && !thumbnailFile && currentVideo?.thumbnailUrl && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-600">
                  Current thumbnail will be kept if not changed
                </p>
              </div>
            )}
          </Form.Item>

          <Form.Item label="Video File" required={!isEditMode}>
            {isEditMode ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
                <div className="text-center">
                  <VideoCameraOutlined className="text-4xl text-gray-400 mb-3" />
                  <p className="text-gray-600 font-medium mb-1">Video Cannot Be Changed</p>
                  <p className="text-xs text-gray-500">
                    Video files are locked after upload for security reasons
                  </p>
                  {currentVideo?.videoId && (
                    <div className="mt-3 p-2 bg-white rounded border border-gray-200">
                      <p className="text-xs text-gray-600">
                        Video ID: <span className="font-mono text-gray-800">{currentVideo.videoId}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Dragger {...videoProps} disabled={uploadingVideo}>
                  <p className="ant-upload-drag-icon">
                    <VideoCameraOutlined style={{ color: videoFile ? '#CA3939' : '#CA3939' }} />
                  </p>
                  <p className="ant-upload-text">
                    {videoFile ? 'Video Selected' : 'Click or drag to upload'}
                  </p>
                  <p className="ant-upload-hint">
                    Support: MP4, WEBM, MOV, AVI (Max 10GB)
                  </p>
                </Dragger>

                {videoFile && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircleOutlined className="text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            {videoFile.name}
                          </p>
                          <p className="text-xs text-green-600">
                            {formatFileSize(videoFile.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="text"
                        size="small"
                        icon={<CloseCircleOutlined />}
                        onClick={() => setVideoFile(null)}
                        disabled={uploadingVideo}
                        danger
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </Form.Item>
        </div>

        <Form.Item
          label="Description"
          name="description"
          rules={[
            { required: true, message: "Please enter description" },
            { min: 10, message: "Description must be at least 10 characters" }
          ]}
        >
          <TextArea
            rows={4}
            placeholder="Enter video description (minimum 10 characters)"
            disabled={uploadingVideo}
          />
        </Form.Item>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            size="large"
            onClick={onCancel}
            disabled={uploadingVideo}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            loading={isLoading}
            disabled={uploadingVideo && uploadProgress < 100}
            icon={<CloudUploadOutlined />}
            className="bg-[#CA3939] text-white"
          >
            {uploadingVideo
              ? `Uploading... ${uploadProgress}%`
              : isEditMode
                ? "Update Video"
                : "Upload Video"
            }
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default VideoUploadModal;

import { useState, useEffect, useRef } from "react";
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

const getOptimalChunkSize = (fileSize) => {
  const MB = 1024 * 1024;
  const GB = 1024 * MB;

  if (fileSize < 100 * MB) return 5 * MB;
  if (fileSize < 500 * MB) return 10 * MB;
  if (fileSize < 2 * GB) return 15 * MB;
  if (fileSize < 5 * GB) return 20 * MB;
  return 25 * MB;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const POST_UPLOAD_BUFFER = 20000;

// Sleep helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const [uploadStatus, setUploadStatus] = useState("");
  const [currentFile, setCurrentFile] = useState("");
  const [overallProgress, setOverallProgress] = useState(0);
  const [chunkSize, setChunkSize] = useState(5 * 1024 * 1024);
  const [totalChunks, setTotalChunks] = useState(0);
  const abortControllerRef = useRef(null);
  const uploadIdRef = useRef(null);
  const videoElementRef = useRef(null);

  const isEditMode = !!currentVideo?._id;

  const [addVideo, { isLoading: isAdding }] = useAddVideoMutation();
  const [updateVideo, { isLoading: isUpdating }] = useUpdateVideoMutation();

  const isLoading = isAdding || isUpdating || uploadingVideo;

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (videoElementRef.current && videoElementRef.current.src) {
        URL.revokeObjectURL(videoElementRef.current.src);
      }
    };
  }, []);

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

      resetUploadState();
    } else if (visible) {
      form.resetFields();
      setEquipmentTags([]);
      resetUploadState();
    }
  }, [visible, currentVideo]);

  const resetUploadState = () => {
    setThumbnailFile(null);
    setVideoFile(null);
    setTagInput("");
    setUploadProgress(0);
    setOverallProgress(0);
    setUploadStatus("");
    setCurrentFile("");
    setChunkSize(5 * 1024 * 1024);
    setTotalChunks(0);
    uploadIdRef.current = null;

    if (videoElementRef.current && videoElementRef.current.src) {
      URL.revokeObjectURL(videoElementRef.current.src);
      videoElementRef.current = null;
    }
  };

  const validateImageFile = (file) => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    return validTypes.includes(file.type);
  };

  const validateVideoFile = (file) => {
    const validTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
    ];
    return validTypes.includes(file.type);
  };

  const handleThumbnailUpload = (info) => {
    const file = info.fileList[0];
    if (!file) return;

    const fileObj = file.originFileObj || file;

    if (!validateImageFile(fileObj)) {
      message.error("Please upload a valid image file (JPG, PNG, WEBP)");
      return;
    }

    const maxSize = 20 * 1024 * 1024;
    if (fileObj.size > maxSize) {
      message.error("Thumbnail must be less than 20MB");
      return;
    }

    setThumbnailFile(fileObj);
    message.success("Thumbnail selected successfully");
  };

  const handleVideoUpload = (info) => {
    const file = info.fileList[0];
    if (!file) return;

    const fileObj = file.originFileObj || file;

    if (!validateVideoFile(fileObj)) {
      message.error("Please upload a valid video file (MP4, WEBM, MOV, AVI)");
      return;
    }

    const maxSize = 10 * 1024 * 1024 * 1024;
    if (fileObj.size > maxSize) {
      message.error("Video file must be less than 10GB");
      return;
    }

    const optimalChunkSize = getOptimalChunkSize(fileObj.size);
    const calculatedTotalChunks = Math.ceil(fileObj.size / optimalChunkSize);

    setChunkSize(optimalChunkSize);
    setTotalChunks(calculatedTotalChunks);
    setVideoFile(fileObj);

    message.success(
      `Video selected: ${formatFileSize(fileObj.size)} | Chunk size: ${formatFileSize(optimalChunkSize)} | Total chunks: ${calculatedTotalChunks}`,
    );

    if (videoElementRef.current?.src) {
      URL.revokeObjectURL(videoElementRef.current.src);
    }

    const video = document.createElement("video");
    videoElementRef.current = video;
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      const duration = Math.floor(video.duration);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;
      form.setFieldsValue({ duration: formatted });
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      message.error("Failed to load video metadata");
      if (video.src) {
        URL.revokeObjectURL(video.src);
      }
      videoElementRef.current = null;
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

  const calculateOverallProgress = (currentFileType, fileProgress) => {
    const thumbnailWeight = 10;
    const videoWeight = 85;
    const processingWeight = 5;

    if (currentFileType === "thumbnail") {
      return Math.round((fileProgress * thumbnailWeight) / 100);
    } else if (currentFileType === "video") {
      return Math.round(10 + (fileProgress * videoWeight) / 100);
    } else if (currentFileType === "processing") {
      return Math.round(95 + (fileProgress * processingWeight) / 100);
    }
    return 0;
  };

  const uploadChunkWithRetry = async (
    formData,
    chunkIndex,
    totalChunks,
    retries = MAX_RETRIES,
  ) => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error("Upload cancelled");
        }

        const response = await fetch(
          `${getBaseUrl(isProduction)}/api/v1/admin/videos/library/upload-chunk`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: formData,
            signal: abortControllerRef.current?.signal,
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Chunk upload failed: ${response.statusText}`,
          );
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error("Chunk upload not confirmed by backend");
        }

        return result;
      } catch (error) {
        if (
          error.name === "AbortError" ||
          error.message === "Upload cancelled"
        ) {
          throw error;
        }

        if (attempt < retries - 1) {
          const delay = RETRY_DELAY * (attempt + 1);
        
          await sleep(delay);
        } else {
          throw error;
        }
      }
    }
  };

  const uploadFileInChunks = async (file, fileType) => {
    const currentChunkSize = fileType === "video" ? chunkSize : 5 * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / currentChunkSize);
    const uploadId = uploadIdRef.current;

    setCurrentFile(fileType === "video" ? "Video" : "Thumbnail");

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error("Upload cancelled");
      }

      const start = chunkIndex * currentChunkSize;
      const end = Math.min(start + currentChunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("chunk", chunk);
      formData.append("chunkIndex", chunkIndex.toString());
      formData.append("totalChunks", totalChunks.toString());
      formData.append("fileName", file.name);
      formData.append("uploadId", uploadId);
      formData.append("fileType", fileType);

      await uploadChunkWithRetry(formData, chunkIndex, totalChunks);

      const fileProgress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
      setUploadProgress(fileProgress);

      const overall = calculateOverallProgress(fileType, fileProgress);
      setOverallProgress(overall);

      setUploadStatus(
        `Uploading ${fileType}: ${fileProgress}% (${chunkIndex + 1}/${totalChunks} chunks)`,
      );

    }

    setUploadStatus(`Finalizing ${fileType} on server...`);
    await sleep(POST_UPLOAD_BUFFER);

  };

  // NEW: Verify upload status function
  const verifyUploadStatus = async (uploadId, maxRetries = 5) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(
          `${getBaseUrl(isProduction)}/api/v1/admin/videos/library/verify-upload/${uploadId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Verification failed: ${response.status}`);
        }

        const result = await response.json();

        if (result.data?.ready) {
          return result.data;
        }

        if (attempt < maxRetries) {
          await sleep(15000);
        }
      } catch (error) {
        if (attempt === maxRetries) {
          throw new Error(
            `Verification failed after ${maxRetries} attempts: ${error.message}`,
          );
        }
        await sleep(3000);
      }
    }

    throw new Error("Files not ready after verification retries");
  };

  // FIXED: Complete upload with proper error handling
  const completeUpload = async (maxRetries = 3) => {
    setUploadStatus("Verifying upload completion...");

    // STEP 1: Verify files are ready
    try {
      const verification = await verifyUploadStatus(uploadIdRef.current, 5);
    } catch (error) {
      message.error(error.message);
      throw error;
    }

    // STEP 2: Call complete upload API
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        setUploadStatus(
          `Processing files... (Attempt ${attempt}/${maxRetries})`,
        );
        setCurrentFile("processing");

        const processingProgress = Math.round((attempt / maxRetries) * 100);
        setOverallProgress(
          calculateOverallProgress("processing", processingProgress),
        );

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000);

        const response = await fetch(
          `${getBaseUrl(isProduction)}/api/v1/admin/videos/library/complete-upload`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              uploadId: uploadIdRef.current,
            }),
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        const result = await response.json();

        // Handle 409 Conflict - already processing
        if (response.status === 409) {
         
          if (attempt < maxRetries) {
            const waitTime = 10000 * attempt; 
            await sleep(waitTime);

            // Check if processing completed
            try {
              const status = await verifyUploadStatus(uploadIdRef.current, 1);
              if (status.processed) {
                setOverallProgress(100);
                return { alreadyProcessed: true };
              }
            } catch (e) {
            }
            continue;
          }
          throw new Error(
            "Upload is being processed. Please refresh the page in a moment.",
          );
        }

        if (!response.ok) {
          // Handle already processed case
          if (
            result.message?.includes("already uploaded") ||
            result.data?.alreadyProcessed
          ) {
            setOverallProgress(100);
            return { alreadyProcessed: true };
          }

          throw new Error(result.message || `HTTP ${response.status}`);
        }

        setOverallProgress(100);
        return result.data;
      } catch (error) {
        console.error(`Complete upload error (attempt ${attempt}):`, error);

        if (error.name === "AbortError") {
          throw new Error(
            "Upload processing timeout. Please check your network.",
          );
        }

        if (attempt < maxRetries) {
          const delay = 5000 * attempt;
          await sleep(delay);
        } else {
          throw error;
        }
      }
    }

    throw new Error("Upload completion failed after all retries");
  };

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setUploadingVideo(false);
    setUploadProgress(0);
    setOverallProgress(0);
    setUploadStatus("");
    setCurrentFile("");
    message.info("Upload cancelled");
  };

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
        setUploadingVideo(true);
        setUploadProgress(0);
        setOverallProgress(0);
        abortControllerRef.current = new AbortController();
        uploadIdRef.current = `upload-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // Upload thumbnail
        setUploadStatus("Uploading thumbnail...");
        await uploadFileInChunks(thumbnailFile, "thumbnail");

        // Upload video
        setUploadStatus("Uploading video...");
        setUploadProgress(0);
        await uploadFileInChunks(videoFile, "video");

        // Complete upload
        setUploadStatus("Verifying and processing upload...");
        const uploadResult = await completeUpload(3);

        if (uploadResult?.alreadyProcessed) {
          message.warning("Video was already uploaded, please refresh");
          setUploadingVideo(false);
          onCancel();
          return;
        }

        videoUrl = uploadResult.videoUrl;
        videoId = uploadResult.videoId;
        downloadUrl = uploadResult.downloadUrl;
        thumbnailUrl = uploadResult.thumbnailUrl;
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
        const result = await updateVideo({
          id: currentVideo._id,
          videoData: videoData,
        }).unwrap();
        if (result.success) {
          message.success("Video updated successfully");
        }
      } else {
        const result = await addVideo(videoData).unwrap();
        if (result.success) {
          message.success("Video added successfully");
        }
      }

      setUploadingVideo(false);
      resetUploadState();
      onSuccess();
      onCancel();
    } catch (error) {
      setUploadingVideo(false);
      abortControllerRef.current = null;

      const errorMessage =
        error?.data?.message ||
        error?.message ||
        `Failed to ${isEditMode ? "update" : "add"} video`;

      message.error(errorMessage);
      console.error("Upload error:", error);
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
    accept: "video/mp4,video/webm,video/quicktime,video/x-msvideo",
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
      onCancel={uploadingVideo ? null : onCancel}
      footer={null}
      width={900}
      destroyOnClose
      maskClosable={!uploadingVideo}
      closable={!uploadingVideo}
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
                <div className="text-sm text-gray-600 mb-2">
                  Currently: <strong>{currentFile}</strong>
                  {totalChunks > 0 && (
                    <span className="ml-2 text-xs">
                      (Total chunks: {totalChunks} × {formatFileSize(chunkSize)}
                      )
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">Current file:</div>
                  <Progress
                    percent={uploadProgress}
                    status={uploadProgress === 100 ? "success" : "active"}
                    strokeColor={{
                      "0%": "#108ee9",
                      "100%": "#87d068",
                    }}
                  />
                  <div className="text-xs text-gray-500">Overall:</div>
                  <Progress
                    percent={overallProgress}
                    status={overallProgress === 100 ? "success" : "active"}
                    strokeColor={{
                      "0%": "#CA3939",
                      "100%": "#52c41a",
                    }}
                  />
                </div>

                {currentFile === "processing" ? (
                  <p className="text-xs text-amber-600 font-medium">
                    ⚠️ Processing may take 1-5 minutes. Please wait...
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    Uploading in chunks. Don't close this page.
                  </p>
                )}

                {uploadProgress < 100 && currentFile !== "processing" && (
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
          rules={[{ required: true, message: "Please enter video title" }]}
        >
          <Input
            placeholder="Enter video title"
            size="large"
            disabled={uploadingVideo}
          />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label="Duration"
            name="duration"
            rules={[
              { required: true, message: "Please enter duration" },
              {
                pattern: /^\d+:[0-5]\d$/,
                message: "Format: MM:SS (e.g., 10:30)",
              },
            ]}
          >
            <Input
              placeholder="MM:SS (e.g., 10:30)"
              size="large"
              disabled={uploadingVideo}
            />
          </Form.Item>

          <Form.Item label="Equipment" required>
            <div className="space-y-2">
              <Input
                placeholder="Add equipment and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleEquipmentKeyPress}
                size="large"
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
                <p className="text-xs text-red-500">At least one required</p>
              )}
            </div>
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item label="Thumbnail" required={!isEditMode}>
            <Dragger {...thumbnailProps} disabled={uploadingVideo}>
              <p className="ant-upload-drag-icon">
                <FileImageOutlined
                  style={{ color: thumbnailFile ? "#52c41a" : "#CA3939" }}
                />
              </p>
              <p className="ant-upload-text">
                {thumbnailFile ? "Selected" : "Click or drag"}
              </p>
              <p className="ant-upload-hint">JPG, PNG, WEBP (Max 20MB)</p>
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
          </Form.Item>

          <Form.Item label="Video" required={!isEditMode}>
            {isEditMode ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
                <div className="text-center">
                  <VideoCameraOutlined className="text-4xl text-gray-400 mb-3" />
                  <p className="text-gray-600 font-medium mb-1">
                    Cannot Change Video
                  </p>
                  <p className="text-xs text-gray-500">Locked after upload</p>
                </div>
              </div>
            ) : (
              <>
                <Dragger {...videoProps} disabled={uploadingVideo}>
                  <p className="ant-upload-drag-icon">
                    <VideoCameraOutlined
                      style={{ color: videoFile ? "#52c41a" : "#CA3939" }}
                    />
                  </p>
                  <p className="ant-upload-text">
                    {videoFile ? "Selected" : "Click or drag"}
                  </p>
                  <p className="ant-upload-hint">MP4, WEBM, MOV (Max 10GB)</p>
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
          rules={[{ required: true, message: "Please enter description" }]}
        >
          <TextArea
            rows={4}
            placeholder="Enter description"
            disabled={uploadingVideo}
          />
        </Form.Item>

        <div className="flex justify-end gap-3 mt-6">
          <Button size="large" onClick={onCancel} disabled={uploadingVideo}>
            Cancel
          </Button>
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            loading={isLoading}
            disabled={uploadingVideo && overallProgress < 100}
            icon={<CloudUploadOutlined />}
            style={{
              backgroundColor: "#CA3939",
              color: "#FFFFFF",
              border: "none",
            }}
            className="!text-white"
          >
            {uploadingVideo ? (
              <span style={{ color: "#FFFFFF" }}>{overallProgress}%</span>
            ) : isEditMode ? (
              "Update"
            ) : (
              "Upload"
            )}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default VideoUploadModal;

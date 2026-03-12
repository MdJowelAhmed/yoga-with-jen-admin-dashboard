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
  Space,
  Tooltip,
} from "antd";
import {
  CloudUploadOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import * as tus from "tus-js-client";
import {
  useAddVideoMutation,
  useUpdateVideoMutation,
} from "../../redux/apiSlices/videoApi";

const { TextArea } = Input;
const { Dragger } = Upload;

// --- Bunny.net Credentials ---
const STORAGE_API_KEY = import.meta.env.VITE_STORAGE_API_KEY;
const STORAGE_ZONE = import.meta.env.VITE_STORAGE_ZONE;
const STORAGE_PULL_ZONE = import.meta.env.VITE_STORAGE_PULL_ZONE;
const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;
const STREAM_LIBRARY_ID = import.meta.env.VITE_STREAM_LIBRARY_ID;

// Optimal chunk size (5MB for better performance)
const CHUNK_SIZE = 5 * 1024 * 1024;

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
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoKey, setVideoKey] = useState(0);
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [status, setStatus] = useState("");
  const [storageProgress, setStorageProgress] = useState(0);
  const [streamProgress, setStreamProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [fileSize, setFileSize] = useState(0);

  const thumbnailBlobRef = useRef(null);
  const videoBlobRef = useRef(null);
  const streamTusRef = useRef(null);
  const storageXhrRef = useRef(null);
  const uploadStartTimeRef = useRef(null);
  const storageAbortedRef = useRef(false);

  const isEditMode = !!currentVideo?._id;
  const [addVideo, { isLoading: isAdding }] = useAddVideoMutation();
  const [updateVideo, { isLoading: isUpdating }] = useUpdateVideoMutation();

  const cleanupBlobUrls = () => {
    if (thumbnailBlobRef.current) URL.revokeObjectURL(thumbnailBlobRef.current);
    if (videoBlobRef.current) URL.revokeObjectURL(videoBlobRef.current);
    thumbnailBlobRef.current = null;
    videoBlobRef.current = null;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatSpeed = (bytesPerSecond) => {
    return formatFileSize(bytesPerSecond) + "/s";
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds === Infinity) return "Calculating...";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  useEffect(() => {
    if (visible && currentVideo) {
      cleanupBlobUrls();
      form.setFieldsValue({
        title: currentVideo.title,
        duration: currentVideo.duration?.replace(" Min", "") || "",
        description: currentVideo.description || "",
      });
      setEquipmentTags(currentVideo.equipment || []);
      if (currentVideo.thumbnailUrl)
        setThumbnailPreview(currentVideo.thumbnailUrl);
      if (currentVideo.videoUrl || currentVideo.downloadUrl) {
        setVideoPreview(currentVideo.videoUrl || currentVideo.downloadUrl);
        setVideoKey((prev) => prev + 1);
      }
    } else if (visible) {
      cleanupBlobUrls();
      form.resetFields();
      setEquipmentTags([]);
      setThumbnailFile(null);
      setVideoFile(null);
      setThumbnailPreview(null);
      setVideoPreview(null);
      setVideoKey(0);
      setStorageProgress(0);
      setStreamProgress(0);
      setUploadSpeed(0);
      setRemainingTime(0);
      setFileSize(0);
      setIsPaused(false);
    }
  }, [visible, currentVideo]);

  const handleThumbnailSelection = (file) => {
    if (file.size > 5 * 1024 * 1024) {
      message.error("Thumbnail must be less than 5MB");
      return;
    }
    if (thumbnailBlobRef.current) URL.revokeObjectURL(thumbnailBlobRef.current);
    setThumbnailFile(file);
    const previewUrl = URL.createObjectURL(file);
    thumbnailBlobRef.current = previewUrl;
    setThumbnailPreview(previewUrl);
  };

  const handleVideoSelection = (info) => {
    const file =
      info.fileList?.[info.fileList.length - 1]?.originFileObj || info.file;
    if (!file) return;

    if (file.size > 5 * 1024 * 1024 * 1024) {
      message.error("Video file must be less than 5GB");
      return;
    }

    if (videoBlobRef.current) URL.revokeObjectURL(videoBlobRef.current);
    setVideoFile(file);
    setFileSize(file.size);
    const previewUrl = URL.createObjectURL(file);
    videoBlobRef.current = previewUrl;
    setVideoPreview(previewUrl);
    setVideoKey((prev) => prev + 1);

    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = Math.floor(video.duration);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      form.setFieldsValue({
        duration: `${minutes}:${seconds.toString().padStart(2, "0")}`,
      });
      URL.revokeObjectURL(video.src);
    };
    video.src = previewUrl;
  };

  // --- OPTIMIZED: XMLHttpRequest with proper progress tracking ---
  const uploadToStorage = (file) => {
    return new Promise((resolve, reject) => {
      const fileName = `videos/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const url = `https://storage.bunnycdn.com/${STORAGE_ZONE}/${fileName}`;

      const xhr = new XMLHttpRequest();
      storageXhrRef.current = xhr;
      storageAbortedRef.current = false;
      uploadStartTimeRef.current = Date.now();
      let lastLoaded = 0;

      xhr.open("PUT", url, true);
      xhr.setRequestHeader("AccessKey", STORAGE_API_KEY);
      xhr.setRequestHeader(
        "Content-Type",
        file.type || "application/octet-stream",
      );

      // Progress tracking
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && !storageAbortedRef.current) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setStorageProgress(progress);

          // Calculate speed and remaining time
          const currentTime = Date.now();
          const timeElapsed = (currentTime - uploadStartTimeRef.current) / 1000;

          if (timeElapsed > 0 && e.loaded > lastLoaded) {
            const speed = e.loaded / timeElapsed;
            setUploadSpeed(speed);
            const remaining = (e.total - e.loaded) / speed;
            setRemainingTime(remaining);
            lastLoaded = e.loaded;
          }
        }
      });

      // Success handler
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setStorageProgress(100);
          resolve(`https://${STORAGE_PULL_ZONE}/${fileName}`);
        } else {
          reject(new Error(`Storage upload failed with status: ${xhr.status}`));
        }
      });

      // Error handlers
      xhr.addEventListener("error", () => {
        if (!storageAbortedRef.current) {
          reject(new Error("Network error during storage upload"));
        }
      });

      xhr.addEventListener("abort", () => {
        storageAbortedRef.current = true;
        reject(new Error("Storage upload cancelled"));
      });

      xhr.addEventListener("timeout", () => {
        reject(new Error("Storage upload timeout"));
      });

      // Set timeout (120 minutes for large files)
      xhr.timeout = 120 * 60 * 1000;

      // Send the file
      xhr.send(file);
    });
  };

  const uploadToStream = async (file, title) => {
    try {
      const createRes = await fetch(
        `https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}/videos`,
        {
          method: "POST",
          headers: {
            AccessKey: STREAM_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title }),
        },
      );

      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.message || "Failed to create video entry");
      }

      const data = await createRes.json();
      const videoId = data.guid;
      return new Promise((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: "https://video.bunnycdn.com/tusupload",
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            AccessKey: STREAM_API_KEY,
            VideoId: videoId,
            LibraryId: STREAM_LIBRARY_ID,
          },
          metadata: {
            filetype: file.type,
            title: title,
          },
          onError: (error) => {
            console.error("TUS Error:", error);
            reject(new Error(`Stream upload failed: ${error.message}`));
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            const progress = Math.round((bytesUploaded / bytesTotal) * 100);
            setStreamProgress(progress);
          },
          onSuccess: () => {
            resolve(videoId);
          },
        });

        streamTusRef.current = upload;
        upload.start();
      });
    } catch (error) {
      throw error;
    }
  };

  const uploadThumbnail = async (file) => {
    const fileName = `thumbnails/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const url = `https://storage.bunnycdn.com/${STORAGE_ZONE}/${fileName}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        AccessKey: STORAGE_API_KEY,
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Thumbnail upload failed: ${response.status}`);
    }

    return `https://${STORAGE_PULL_ZONE}/${fileName}`;
  };

  const pauseUpload = () => {
    if (streamTusRef.current) {
      streamTusRef.current.abort();
      setIsPaused(true);
      message.info("Upload paused");
    }
  };

  const resumeUpload = () => {
    if (streamTusRef.current) {
      streamTusRef.current.start();
      setIsPaused(false);
      message.info("Upload resumed");
    }
  };

  const cancelUpload = () => {
    storageAbortedRef.current = true;
    if (storageXhrRef.current) {
      storageXhrRef.current.abort();
    }
    if (streamTusRef.current) {
      streamTusRef.current.abort(true);
    }
    setUploading(false);
    setIsPaused(false);
    setStorageProgress(0);
    setStreamProgress(0);
    message.warning("Upload cancelled");
  };

  const handleSubmit = async (values) => {
    if (!isEditMode && (!thumbnailFile || !videoFile)) {
      return message.error("Please select both thumbnail and video files");
    }
    if (equipmentTags.length === 0) {
      return message.error("Add at least one equipment tag");
    }

    try {
      setUploading(true);
      setIsPaused(false);
      let thumbUrl = currentVideo?.thumbnailUrl;
      let downloadUrl = currentVideo?.downloadUrl;
      let videoId = currentVideo?.videoId;

      // Upload thumbnail first (it's small)
      if (thumbnailFile) {
        setStatus("Uploading thumbnail...");
        thumbUrl = await uploadThumbnail(thumbnailFile);
      }

      // Upload video files in parallel (only for new uploads)
      if (videoFile && !isEditMode) {
        setStatus("Uploading video to both servers...");
        setStorageProgress(0);
        setStreamProgress(0);

        try {
          // Start both uploads in parallel
          const [sUrl, vId] = await Promise.all([
            uploadToStorage(videoFile),
            uploadToStream(videoFile, values.title),
          ]);

          downloadUrl = sUrl;
          videoId = vId;
        } catch (error) {
          // If parallel upload fails, try sequential
          console.error("Parallel upload error:", error);
          throw error;
        }
      }

      setStatus("Finalizing and saving...");
      const payload = {
        title: values.title,
        description: values.description,
        duration: values.duration.includes("Min")
          ? values.duration
          : `${values.duration} Min`,
        equipment: equipmentTags,
        thumbnailUrl: thumbUrl,
        downloadUrl: downloadUrl,
        videoId: videoId,
        videoUrl: `https://iframe.mediadelivery.net/embed/${STREAM_LIBRARY_ID}/${videoId}`,
      };

      const res = isEditMode
        ? await updateVideo({
            id: currentVideo._id,
            videoData: payload,
          }).unwrap()
        : await addVideo(payload).unwrap();

      if (res.success) {
        message.success(
          isEditMode
            ? "Video updated successfully!"
            : "Video uploaded successfully!",
          3,
        );
        onSuccess();
        onCancel();
      }
    } catch (err) {
      console.error("Upload error:", err);
      if (!storageAbortedRef.current) {
        message.error(err.message || "Upload failed. Please try again.", 5);
      }
    } finally {
      setUploading(false);
      setIsPaused(false);
      setStorageProgress(0);
      setStreamProgress(0);
      storageAbortedRef.current = false;
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !equipmentTags.includes(trimmed)) {
      setEquipmentTags([...equipmentTags, trimmed]);
      setTagInput("");
    } else if (equipmentTags.includes(trimmed)) {
      message.warning("This equipment is already added");
    }
  };

  const removeTag = (tagToRemove) => {
    setEquipmentTags(equipmentTags.filter((t) => t !== tagToRemove));
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <CloudUploadOutlined />
          {isEditMode ? "Edit Video" : "Upload Video"}
        </div>
      }
      open={visible}
      onCancel={uploading ? null : onCancel}
      footer={null}
      width={900}
      maskClosable={!uploading}
      keyboard={!uploading}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {uploading && (
          <Alert
            className="mb-4"
            message={
              <div className="flex items-center justify-between">
                <span className="font-semibold">{status}</span>
                <Space>
                  {!isEditMode && (
                    <Tooltip title="Cancel Upload">
                      <Button
                        type="text"
                        danger
                        icon={<CloseCircleOutlined />}
                        onClick={cancelUpload}
                        size="small"
                      />
                    </Tooltip>
                  )}
                </Space>
              </div>
            }
            description={
              <div className="space-y-3 mt-2">
                {videoFile && (
                  <div className="text-xs text-gray-600 flex justify-between mb-2">
                    <span>File Size: {formatFileSize(fileSize)}</span>
                    {uploadSpeed > 0 && (
                      <>
                        <span>Speed: {formatSpeed(uploadSpeed)}</span>
                        <span>Time Remaining: {formatTime(remainingTime)}</span>
                      </>
                    )}
                  </div>
                )}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-medium">
                      Backup Storage: {storageProgress}%
                    </p>
                    {storageProgress === 100 && (
                      <CheckCircleOutlined className="text-green-500" />
                    )}
                  </div>
                  <Progress
                    percent={storageProgress}
                    size="small"
                    status={storageProgress === 100 ? "success" : "active"}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-medium">
                      Stream Server: {streamProgress}%
                    </p>
                    {streamProgress === 100 && (
                      <CheckCircleOutlined className="text-green-500" />
                    )}
                  </div>
                  <Progress
                    percent={streamProgress}
                    size="small"
                    strokeColor="#52c41a"
                    status={streamProgress === 100 ? "success" : "active"}
                  />
                </div>
              </div>
            }
            type="info"
            showIcon
            icon={<CloudUploadOutlined />}
          />
        )}

        <Form.Item
          label="Title"
          name="title"
          rules={[
            { required: true, message: "Please enter video title" },
            { min: 3, message: "Title must be at least 3 characters" },
          ]}
        >
          <Input
            size="large"
            disabled={uploading}
            placeholder="Enter video title"
            className="h-[45px] rounded-md"
          />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label="Duration (MM:SS)"
            name="duration"
            rules={[
              { required: true, message: "Duration is required" },
              {
                pattern: /^\d+:[0-5]\d$/,
                message: "Format must be MM:SS (e.g., 5:30)",
              },
            ]}
          >
            <Input
              size="large"
              disabled={uploading}
              placeholder="5:30"
              className="h-[45px] rounded-md"
            />
          </Form.Item>

          <Form.Item label="Equipment">
            <Input
              size="large"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onPressEnter={(e) => {
                e.preventDefault();
                addTag();
              }}
              disabled={uploading}
              suffix={
                <Button type="text" onClick={addTag}>
                  Add
                </Button>
              }
              className="h-[45px]  rounded-md"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {equipmentTags.map((tag) => (
                <Tag
                  key={tag}
                  closable
                  onClose={() =>
                    setEquipmentTags(equipmentTags.filter((t) => t !== tag))
                  }
                  color="volcano"
                >
                  {tag}
                </Tag>
              ))}
            </div>
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label="Thumbnail"
            required={!isEditMode}
            tooltip="Recommended: 1280x720px, Max 5MB"
          >
            <Dragger
              accept="image/*"
              beforeUpload={(file) => {
                handleThumbnailSelection(file);
                return false;
              }}
              showUploadList={false}
              disabled={uploading}
              className="hover:border-[#CA3939]"
            >
              {thumbnailPreview ? (
                <div className="relative h-[200px] group">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover rounded"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                    <FileImageOutlined className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                </div>
              ) : (
                <div className="py-8">
                  <FileImageOutlined className="text-4xl text-gray-400" />
                  <p className="text-gray-600 mt-2">Click or drag image</p>
                  <p className="text-xs text-gray-400">JPG, PNG (Max 5MB)</p>
                </div>
              )}
            </Dragger>
          </Form.Item>

          <Form.Item
            label="Video File"
            required={!isEditMode}
            tooltip={
              isEditMode
                ? "Video cannot be changed after upload"
                : "Max 5GB, MP4/MOV recommended"
            }
          >
            <Dragger
              accept="video/*"
              beforeUpload={() => false}
              onChange={handleVideoSelection}
              showUploadList={false}
              disabled={uploading || isEditMode}
              className={isEditMode ? "" : "hover:border-[#CA3939]"}
            >
              {videoPreview ? (
                <div className="relative h-[200px] group">
                  <video
                    key={videoKey}
                    src={videoPreview}
                    controls={!isEditMode}
                    className="w-full h-full object-cover rounded"
                  />
                  {isEditMode && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <CheckCircleOutlined className="text-white text-4xl" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8">
                  <VideoCameraOutlined className="text-4xl text-gray-400" />
                  <p className="text-gray-600 mt-2">
                    {isEditMode ? "Video Locked" : "Click or drag video"}
                  </p>
                  {!isEditMode && (
                    <p className="text-xs text-gray-400">MP4, MOV (Max 5GB)</p>
                  )}
                </div>
              )}
            </Dragger>
            {videoFile && (
              <p className="text-xs text-gray-600 mt-2">
                Selected: {videoFile.name} ({formatFileSize(videoFile.size)})
              </p>
            )}
          </Form.Item>
        </div>

        <Form.Item
          label="Description"
          name="description"
          rules={[
            { required: true, message: "Please enter description" },
            { min: 10, message: "Description must be at least 10 characters" },
          ]}
        >
<<<<<<< HEAD
          <TextArea rows={5} disabled={uploading} />
=======
          <TextArea
            rows={4}
            disabled={uploading}
            placeholder="Describe the workout, exercises, intensity level, etc."
            showCount
            maxLength={500}
          />
>>>>>>> b0adcdef64fc3a27d763e8465f20812b438d2adb
        </Form.Item>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            size="large"
            onClick={onCancel}
            disabled={uploading}
            className="h-[45px] px-8"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={uploading}
            disabled={uploading || equipmentTags.length === 0}
            style={{ backgroundColor: "#CA3939", borderColor: "#CA3939" }}
            className="h-[45px] px-10 rounded-md"
            icon={isEditMode ? undefined : <CloudUploadOutlined />}
          >
            {isEditMode ? "Update Video" : "Upload Video"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default VideoUploadModal;

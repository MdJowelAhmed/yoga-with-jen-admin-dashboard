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
  CloudUploadOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  useAddVideoMutation,
  useUpdateVideoMutation,
} from "../../redux/apiSlices/videoApi";

const { TextArea } = Input;
const { Dragger } = Upload;

// --- Bunny.net Credentials from ENV ---
const STORAGE_API_KEY = import.meta.env.VITE_STORAGE_API_KEY;
const STORAGE_ZONE = import.meta.env.VITE_STORAGE_ZONE;
const STORAGE_PULL_ZONE = import.meta.env.VITE_STORAGE_PULL_ZONE;
const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;
const STREAM_LIBRARY_ID = import.meta.env.VITE_STREAM_LIBRARY_ID;

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

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
  const [videoKey, setVideoKey] = useState(0); // Key to force video re-render
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [storageProgress, setStorageProgress] = useState(0);
  const [streamProgress, setStreamProgress] = useState(0);
  
  // Refs to track blob URLs for cleanup
  const thumbnailBlobRef = useRef(null);
  const videoBlobRef = useRef(null);

  const isEditMode = !!currentVideo?._id;
  const [addVideo, { isLoading: isAdding }] = useAddVideoMutation();
  const [updateVideo, { isLoading: isUpdating }] = useUpdateVideoMutation();

  // Cleanup blob URLs helper
  const cleanupBlobUrls = () => {
    if (thumbnailBlobRef.current) {
      URL.revokeObjectURL(thumbnailBlobRef.current);
      thumbnailBlobRef.current = null;
    }
    if (videoBlobRef.current) {
      URL.revokeObjectURL(videoBlobRef.current);
      videoBlobRef.current = null;
    }
  };

  useEffect(() => {
    if (visible && currentVideo) {
      // Cleanup any existing blob URLs first
      cleanupBlobUrls();
      
      form.setFieldsValue({
        title: currentVideo.title,
        duration: currentVideo.duration?.replace(" Min", "") || "",
        description: currentVideo.description || "",
      });
      setEquipmentTags(currentVideo.equipment || []);
      // Set preview URLs for existing video/thumbnail in edit mode
      if (currentVideo.thumbnailUrl) {
        setThumbnailPreview(currentVideo.thumbnailUrl);
      }
      if (currentVideo.videoUrl || currentVideo.downloadUrl) {
        setVideoPreview(currentVideo.videoUrl || currentVideo.downloadUrl);
        setVideoKey(prev => prev + 1); // Force re-render
      }
    } else if (visible) {
      // Cleanup preview URLs before reset
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
    }
  }, [visible, currentVideo]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      cleanupBlobUrls();
    };
  }, []);

  const handleThumbnailSelection = (file) => {
    // Cleanup old preview URL if it's a blob URL
    if (thumbnailBlobRef.current) {
      URL.revokeObjectURL(thumbnailBlobRef.current);
      thumbnailBlobRef.current = null;
    }
    setThumbnailFile(file);
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    thumbnailBlobRef.current = previewUrl;
    setThumbnailPreview(previewUrl);
  };

  const handleVideoSelection = (info) => {
    // Get the latest file from fileList (last item is the newest)
    const fileList = info.fileList || [];
    const latestFile = fileList.length > 0 
      ? fileList[fileList.length - 1]?.originFileObj 
      : info.file;
    
    if (!latestFile) return;

    // Cleanup old preview URL if it's a blob URL
    if (videoBlobRef.current) {
      URL.revokeObjectURL(videoBlobRef.current);
      videoBlobRef.current = null;
    }

    setVideoFile(latestFile);
    // Create preview URL
    const previewUrl = URL.createObjectURL(latestFile);
    videoBlobRef.current = previewUrl;
    setVideoPreview(previewUrl);
    setVideoKey(prev => prev + 1); // Force video element re-render

    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = Math.floor(video.duration);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      form.setFieldsValue({
        duration: `${minutes}:${seconds.toString().padStart(2, "0")}`,
      });
      // Cleanup the temporary video element
      URL.revokeObjectURL(video.src);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
    };
    video.src = previewUrl;
  };

  // --- Upload Logics ---
  const uploadThumbnail = async (file) => {
    const fileName = `thumbnails/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const url = `https://storage.bunnycdn.com/${STORAGE_ZONE}/${fileName}`;
    setStatus("Uploading thumbnail...");
    const response = await fetch(url, {
      method: "PUT",
      headers: { AccessKey: STORAGE_API_KEY, "Content-Type": file.type },
      body: file,
    });
    if (!response.ok) throw new Error("Thumbnail upload failed");
    return `https://${STORAGE_PULL_ZONE}/${fileName}`;
  };

  const uploadToStorage = (file) => {
    const fileName = `videos/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const url = `https://storage.bunnycdn.com/${STORAGE_ZONE}/${fileName}`;
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("AccessKey", STORAGE_API_KEY);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable)
          setStorageProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201)
          resolve(`https://${STORAGE_PULL_ZONE}/${fileName}`);
        else reject(new Error("Storage upload failed"));
      };
      xhr.send(file);
    });
  };

  const uploadToStream = async (file, title) => {
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
    const { guid: videoId } = await createRes.json();
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(
        "PUT",
        `https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}/videos/${videoId}`,
      );
      xhr.setRequestHeader("AccessKey", STREAM_API_KEY);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable)
          setStreamProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status === 200) resolve(videoId);
        else reject(new Error("Stream upload failed"));
      };
      xhr.send(file);
    });
  };

  const handleSubmit = async (values) => {
    if (!isEditMode && (!thumbnailFile || !videoFile))
      return message.error("Please select both files");
    if (equipmentTags.length === 0)
      return message.error("Add at least one equipment");

    try {
      setUploading(true);
      let thumbUrl = currentVideo?.thumbnailUrl;
      let downloadUrl = currentVideo?.downloadUrl;
      let videoId = currentVideo?.videoId;

      
      if (thumbnailFile) thumbUrl = await uploadThumbnail(thumbnailFile);

      if (videoFile && !isEditMode) {
        setStatus("Uploading video to cloud servers...");
        const [sUrl, vId] = await Promise.all([
          uploadToStorage(videoFile),
          uploadToStream(videoFile, values.title),
        ]);
        downloadUrl = sUrl;
        videoId = vId;
      }

      setStatus("Finalizing...");
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
        message.success("Successfully saved!");
        onSuccess();
        onCancel();
      }
    } catch (err) {
      message.error(err.message || "Failed to process");
    } finally {
      setUploading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !equipmentTags.includes(tagInput.trim())) {
      setEquipmentTags([...equipmentTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  return (
    <Modal
      title={isEditMode ? "Edit Video" : "Upload Video"}
      open={visible}
      onCancel={uploading ? null : onCancel}
      footer={null}
      width={850}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {uploading && (
          <Alert
            className="mb-4"
            message={status}
            description={
              <div className="space-y-3 mt-2">
                <div>
                  <p className="text-xs mb-1">
                    Backup Storage: {storageProgress}%
                  </p>
                  <Progress percent={storageProgress} size="small" />
                </div>
                <div>
                  <p className="text-xs mb-1">
                    Stream Server: {streamProgress}%
                  </p>
                  <Progress
                    percent={streamProgress}
                    size="small"
                    strokeColor="#52c41a"
                  />
                </div>
              </div>
            }
            type="info"
            showIcon
          />
        )}

        <Form.Item label="Title" name="title" rules={[{ required: true }]}>
          <Input size="large" disabled={uploading} className="h-[45px]  rounded-md" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label="Duration (MM:SS)"
            name="duration"
            rules={[{ required: true, pattern: /^\d+:[0-5]\d$/ }]}
          >
            <Input size="large" disabled={uploading} className="h-[45px]  rounded-md" />
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
          <Form.Item label="Thumbnail" required={!isEditMode}>
            <Dragger
              key={`thumbnail-${thumbnailFile?.name || 'empty'}`}
              accept="image/*"
              beforeUpload={(file) => {
                handleThumbnailSelection(file);
                return false;
              }}
              showUploadList={false}
              disabled={uploading}
            >
              {thumbnailPreview ? (
                <div className="relative w-full h-[200px]">
                  <img
                    key={`thumb-${thumbnailFile?.name || currentVideo?.thumbnailUrl || ''}`}
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover rounded"
                  />
                  <div className="absolute top-2 right-2">
                    <CheckCircleOutlined className="text-green-500 text-xl bg-white rounded-full" />
                  </div>
                  {thumbnailFile && (
                    <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 text-white text-xs p-1 rounded">
                      {thumbnailFile.name}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <FileImageOutlined className="text-4xl text-gray-400 mb-2" />
                  <p className="text-gray-500">Select Image</p>
                </div>
              )}
            </Dragger>
          </Form.Item>
          <Form.Item label="Video File" required={!isEditMode}>
            <Dragger
              key={`video-${videoFile?.name || 'empty'}`}
              accept="video/*"
              beforeUpload={() => false}
              onChange={handleVideoSelection}
              showUploadList={false}
              disabled={uploading || isEditMode}
            >
              {videoPreview ? (
                <div className="relative w-full h-[200px]">
                  <video
                    key={`video-${videoKey}-${videoFile?.name || ''}-${videoFile?.lastModified || Date.now()}`}
                    src={videoPreview}
                    controls
                    className="w-full h-full object-cover rounded"
                    preload="auto"
                  />
                  <div className="absolute top-2 right-2">
                    <CheckCircleOutlined className="text-green-500 text-xl bg-white rounded-full" />
                  </div>
                  {videoFile && (
                    <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 text-white text-xs p-1 rounded">
                      {videoFile.name}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <VideoCameraOutlined className="text-4xl text-gray-400 mb-2" />
                  <p className="text-gray-500">
                    {isEditMode ? "Video Locked" : "Select Video"}
                  </p>
                </div>
              )}
            </Dragger>
          </Form.Item>
        </div>

        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true }]}
        >
          <TextArea rows={4} disabled={uploading} />
        </Form.Item>

        <div className="flex justify-end gap-2 mt-4">
          {/* <Button onClick={onCancel} disabled={uploading} className="h-[45px] px-8  rounded-md">
            Cancel
          </Button> */}
          <Button
            type="primary"
            htmlType="submit"
            loading={isAdding || isUpdating || uploading}
            style={{ backgroundColor: "#CA3939", borderColor: "#CA3939" }}
            className="h-[45px] px-10  rounded-md"
          >
            {isEditMode ? "Update Video" : "Upload Video"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default VideoUploadModal;

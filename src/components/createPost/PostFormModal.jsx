import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Upload,
  Button,
  message,
  Image,
  InputNumber,
  DatePicker,
  Progress,
  Alert,
} from "antd";
import {
  InboxOutlined,
  DeleteOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { getVideoAndThumbnail } from "../common/imageUrl";
import JoditTextEditor from "./JoditEditor";
import moment from "moment";

const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;

// --- Bunny.net Credentials from ENV (same as VideoUploadModal) ---
const STORAGE_API_KEY = import.meta.env.VITE_STORAGE_API_KEY;
const STORAGE_ZONE = import.meta.env.VITE_STORAGE_ZONE;
const STORAGE_PULL_ZONE = import.meta.env.VITE_STORAGE_PULL_ZONE;
const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;
const STREAM_LIBRARY_ID = import.meta.env.VITE_STREAM_LIBRARY_ID;

const PostFormModal = ({
  visible,
  onClose,
  onSubmit,
  editingItem,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const editor = useRef(null);

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [postType, setPostType] = useState("text");
  const [textContent, setTextContent] = useState("");
  const [videoDuration, setVideoDuration] = useState("");
  const [publishDate, setPublishDate] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [storageProgress, setStorageProgress] = useState(0);
  const [streamProgress, setStreamProgress] = useState(0);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoKey, setVideoKey] = useState(0);
  const videoBlobRef = useRef(null);

  const isEditMode = !!editingItem;

  // Bunny upload helpers (same as VideoUploadModal)
  const uploadThumbnailToBunny = async (file) => {
    const fileName = `thumbnails/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const url = `https://storage.bunnycdn.com/${STORAGE_ZONE}/${fileName}`;
    setUploadStatus("Uploading thumbnail...");
    const response = await fetch(url, {
      method: "PUT",
      headers: { AccessKey: STORAGE_API_KEY, "Content-Type": file.type },
      body: file,
    });
    if (!response.ok) throw new Error("Thumbnail upload failed");
    return `https://${STORAGE_PULL_ZONE}/${fileName}`;
  };

  const uploadVideoToStorage = (file) => {
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

  const uploadVideoToStream = async (file, title) => {
    const createRes = await fetch(
      `https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}/videos`,
      {
        method: "POST",
        headers: {
          AccessKey: STREAM_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      }
    );
    const { guid: videoId } = await createRes.json();
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(
        "PUT",
        `https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}/videos/${videoId}`
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

  // Memoize POST_TYPES to prevent recreation on each render
  const POST_TYPES = useMemo(
    () => [
      { value: "text", label: "Text Post" },
      { value: "image", label: "Image Post" },
      { value: "video", label: "Video Post" },
    ],
    []
  );

  const getFormTitle = useCallback(
    () => (editingItem ? "Edit Post" : "Create New Post"),
    [editingItem]
  );

  // Stabilize text content updates
  const updateTextContent = useCallback((content) => {
    setTextContent(content);
  }, []);

  // Enhanced useEffect with better dependency management
  useEffect(() => {
    if (editingItem && visible) {
      const fieldsToSet = {
        type: editingItem.type,
      };

      // Only set title for image and video posts
      if (editingItem.type === "image" || editingItem.type === "video") {
        fieldsToSet.title = editingItem.title;
      }

      // Only set description and duration for video posts
      if (editingItem.type === "video") {
        fieldsToSet.description = editingItem.description;
        fieldsToSet.duration = editingItem.duration
          ? String(editingItem.duration)
          : undefined;
        setVideoDuration(
          editingItem.duration ? String(editingItem.duration) : ""
        );
      } else {
        setVideoDuration("");
      }

      // Set publish date if available
      if (editingItem.publishAt) {
        fieldsToSet.publishAt = moment(editingItem.publishAt);
        setPublishDate(moment(editingItem.publishAt));
      } else {
        fieldsToSet.publishAt = null;
        setPublishDate(null);
      }

      // Set post type first
      setPostType(editingItem.type || "text");

      // Handle text content for text posts - only update if different
      if (editingItem.type === "text") {
        const content = editingItem.title || editingItem.content || "";
        if (content !== textContent) {
          setTextContent(content);
        }
      } else if (textContent !== "") {
        setTextContent("");
      }

      // Set form fields
      form.setFieldsValue(fieldsToSet);

      // Reset file states
      setThumbnailFile(null);
      setVideoFile(null);
      setImageFile(null);
      setVideoPreview(null);
      setVideoKey(0);
      if (videoBlobRef.current) {
        URL.revokeObjectURL(videoBlobRef.current);
        videoBlobRef.current = null;
      }
    } else if (!visible) {
      // Reset everything when modal closes
      form.resetFields();
      setThumbnailFile(null);
      setVideoFile(null);
      setImageFile(null);
      setPostType("text");
      setTextContent("");
      setVideoDuration("");
      setPublishDate(null);
      setVideoPreview(null);
      setVideoKey(0);
      setStorageProgress(0);
      setStreamProgress(0);
      if (videoBlobRef.current) {
        URL.revokeObjectURL(videoBlobRef.current);
        videoBlobRef.current = null;
      }
    }
  }, [editingItem?._id, editingItem?.type, visible]); // Reduced dependencies

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (videoBlobRef.current) {
        URL.revokeObjectURL(videoBlobRef.current);
        videoBlobRef.current = null;
      }
    };
  }, []);

  const handlePostTypeChange = useCallback(
    (value) => {
      setPostType(value);
      setThumbnailFile(null);
      setVideoFile(null);
      setImageFile(null);
      setTextContent("");
      setVideoDuration("");
      setVideoPreview(null);
      setVideoKey(0);
      if (videoBlobRef.current) {
        URL.revokeObjectURL(videoBlobRef.current);
        videoBlobRef.current = null;
      }

      // Reset form fields when type changes
      form.resetFields(["title", "description", "duration"]);
    },
    [form]
  );

  // Memoize upload props to prevent recreation
  const imageProps = useMemo(
    () => ({
      beforeUpload: (file) => {
        if (!file.type.startsWith("image/")) {
          message.error("You can only upload image files!");
          return false;
        }
        if (file.size / 1024 / 1024 > 20) {
          message.error("Image must be smaller than 20MB!");
          return false;
        }
        setImageFile(file);
        return false;
      },
      onRemove: () => {
        setImageFile(null);
      },
      fileList: imageFile ? [imageFile] : [],
      showUploadList: false,
    }),
    [imageFile]
  );

  const handleVideoSelection = useCallback(
    (info) => {
      const fileList = info.fileList || [];
      const latestFile =
        fileList.length > 0
          ? fileList[fileList.length - 1]?.originFileObj
          : info.file;

      if (!latestFile) return;

      if (!latestFile.type.startsWith("video/")) {
        message.error("You can only upload video files!");
        return;
      }
      if (latestFile.size / 1024 / 1024 > 2000) {
        message.error("Video must be smaller than 2GB!");
        return;
      }

      if (videoBlobRef.current) {
        URL.revokeObjectURL(videoBlobRef.current);
        videoBlobRef.current = null;
      }

      setVideoFile(latestFile);
      const previewUrl = URL.createObjectURL(latestFile);
      videoBlobRef.current = previewUrl;
      setVideoPreview(previewUrl);
      setVideoKey((prev) => prev + 1);

      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        const duration = Math.round(video.duration);
        setVideoDuration(String(duration));
        form.setFieldsValue({ duration: duration });
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => URL.revokeObjectURL(video.src);
      video.src = previewUrl;
    },
    [form]
  );



  // 1. validateForm function কে এভাবে পরিবর্তন করুন:
  const validateForm = useCallback(() => {
    if (postType === "text") {
      const editorContent = editor.current?.value || textContent || "";
      const cleanContent = editorContent.replace(/<[^>]*>/g, "").trim();

      if (!cleanContent) {
        message.error("Please enter text content");
        return false;
      }
    }
    if (postType === "image") {
      if (!imageFile && !isEditMode) {
        message.error("Please select an image");
        return false;
      }
      if (
        isEditMode &&
        !imageFile &&
        !editingItem?.imageUrl &&
        !editingItem?.thumbnailUrl
      ) {
        message.error("Please select an image");
        return false;
      }
    }
    if (postType === "video") {
      if (!videoFile && !isEditMode) {
        message.error("Please select a video");
        return false;
      }
      if (!thumbnailFile && !isEditMode) {
        message.error("Please select a thumbnail");
        return false;
      }
      if (isEditMode) {
        if (!videoFile && !editingItem?.videoUrl) {
          message.error("Please select a video");
          return false;
        }
        if (!thumbnailFile && !editingItem?.thumbnailUrl) {
          message.error("Please select a thumbnail");
          return false;
        }
      }
    }
    return true;
  }, [
    postType,
    textContent,
    imageFile,
    videoFile,
    thumbnailFile,
    isEditMode,
    editingItem,
  ]);

  const handleFormSubmit = useCallback(
    async (values) => {
      try {
        let finalTextContent = textContent;
        if (postType === "text" && editor.current) {
          finalTextContent = editor.current.value || textContent || "";
        }

        if (!validateForm()) return;

        const postData = {
          type: postType,
          uploadDate:
            editingItem?.uploadDate || new Date().toLocaleDateString(),
          publishAt: values.publishAt ? values.publishAt.toISOString() : null,
        };

        if (postType === "text") {
          postData.title = finalTextContent;
        } else if (postType === "image") {
          postData.title = values.title;
        } else if (postType === "video") {
          postData.title = values.title;
          postData.description = values.description || "";
          postData.duration =
            values.duration !== undefined
              ? String(values.duration)
              : videoDuration
              ? String(videoDuration)
              : undefined;
        }

        const formDataToSend = new FormData();

        if (postType === "video") {
          // Upload to Bunny.net first (same as VideoUploadModal)
          setVideoUploading(true);
          setStorageProgress(0);
          setStreamProgress(0);

          let thumbUrl = editingItem?.thumbnailUrl;
          let downloadUrl = editingItem?.downloadUrl;
          let videoId = editingItem?.videoId;
          if (!videoId && editingItem?.videoUrl) {
            const match = String(editingItem.videoUrl).match(/\/embed\/[^/]+\/([^/?]+)/);
            if (match) videoId = match[1];
          }

          try {
            if (thumbnailFile) {
              thumbUrl = await uploadThumbnailToBunny(thumbnailFile);
            }

            if (videoFile && !isEditMode) {
              setUploadStatus("Uploading video to cloud servers...");
              const [sUrl, vId] = await Promise.all([
                uploadVideoToStorage(videoFile),
                uploadVideoToStream(videoFile, values.title),
              ]);
              downloadUrl = sUrl;
              videoId = vId;
            }

            postData.thumbnailUrl = thumbUrl;
            postData.downloadUrl = downloadUrl;
            postData.videoId = videoId;
            if (videoId) {
              postData.videoUrl = `https://iframe.mediadelivery.net/embed/${STREAM_LIBRARY_ID}/${videoId}`;
            }
          } catch (err) {
            message.error(err.message || "Video upload failed");
            setVideoUploading(false);
            return;
          } finally {
            setVideoUploading(false);
          }
        }

        formDataToSend.append("data", JSON.stringify(postData));

        if (postType === "image" && imageFile) {
          formDataToSend.append("thumbnail", imageFile);
        }

        await onSubmit(formDataToSend);
      } catch (error) {
        console.error("Error submitting post:", error);
        message.error(`Failed to ${isEditMode ? "update" : "create"} post`);
      }
    },
    [
      validateForm,
      postType,
      textContent,
      thumbnailFile,
      videoFile,
      imageFile,
      editingItem,
      onSubmit,
      isEditMode,
      videoDuration,
    ]
  );

  const getImageSource = useCallback((item) => {
    if (!item) return "";

    if (item.imageUrl) {
      return getVideoAndThumbnail(item.imageUrl);
    }

    if (item.thumbnailUrl) {
      return getVideoAndThumbnail(item.thumbnailUrl);
    }

    return "";
  }, []);

  return (
    <Modal
      title={getFormTitle()}
      open={visible}
      onCancel={videoUploading ? () => {} : onClose}
      footer={null}
      width={900}
      destroyOnClose={false}
      maskClosable={!videoUploading}
      closable={!videoUploading}
    >
      <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
        {videoUploading && postType === "video" && (
          <Alert
            className="mb-4"
            message={uploadStatus}
            description={
              <div className="space-y-3 mt-2">
                <div>
                  <p className="text-xs mb-1">Backup Storage: {storageProgress}%</p>
                  <Progress percent={storageProgress} size="small" />
                </div>
                <div>
                  <p className="text-xs mb-1">Stream Server: {streamProgress}%</p>
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

        <div className="flex justify-between gap-10 items-center">
          <Form.Item
            name="type"
            label="Post Type"
            rules={[{ required: true, message: "Please select post type" }]}
            className="w-full"
          >
            <Select
              placeholder="Select Post Type"
              className="h-12 w-full"
              onChange={handlePostTypeChange}
              value={postType}
            >
              {POST_TYPES.map((type) => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="publishAt"
            label="Publish Date & Time"
            rules={[{ required: true, message: "Please select publish date" }]}
            className="w-full"
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              placeholder="Select Date and Time"
              className="h-12 w-full"
              onChange={(date) => setPublishDate(date)}
              disabledDate={(current) =>
                current && current < moment().startOf("day")
              }
              disabledTime={(current) => {
                if (!current) return {};
                const now = moment();
                if (current.isSame(now, "day")) {
                  const disabledHours = [];
                  for (let i = 0; i < now.hour(); i++) disabledHours.push(i);
                  const disabledMinutes =
                    current.hour() === now.hour()
                      ? Array.from({ length: now.minute() }, (_, i) => i)
                      : [];
                  const disabledSeconds =
                    current.hour() === now.hour() &&
                    current.minute() === now.minute()
                      ? Array.from({ length: now.second() }, (_, i) => i)
                      : [];
                  return {
                    disabledHours: () => disabledHours,
                    disabledMinutes: () => disabledMinutes,
                    disabledSeconds: () => disabledSeconds,
                  };
                }
                return {};
              }}
            />
          </Form.Item>
        </div>

        {(postType === "image" || postType === "video") && (
          <Form.Item
            name="title"
            label="Post Title"
            rules={[{ required: true, message: "Please enter post title" }]}
          >
            <Input placeholder="Enter Your Post Title" className="h-12" />
          </Form.Item>
        )}

        {postType === "text" && (
          <Form.Item label="Post Content" required className="mb-6">
            <div className="editor-wrapper custom-height-editor">
              <JoditTextEditor
                key={`editor-${visible}-${editingItem?._id || "new"}`}
                ref={editor}
                value={textContent}
                tabIndex={1}
                onBlur={updateTextContent}
                onChange={updateTextContent}
              />
            </div>
          </Form.Item>
        )}

        {postType === "image" && (
          <Form.Item label="Image (Thumbnail)" required={!isEditMode}>
            <Dragger {...imageProps}>
              <InboxOutlined className="text-2xl mb-2" />
              <p>Click or drag image to upload</p>
              {isEditMode && (
                <p className="text-blue-500 text-xs">
                  Leave empty to keep existing image
                </p>
              )}
            </Dragger>
            {(imageFile ||
              (editingItem &&
                (editingItem.imageUrl || editingItem.thumbnailUrl))) && (
              <div className="mt-2 text-center relative">
                <Image
                  src={
                    imageFile
                      ? URL.createObjectURL(imageFile)
                      : getImageSource(editingItem)
                  }
                  width={400}
                  height={200}
                  style={{ objectFit: "cover" }}
                  className="rounded border"
                />
                {imageFile && (
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => setImageFile(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white hover:bg-red-600"
                    style={{ borderRadius: "50%", width: 24, height: 24 }}
                  />
                )}
              </div>
            )}
          </Form.Item>
        )}

        {postType === "video" && (
          <>
            <Form.Item
              name="duration"
              label="Duration (seconds)"
              rules={[
                { required: true, message: "Please enter video duration" },
              ]}
            >
              <InputNumber
                placeholder="Auto-filled when video is selected"
                className="w-full h-12"
                min={1}
                value={videoDuration ? Number(videoDuration) : undefined}
                onChange={(val) => setVideoDuration(val ? String(val) : "")}
                disabled={videoUploading}
              />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <Form.Item label="Thumbnail" required={!isEditMode}>
                <Dragger
                  key={`thumbnail-${thumbnailFile?.name || "empty"}`}
                  accept="image/*"
                  beforeUpload={(file) => {
                    if (!file.type.startsWith("image/")) {
                      message.error("You can only upload image files!");
                      return false;
                    }
                    setThumbnailFile(file);
                    return false;
                  }}
                  showUploadList={false}
                  disabled={videoUploading}
                >
                  {thumbnailFile || editingItem?.thumbnailUrl ? (
                    <div className="relative w-full h-[200px]">
                      <img
                        src={
                          thumbnailFile
                            ? URL.createObjectURL(thumbnailFile)
                            : getVideoAndThumbnail(editingItem.thumbnailUrl)
                        }
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
                      {thumbnailFile && (
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setThumbnailFile(null);
                          }}
                          className="absolute top-2 left-2 bg-red-500 text-white hover:bg-red-600"
                          style={{ borderRadius: "50%", width: 24, height: 24 }}
                        />
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
                  key={`video-${videoFile?.name || "empty"}`}
                  accept="video/*"
                  beforeUpload={() => false}
                  onChange={handleVideoSelection}
                  showUploadList={false}
                  disabled={videoUploading || isEditMode}
                >
                  {videoPreview || editingItem?.videoUrl ? (
                    <div className="relative w-full h-[200px]">
                      <video
                        key={`video-${videoKey}-${videoFile?.name || ""}`}
                        src={
                          videoPreview ||
                          getVideoAndThumbnail(editingItem?.videoUrl || editingItem?.downloadUrl)
                        }
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
                      {videoFile && !isEditMode && (
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setVideoFile(null);
                            setVideoPreview(null);
                            setVideoDuration("");
                            form.setFieldsValue({ duration: undefined });
                            if (videoBlobRef.current) {
                              URL.revokeObjectURL(videoBlobRef.current);
                              videoBlobRef.current = null;
                            }
                          }}
                          className="absolute top-2 left-2 bg-red-500 text-white hover:bg-red-600"
                          style={{ borderRadius: "50%", width: 24, height: 24 }}
                        />
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

            <Form.Item name="description" label="Description">
              <TextArea
                rows={4}
                placeholder="Add video description (optional)"
                disabled={videoUploading}
              />
            </Form.Item>
          </>
        )}

        <Form.Item>
          <div className="flex justify-end space-x-4">
            <Button
              onClick={onClose}
              disabled={loading || videoUploading}
              className="py-6 px-10"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading || videoUploading}
              disabled={videoUploading}
              className="bg-primary py-6 px-8"
            >
              {editingItem ? "Update Post" : "Create Post"}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PostFormModal;

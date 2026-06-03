// bunnyUtilities.js - Handles all Bunny.net related operations
import axios from "axios";

// Bunny.net configuration
const BUNNY_CONFIG = {
  apiKey: "fc696e83-7e8e-4c42-801f8bf6357b-fa06-4d4b",
  storageZoneName: "yogawithjen",
  hostname: "ny.storage.bunnycdn.com",
  cdnUrl: "https://yoga-pul.b-cdn.net/",
  videoLibraryId: "391642",
};

/**
 * Get video duration from a file object
 * @param {File} file - Video file object
 * @returns {Promise<string>} - Video duration in format MM:SS
 */
export const getVideoDuration = (file) => {
  return new Promise((resolve) => {
    try {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;

        // Format to MM:SS
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        const formattedDuration = `${minutes}:${seconds
          .toString()
          .padStart(2, "0")}`;

        resolve(formattedDuration);
      };

      video.onerror = () => {
        console.error("Error loading video metadata");
        resolve("0:00"); // Return default on error
      };

      video.src = URL.createObjectURL(file);
    } catch (error) {
      console.error("Error getting video duration:", error);
      resolve("0:00"); // Return default on error
    }
  });
};

/**
 * Upload a file to Bunny.net storage
 * @param {File} file - File to upload
 * @param {string} folder - Folder path in storage (e.g., 'videos', 'thumbnails')
 * @returns {Promise<string>} - URL of the uploaded file
 */
// Bunny.net Upload Function
export const uploadToBunny = async (file, folder = "") => {
  try {
    const timestamp = new Date().getTime();
    const safeFileName = `${timestamp}_${file.name.replace(
      /[^a-zA-Z0-9.]/g,
      "_"
    )}`;
    const folderPath = folder ? `/${folder}/` : "/";
    const uploadPath = `${folderPath}${safeFileName}`;

    const formData = new FormData();
    formData.append("file", file);

    // Log for debugging

    const response = await axios({
      method: "PUT",
      url: `https://${BUNNY_CONFIG.hostname}/${BUNNY_CONFIG.storageZoneName}${uploadPath}`,
      data: formData, // Using formData to upload the file
      headers: {
        AccessKey: BUNNY_CONFIG.apiKey,
        "Content-Type": file.type,
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
      },
    });

    // Handle successful upload
    if (response.status === 200 || response.status === 201) {
      const fileUrl = `${BUNNY_CONFIG.cdnUrl}${uploadPath}`;
      return fileUrl;
    } else {
      throw new Error(`Upload failed with status: ${response.status}`);
    }
  } catch (error) {
    // Log error details for better understanding
    console.error("Error uploading file to Bunny.net:", error);
    throw new Error("Failed to upload file to Bunny.net");
  }
};

/**
 * Check if a file exists on Bunny.net
 * @param {string} url - File URL to check
 * @returns {Promise<boolean>} - Whether the file exists
 */
export const checkFileExists = async (url) => {
  try {
    const response = await axios.head(url);
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

/**
 * Delete a file from Bunny.net storage
 * @param {string} url - Full CDN URL of the file to delete
 * @returns {Promise<boolean>} - Whether deletion was successful
 */
export const deleteFromBunny = async (url) => {
  try {
    // Extract the path from the CDN URL
    const cdnUrlBase = BUNNY_CONFIG.cdnUrl;
    if (!url.startsWith(cdnUrlBase)) {
      console.error("URL is not from the configured Bunny CDN");
      return false;
    }

    const path = url.substring(cdnUrlBase.length);

    // Delete from Bunny Storage
    const response = await axios({
      method: "DELETE",
      url: `https://${BUNNY_CONFIG.hostname}/${BUNNY_CONFIG.storageZoneName}/${path}`,
      headers: {
        AccessKey: BUNNY_CONFIG.apiKey,
      },
    });

    return response.status === 200 || response.status === 204;
  } catch (error) {
    console.error("Error deleting from Bunny.net:", error);
    return false;
  }
};

/**
 * Helper function to handle errors with user-friendly messages
 * @param {Error} error - Error object
 * @returns {string} - User-friendly error message
 */
export const handleBunnyError = (error) => {
  console.error("Bunny.net operation error:", error);

  if (error.response) {
    const status = error.response.status;

    // Handle common status codes
    if (status === 401)
      return "Authentication failed. Please check API credentials.";
    if (status === 403)
      return "Permission denied. Please verify access rights.";
    if (status === 404) return "Resource not found on Bunny.net.";
    if (status === 413) return "File is too large for upload.";
    if (status >= 500)
      return "Bunny.net service error. Please try again later.";

    return `Bunny.net error: ${status} - ${error.response.statusText}`;
  }

  if (error.request) {
    return "No response from Bunny.net. Please check your network connection.";
  }

  return "Failed to process your request. Please try again.";
};

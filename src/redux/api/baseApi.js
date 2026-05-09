import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getBaseUrl } from "./baseUrl";

export const isProduction = false // true for production, false for development

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: `${getBaseUrl(isProduction)}/api/v1`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),
  tagTypes: [
    "Auth",
    "User",
    "Contact",
    "Video",
    "Category",
    "Categories",
    "Package",
    "DailyVideo",
    "DailyChallenge",
    "DailyInspiration",
    "Admin",
    "Notification",
    "PushNotification",
    "Leaderboard",
  ],
  endpoints: () => ({}),
});

export const imageUrl = `${getBaseUrl(isProduction)}`;


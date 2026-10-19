import { api } from "../api/baseApi";

export const serverHealthApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // 1. System Health Status
    getServerHealth: builder.query({
      query: () => ({
        url: "/server-health",
        method: "GET",
      }),
      transformResponse: (response) => {
        return response?.data || response;
      },
      providesTags: ["ServerHealth"],
    }),

    // 2. Redis & Background Queues (BullMQ) Status
    getQueueAndCache: builder.query({
      query: () => ({
        url: "/server-health/queue-and-cache",
        method: "GET",
      }),
      transformResponse: (response) => {
        return response?.data || response;
      },
      providesTags: ["ServerHealth"],
    }),

    // 3. Queue Actions (Retry / Clean / Pause / Resume)
    executeQueueAction: builder.mutation({
      query: ({ queueName, action }) => ({
        url: "/server-health/queue-action",
        method: "POST",
        body: { queueName, action },
      }),
      invalidatesTags: ["ServerHealth"],
    }),

    // 4. Flush Cache
    flushCache: builder.mutation({
      query: ({ type = "cache-only" } = {}) => ({
        url: "/server-health/flush-cache",
        method: "POST",
        body: { type },
      }),
      invalidatesTags: ["ServerHealth"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetServerHealthQuery,
  useGetQueueAndCacheQuery,
  useExecuteQueueActionMutation,
  useFlushCacheMutation,
} = serverHealthApi;

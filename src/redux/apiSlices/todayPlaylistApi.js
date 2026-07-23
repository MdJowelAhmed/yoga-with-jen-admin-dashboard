import { api } from "../api/baseApi";

const todayPlaylistApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTodayPlaylist: builder.query({
      query: (args) => {
        const params = new URLSearchParams();
        if (args) {
          args.forEach((arg) => {
            params.append(arg.name, arg.value);
          });
        }
        return {
          url: "/today/playlist",
          method: "GET",
          params,
        };
      },
      transformResponse: (response) => {
        const payload = response?.data;
        const result = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.result)
            ? payload.result
            : [];
        const meta = payload?.meta || response?.pagination || {};

        // Flatten populated videoId for table/UI; keep playlist _id for delete
        const data = result.map((item) => {
          const video =
            item?.videoId && typeof item.videoId === "object"
              ? item.videoId
              : null;
          return {
            ...item,
            playlistId: item._id,
            videoMongoId:
              video?._id ||
              (typeof item.videoId === "string" ? item.videoId : undefined),
            title: video?.title ?? item.title,
            thumbnailUrl: video?.thumbnailUrl ?? item.thumbnailUrl,
            videoUrl: video?.videoUrl ?? item.videoUrl,
            downloadUrl: video?.downloadUrl ?? item.downloadUrl,
            duration: video?.duration ?? item.duration,
            description: video?.description ?? item.description,
            equipment: video?.equipment ?? item.equipment,
          };
        });

        return {
          data,
          pagination: {
            total: meta.total || 0,
            current: meta.page || 1,
            pageSize: meta.limit || 10,
            totalPage: meta.totalPage || 1,
          },
        };
      },
      providesTags: ["TodayPlaylist"],
    }),

    addVideosToTodayPlaylist: builder.mutation({
      query: (body) => ({
        url: "/today/playlist",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TodayPlaylist"],
    }),

    updateTodayPlaylistOrder: builder.mutation({
      query: (body) => ({
        url: "/today/playlist/order",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["TodayPlaylist"],
    }),

    deleteTodayPlaylistVideo: builder.mutation({
      query: (id) => ({
        url: `/today/playlist/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TodayPlaylist"],
    }),
  }),
});

export const {
  useGetTodayPlaylistQuery,
  useAddVideosToTodayPlaylistMutation,
  useUpdateTodayPlaylistOrderMutation,
  useDeleteTodayPlaylistVideoMutation,
} = todayPlaylistApi;

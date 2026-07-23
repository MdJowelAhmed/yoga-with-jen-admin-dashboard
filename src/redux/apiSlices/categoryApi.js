import { api } from "../api/baseApi";

const categorySlice = api.injectEndpoints({
  endpoints: (builder) => ({
    createCategory: builder.mutation({
      query: (categoryData) => {
        return {
          url: "/admin/category/create",
          method: "POST",
          body: categoryData,
          formData: true,
        };
      },
      invalidatesTags: ["Categories"],
    }),

    updateCategory: builder.mutation({
      query: ({ id, updatedData }) => {
        return {
          url: `/admin/category/${id}`,
          method: "PATCH",
          body: updatedData,
          // Disable content type, let browser set it with boundary for FormData
          formData: true,
        };
      },
      invalidatesTags: (result, error, arg) => {
        // Always invalidate regardless of result
        return [
          "Categories",
          { type: "Category", id: "LIST" },
          { type: "Category", id: arg.id },
        ];
      },
    }),

    deleteCategory: builder.mutation({
      query: (id) => {
        return {
          url: `/admin/category/${id}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["Categories"],
    }),
    deleteCategoryVideo: builder.mutation({
      query: (id) => {
        return {
          url: `/admin/videos/management/delete/${id}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["Categories"],
    }),

    getCategory: builder.query({
      query: () => {
        return {
          url: "/admin/category",
          method: "GET",
        };
      },
      providesTags: (result) => {
        // Return a list of tags for better caching
        const tags = [{ type: "Categories", id: "LIST" }];
        if (result?.data) {
          // Add tag for each category
          result.data.forEach((category) => {
            tags.push({ type: "Category", id: category._id });
          });
        }
        return tags;
      },
    }),

getByCategoryAllVideos: builder.query({
  query: ({ id, page = 1, limit = 10, searchTerm }) => {
    const params = {
      limit: limit,
      page: page,
    };
    if (searchTerm) {
      params.searchTerm = searchTerm;
    }
    return {
      url: `/admin/category/category-all-videos/${id}`,
      method: "GET",
      params,
    };
  },
  providesTags: ["Categories"],
}),

    // Single category endpoint
    getSingleCategory: builder.query({
      query: (id) => {
        return {
          url: `/admin/category/single/${id}`,
          method: "GET",
        };
      },
      providesTags: (result, error, id) => [{ type: "Category", id }],
    }),
    getCategoryVideoDetails: builder.query({
      query: (id) => {
        return {
          url: `/admin/videos/management/get-single-video-for-admin/${id}`,
          method: "GET",
        };
      },
      providesTags: (result, error, id) => [{ type: "Category", id }],
    }),

    // Toggle status endpoint
    toggleCategoryStatus: builder.mutation({
      query: ({ id, status }) => {
        return {
          url: `/admin/category/${id}`,
          method: "PUT",
          body: { status },
        };
      },
      invalidatesTags: (result, error, arg) => [
        "Categories",
        { type: "Category", id: arg.id },
      ],
    }),

    // Update category order endpoint
    updateCategoryOrder: builder.mutation({
      query: (categoryOrder) => {
        return {
          url: `/admin/category/shuffle`,
          method: "POST",
          body: categoryOrder ,
        };
      },
    invalidatesTags: ["Categories"],
    }),

    updateVideoOrderInCategory: builder.mutation({
      query: (orderData) => ({
        url: "/admin/videos/management/shuffle",
        method: "POST",
        body: orderData,
      }),
      invalidatesTags: ["Video"],
    }),

    videoAddInCategory: builder.mutation({
      query: (scheduleData) => {
        return {
          url: `/admin/videos/library/copy-video`,
          method: "POST",
          body: scheduleData ,
        };
      },
      invalidatesTags: ["Categories"],
    }),
  }),
});

export const {
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetSingleCategoryQuery,
  useGetByCategoryAllVideosQuery,
  useToggleCategoryStatusMutation,
  useUpdateCategoryOrderMutation,
  useVideoAddInCategoryMutation,
  useGetCategoryVideoDetailsQuery,
  useDeleteCategoryVideoMutation,
  useUpdateVideoOrderInCategoryMutation,




} = categorySlice;

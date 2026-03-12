import { api } from "../api/baseApi";

const authSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    otpVerify: builder.mutation({
      query: (data) => ({
        method: "POST",
        url: "/auth/verify-email",
        body: data,
      }),
    }),

    login: builder.mutation({
      query: (data) => ({
        method: "POST",
        url: "/auth/login",
        body: data,
      }),
      invalidatesTags: ["Auth","User"],
    }),

    forgotPassword: builder.mutation({
      query: (data) => ({
        method: "POST",
        url: "/auth/forget-password",
        body: data,
      }),
    }),

    resetPassword: builder.mutation({
      query: (value) => ({
        method: "POST",
        url: "/auth/reset-password",
        body: value,
      }),
    }),

    changePassword: builder.mutation({
      query: (data) => ({
        method: "POST",
        url: "/auth/change-password",
        body: data,
      }),
      invalidatesTags: ["Auth"],
    }),

    updateProfile: builder.mutation({
      query: (data) => ({
        method: "PATCH",
        url: "/users/profile",
        body: data,
      }),
      invalidatesTags: ["Auth"],
    }),

    profile: builder.query({
      query: () => ({
        method: "GET",
        url: "/users/profile",
      }),
      providesTags: ["Auth"],
    }),
  }),

});

export const {
  useOtpVerifyMutation,
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useUpdateProfileMutation,
  useProfileQuery,
} = authSlice;

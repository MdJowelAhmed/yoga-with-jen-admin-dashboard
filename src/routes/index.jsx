import { createBrowserRouter } from "react-router-dom";
import Auth from "../Layout/Auth/Auth";
import Main from "../Layout/Main/Main";
import Home from "../Pages/Dashboard/Home";
// import Banner from "../Pages/Dashboard/Banner";
import AboutUs from "../Pages/Dashboard/AboutUs";
import PrivacyPolicy from "../Pages/Dashboard/PrivacyPolicy";
import TermsAndConditions from "../Pages/Dashboard/TermsAndCondition";
import ChangePassword from "../Pages/Auth/ChangePassword";
import Login from "../Pages/Auth/Login";
import ForgotPassword from "../Pages/Auth/ForgotPassword";
import VerifyOtp from "../Pages/Auth/VerifyOtp";
import ResetPassword from "../Pages/Auth/ResetPassword";
import NotFound from "../NotFound";
import Notifications from "../Pages/Dashboard/Notifications";
import SubCategory from "../Pages/Dashboard/SubCategory";
import AdminProfile from "../Pages/Dashboard/AdminProfile/AdminProfile";
import ViewSalesReps from "../components/SalesRepsManagement/detailsSalesReps/SubCategoryTable";
import VideoManagement from "../components/SalesRepsManagement/detailsSalesReps/VideoManagement";
import VideoManagementSystem from "../components/SalesRepsManagement/detailsSalesReps/VideoManagement";
import OrderManagementContainer from "../components/orderManagement/OrderManagementContainer";

import QuotationManagement from "../components/quotation/QuotationManagement";
import SubCategoryManagement from "../components/SalesRepsManagement/detailsSalesReps/CategoryDetails";
import LoginCredentials from "../components/loginCredentials/LoginCredentials";
import CommingSoonVideoPage from "../components/comingSoon/CommingSoonVideoPage";
import TodayVideos from "../components/todayVideos/TodayVideos";
import ChallengeDetails from "../components/todayVideos/ChallengeDetails";
import CourseDetailsVideoManagement from "../components/retailerManagement/CourseDetailsVideoManagement";
import TodayVideoManagement from "../components/todayVideoManagement/TodayVideoManagement";

import DailyInspirationPage from "../components/comingSoon/DailyInspiration";
import PostManagementSystem from "../components/createPost/CreatePostManagement";


// import PageManagement from "../Pages/Dashboard/LoginAndRegisterBG";
import ContactManagement from "../components/contactus/ContactUsUser";

import PrivateRoute from "./ProtectedRoute";
import SubscriptionManagementTable from "../components/subscriptionUser/SubscriptionUser";
import SubscriptionManagement from "../components/subscriptionmanagement/SubscriptionManagements";
import VideoManagementContainer from "../components/videoManagement/VideoManagementContainer";
import CategoryContainer from "../components/CategoryVideo/CategoryContainer";
import CategoryVideos from "../components/CategoryVideo/CategoryVideo";
import PushNotification from "../Pages/Dashboard/PushNotification";
import GreetingMessage from "../Pages/Dashboard/GreetingMessage";
import Leaderboard from "../Pages/Dashboard/Leaderboard";

const router = createBrowserRouter([
  {
    path: "/",
    element: <PrivateRoute><Main /></PrivateRoute> ,
    // element: <Main />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/user-management",
        element: <OrderManagementContainer />,
      },
      {
        path: "/salesmanagement",
        element: <VideoManagementSystem />,
      },
      {
        path: "/video-management",
        element: <VideoManagementContainer />,
      },
      {
        path: "/video-management/:subCategoryId",
        element: <CourseDetailsVideoManagement />,
      },
      {
        path: "/category-management",
        element: <CategoryContainer />,
      },
      {
        path: "/subcategory-management/:categoryId",
        element: <SubCategoryManagement />,

      },
      {
        path: "/category-management/:categoryId",
        element: <CategoryVideos />,
      },
      {
        path: "/quotation-management",
        element: <QuotationManagement />,
      },
      {
        path: "/salesRepsManage/:id",
        element: <ViewSalesReps />,
      },
      {
        path: "/sales-video-management/:subCategoryId",
        element: <VideoManagement />,
      },
      {
        path: "/subscription-package",
        element: <SubscriptionManagement />,
      },
      {
        path: "/coming-soon",
        element: <CommingSoonVideoPage />,
      },
      {
        path: "/today-video",
        element: <TodayVideoManagement />,
      },
      {
        path: "/challenge-management",
        element: <TodayVideos />,
      },
      {
        path: "/challenge-details/:id",
        element: <ChallengeDetails />,
      },
      {
        path: "/daily-inspiration",
        element: <DailyInspirationPage />,
      },
      {
        path: "/login-credentials",
        element: <LoginCredentials />,
      },
      {
        path: "/create-post",
        element: <PostManagementSystem />,
      },
      {
        path: "/push-notification",
        element: <PushNotification />,
      },
      {
        path: "/greeting-message",
        element: <GreetingMessage />,
      },
      {
        path: "/leaderboard",
        element: <Leaderboard />,
      },
      // {
      //   path: "/category",
      //   element: <Category />,
      // },
      // {
      //   path: "/login-register",
      //   element: <PageManagement />,
      // },
      {
        path: "/contactUs",
        element: <ContactManagement />,
      },
      {
        path: "/subcription-user",
        element: <SubscriptionManagementTable />,
      },
      // {
      //   path: "/banner",
      //   element: <Banner />,
      // },
      {
        path: "/about-us",
        element: <AboutUs />,
      },
      {
        path: "/privacy-policy",
        element: <PrivacyPolicy />,
      },
      {
        path: "/terms-and-conditions",
        element: <TermsAndConditions />,
      },
      {
        path: "/change-password",
        element: <ChangePassword />,
      },
      {
        path: "/sub-category",
        element: <SubCategory />,
      },
      {
        path: "/profile",
        element: <AdminProfile />,
      },
      {
        path: "/notification",
        element: <Notifications />,
      },
    ],
  },
  {
    path: "/auth",
    element: <Auth />,
    children: [
      {
        path: "/auth",
        element: <Login />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "forgot-password",
        element: <ForgotPassword />,
      },
      {
        path: "verify-otp",
        element: <VerifyOtp />,
      },
      {
        path: "reset-password",
        element: <ResetPassword />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;

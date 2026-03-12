import { jwtDecode } from "jwt-decode";
import React from "react";
import toast from "react-hot-toast";
import { Navigate, useLocation } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const location = useLocation();

  const token = localStorage.getItem("token");
  // console.log(token);

  if (!token) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000; // seconds

    if (decoded.exp < currentTime) {
      localStorage.removeItem("token");
      return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }

    if (decoded.role === "ADMIN" || decoded.role === "SUPER_ADMIN") {
      return children;
    } else {
      toast.error("You are not authorized to access this page");  
      return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }
  } catch (error) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
};

export default PrivateRoute;

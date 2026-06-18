import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import bgImage from "../../assets/bgImage.png";
import loginImage from "../../assets/loginImage.png";
import forgotImage from "../../assets/forgotImage.png";
import otpImage from "../../assets/otpImage.png";
import resetImage from "../../assets/resetImage.png";

const Auth = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // ✅ State to control which image to show
  const [imageToShow, setImageToShow] = useState(loginImage);

  useEffect(() => {
    const getLeftSideImage = () => {
      if (currentPath.includes("/auth/forgot-password")) {
        return forgotImage;
      } else if (currentPath.includes("/auth/verify-otp")) {
        return otpImage;
      } else if (currentPath.includes("/auth/reset-password")) {
        return resetImage;
      } else {
        return loginImage;
      }
    };

    const selectedImage = getLeftSideImage();
    setImageToShow(selectedImage);
  }, [currentPath]);

  return (
    <div
      className="w-full flex items-center justify-end relative"
      style={{ height: "100vh" }}
    >
      {/* Background image */}
      <div
        style={{
          background: `linear-gradient(180deg, rgba(255, 255, 255, 0.00) 0%, rgba(0, 0, 0, 0.70) 100%), url(${bgImage})`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
        }}
      ></div>

      {/* Left side - Dynamic image */}
      {/* <div
        className="w-1/2 h-full hidden md:flex items-center justify-center"
        style={{
          position: "relative",
          left: 100,
          zIndex: 1,
        }}
      >
        <img
          src={imageToShow}
          alt="Authentication visual"
          className="h-full w-full object-contain"
          style={{
            maxHeight: "90vh",
            padding: "20px",
          }}
        />
      </div> */}

      {/* Right side - Auth form */}
      <div className="md:w-1/2 w-full flex justify-end px-4">
        <div
          style={{
            background: "#FCFCFC3B",
            padding: 30,
            paddingBottom: 40,
            borderRadius: 15,
            maxWidth: 500,
            width: "100%",
            position: "relative",
            right: 100,
            zIndex: 1,
            // border: "2px solid #A92C2C",
            backdropFilter: "blur(10px)",
          }}
          className="shadow-xl"
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Auth;

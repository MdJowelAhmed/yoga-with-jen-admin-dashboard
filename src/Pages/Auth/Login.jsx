import { Button, Checkbox, Form, Input } from "antd";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FormItem from "../../components/common/FormItem";
import image4 from "../../assets/image4.png";
import { useLoginMutation } from "../../redux/apiSlices/authSlice";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const [login, { isLoading, isSuccess, error, data }] = useLoginMutation();

  const onFinish = async (values) => {
    try {
      // Call the login mutation with email and password
      const response = await login({
        email: values.email,
        password: values.password,
      }).unwrap();

      if (response.success) {
        const token = response.data.accessToken;
        localStorage.setItem("token", token);

        // Decode token to get user role
        const decoded = jwtDecode(token);

        // Navigate based on role
        if(decoded.role === "USER"){
          toast.error("You are not authorized to access this page");
          navigate("/auth/login");
        }
        if (decoded.role === "ADMIN") {
          navigate("/category-management");
        } else if (decoded.role === "SUPER_ADMIN") {
          navigate("/");
        }
      }
    } catch (err) {
      console.error("Login failed:", err);
      // Error handling could be improved with user feedback
    }
  };

  // Optional: Handle success case with useEffect (no longer needed as we handle navigation in onFinish)
  useEffect(() => {
    if (isSuccess && data?.token) {
      // This effect is no longer needed as we handle navigation in onFinish
      // Keeping it for backward compatibility
    }
  }, [isSuccess, data, navigate]);

  return (
    <div>
      <div className="text-center mb-8">
        <img src={image4} alt="logo" className="h-40 w-60 mx-auto mb-4" />
        {/* <h1 className="text-[25px] font-semibold mb-6">Login</h1> */}
        <p className="text-white">Welcome back! Please enter your details.</p>
      </div>
      <Form onFinish={onFinish} layout="vertical">
        {/* <FormItem name={"email"} label={<p className="text-white">Email</p>} placeholder="Enter your email" /> */}
        <Form.Item name="email" label={<p className="text-white">Email</p>}>
          <Input 
          placeholder="Enter your email" 
          // size="large" 
          className="h-[45px] border-none outline-none rounded-lg " />
        </Form.Item>

        <Form.Item
          name="password"
          label={<p className="text-white">Password</p>}
          rules={[
            {
              required: true,
              message: "Please input your Password!",
            },
          ]}
        >
          <Input.Password
            type="password"
            placeholder="Enter your password"
            style={{
              height: 45,
              border: "1px solid #d9d9d9",
              outline: "none",
              boxShadow: "none",
            }}
          />
        </Form.Item>

        {/* <div className="flex items-center justify-end">
          <a
            className="login-form-forgot text-white hover:text-white"
            href="/auth/forgot-password"
          >
            Forgot password
          </a>
        </div> */}

        <Form.Item style={{ marginBottom: 0 }}>
          <button
            htmlType="submit"
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              height: 45,
              color: "white",
              fontWeight: "400px",
              fontSize: "18px",
              marginTop: 30,
            }}
            className="flex items-center justify-center bg-gradient-to-r from-primary to-secondary border border-[#A92C2C] rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <div className="animate-spin">⏳</div> : "Login"}
          </button>
        </Form.Item>

        {error && (
          <div className="mt-4 text-red-500 text-center">
            {error.data?.message || "Login failed. Please try again."}
          </div>
        )}
      </Form>
    </div>
  );
};

export default Login;

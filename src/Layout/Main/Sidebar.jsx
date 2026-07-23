import { Menu, Modal } from "antd";
import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { IoIosLogOut } from "react-icons/io";
import {
  Dashboard,
  SalesRepsManagement,
  Settings,
  Videomanagement,
  Inventorymanagement,
  LoyaltyProgram,
  SubscriptionManagement,
  Usermanagement,
  LoginCredentials,
  ComingSoon,
  subscriptionUser,
  contactUs,
  CreatePost,
  DailyInspiration,
  Challenge,
} from "../../components/common/Svg";
import image4 from "../../assets/image4.png"; // Logo image

const Sidebar = () => {
  const location = useLocation();
  const path = location.pathname;
  const [selectedKey, setSelectedKey] = useState("");
  const [openKeys, setOpenKeys] = useState([]);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const navigate = useNavigate();

  // ✅ Token decode safely
  const token = localStorage.getItem("token");
  let decoded = {};
  let role = null;

  if (token && typeof token === "string") {
    try {
      decoded = jwtDecode(token);
      role = decoded?.role;
    } catch (error) {
      console.error("Invalid token:", error);
      localStorage.removeItem("token");
      navigate("/auth/login"); // Redirect to login if token invalid
    }
  } else {
    navigate("/auth/login"); // Redirect if token is missing
  }

  const showLogoutConfirm = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLogoutModalOpen(false);
    navigate("/auth/login");
  };

  const handleCancel = () => {
    setIsLogoutModalOpen(false);
  };

  const isItemActive = (itemKey) => {
    return (
      selectedKey === itemKey ||
      (itemKey === "subMenuSetting" &&
        ["/profile", "/terms-and-conditions", "/privacy-policy"].includes(
          selectedKey
        ))
    );
  };

  const renderIcon = (IconComponent, itemKey) => {
    const isActive = isItemActive(itemKey);
    return (
      <div
        style={{ width: 28, height: 28 }}
        className={isActive ? "svg-active" : ""}
      >
        <IconComponent
          className="menu-icon"
          fill={isActive ? "#ffffff" : "#1E1E1E"}
          style={{
            fontWeight: "bold",
            strokeWidth: isActive ? 2 : 1,
          }}
        />
      </div>
    );
  };

  const menuItems = [
    {
      key: "/",
      icon: renderIcon(Dashboard, "/"),
      label: <Link to="/">Overview</Link>,
      roles: ["SUPER_ADMIN"],
    },
    {
      key: "/user-management",
      icon: renderIcon(Usermanagement, "/user-management"),
      label: <Link to="/user-management">Users management</Link>,
      roles: ["SUPER_ADMIN"],
    },
    {
      key: "/category-management",
      icon: renderIcon(SalesRepsManagement, "/category-management"),
      label: <Link to="/category-management">Category management</Link>,
    },
    {
      key: "/video-management",
      icon: renderIcon(Videomanagement, "/video-management"),
      label: <Link to="/video-management">Video management</Link>,
    },
    {
      key: "/coming-soon",
      icon: renderIcon(ComingSoon, "/coming-soon"),
      label: <Link to="/coming-soon"> Coming Soon</Link>,
    },
    {
      key: "/today-video",
      icon: renderIcon(Challenge, "/today-video"),

      label: <Link to="/today-video">Today's Video</Link>,
    },
    {
      key: "/challenge-management",
      icon: renderIcon(Challenge, "/challenge-management"),

      label: <Link to="/challenge-management">Challenge management</Link>,
    },
    {
      key: "/daily-inspiration",
      icon: renderIcon(DailyInspiration, "/daily-inspiration"),

      label: <Link to="/daily-inspiration"> Daily Inspiration</Link>,
    },
    {
      key: "/create-post",
      icon: renderIcon(CreatePost, "/create-post"),

      label: <Link to="/create-post">Create Post</Link>,
    },
    {
        key: "/subscription-package",
        icon: renderIcon(SubscriptionManagement, "/subscription-package"),
      label: <Link to="/subscription-package">Subscription package</Link>,
      roles: ["SUPER_ADMIN"],
    },
    {
      key: "/subcription-user",
      icon: renderIcon(subscriptionUser, "/subcription-user"),

      label: <Link to="/subcription-user">Subscription Users</Link>,
      roles: ["SUPER_ADMIN"],
    },
    {
      key: "/quotation-management",
      icon: renderIcon(Inventorymanagement, "/quotation-management"),
      label: <Link to="/quotation-management">Quotation management</Link>,
    },
    {
      key: "/push-notification",
      icon: renderIcon(LoyaltyProgram, "/push-notification"),
      label: <Link to="/push-notification">Push Notification</Link>,
    },
    {
      key: "/login-credentials",
      icon: renderIcon(LoginCredentials, "/login-credentials"),
      label: <Link to="/login-credentials">Login Credentials</Link>,
      roles: ["SUPER_ADMIN"],
    },
    {
      key: "/contactUs",
      icon: renderIcon(contactUs, "/contactUs"),

      label: <Link to="/contactUs">Contact Us</Link>,
    },
    {
      key: "/greeting-message",
      icon: renderIcon(LoginCredentials, "/greeting-message"),
      label: <Link to="/greeting-message">Greeting Message</Link>,
    },
    {
      key: "/leaderboard",
      icon: renderIcon(LoginCredentials, "/leaderboard"),
      label: <Link to="/leaderboard">Leaderboard</Link>,
    },
    {
      key: "subMenuSetting",
      icon: renderIcon(Settings, "subMenuSetting"),
      label: "Settings",
      children: [
        {
          key: "/profile",
          label: <Link to="/profile">Update Profile</Link>,
          roles: ["SUPER_ADMIN"],
        },
        {
          key: "/terms-and-conditions",
          label: <Link to="/terms-and-conditions">Terms And Condition</Link>,
        },
        {
          key: "/privacy-policy",
          label: <Link to="/privacy-policy">Privacy Policy</Link>,
        },
      ],
    },
    {
      key: "/logout",
      icon: <IoIosLogOut size={24} />,
      label: <p onClick={showLogoutConfirm}>Logout</p>,
    },
  ];

  const getFilteredMenuItems = () => {
    return menuItems.filter((item) => {
      if (item.roles) {
        return item.roles.includes(role);
      }
      if (item.children) {
        const filteredChildren = item.children.filter((child) => {
          if (child.roles) {
            return child.roles.includes(role);
          }
          return true;
        });
        return filteredChildren.length > 0;
      }
      return true;
    });
  };

  useEffect(() => {
    const selectedItem = menuItems.find(
      (item) =>
        item.key === path || item.children?.some((sub) => sub.key === path)
    );

    if (selectedItem) {
      setSelectedKey(path);

      if (selectedItem.children) {
        setOpenKeys([selectedItem.key]);
      } else {
        const parentItem = menuItems.find((item) =>
          item.children?.some((sub) => sub.key === path)
        );
        if (parentItem) {
          setOpenKeys([parentItem.key]);
        }
      }
    }
  }, [path]);

  const handleOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 border-b-2 border-primary flex items-center justify-center h-36">
        <img src={image4} alt="logo" className="w-60" />
      </div>

      <div className="flex-1 overflow-y-auto mt-2">
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          className="font-poppins text-black sidebar-menu"
          style={{
            borderRightColor: "transparent",
            background: "transparent",
          }}
          items={getFilteredMenuItems().map((item) => ({
            ...item,
            label: <span>{item.label}</span>,
            children: item.children
              ? item.children.map((subItem) => ({
                  ...subItem,
                  label: <span>{subItem.label}</span>,
                }))
              : undefined,
          }))}
        />
      </div>

      {/* Logout Modal */}
      <Modal
        centered
        title="Confirm Logout"
        open={isLogoutModalOpen}
        onOk={handleLogout}
        onCancel={handleCancel}
        okText="Logout"
        cancelText="Cancel"
        okButtonProps={{
          style: {
            backgroundColor: "red",
            borderColor: "red",
          },
        }}
      >
        <p>Are you sure you want to logout?</p>
      </Modal>
    </div>
  );
};

export default Sidebar;

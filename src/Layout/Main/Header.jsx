

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FaRegBell } from "react-icons/fa6";
import { Badge, Avatar, ConfigProvider, Flex, Popover, message } from "antd";
import { CgMenu } from "react-icons/cg";
import { io } from "socket.io-client";
import { RiSettings5Line, RiShutDownLine } from "react-icons/ri";
import { jwtDecode } from "jwt-decode";
import NotificationPopover from "../../Pages/Dashboard/NotificationPopover";
import { getImageUrl } from "../../components/common/imageUrl";
import { useProfileQuery } from "../../redux/apiSlices/authSlice";
import { useGetNotificationQuery } from "../../redux/apiSlices/notificationSlice";

let decodedToken = null;
const tokenStr = localStorage.getItem("token");
const token = tokenStr || null;

if (token) {
  try {
    decodedToken = jwtDecode(token);
  } catch (error) {
    console.error(
      " Failed to decode token outside useEffect:",
      error.message
    );
  }
}


const Header = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);
  const { data: getProfile } = useProfileQuery();
  const { data: getNotification, refetch: refetchNotifications } = useGetNotificationQuery({ page: 1, limit: 20 });

  
  // Initialize notifications from API
  useEffect(() => {
    if (getNotification?.success && getNotification?.data) {
      setNotifications(getNotification.data);
      const unreadNotifications = getNotification.data.filter(notification => !notification.read);
      setUnreadCount(unreadNotifications.length);
    }
  }, [getNotification?.data, getNotification?.success]);
  
  useEffect(() => {
    if (!decodedToken?.id || !getProfile?.data?._id) {
      console.error("No valid token or profile data");
      return;
    }
    const connectSocket = async () => {
      try {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }

      
        socketRef.current = io("https://api.yogawithjen.life", {
          auth: { token },
          transports: ["websocket"],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          randomizationFactor: 0.5,
        });

        socketRef.current.on("connect", () => {
          setSocketConnected(true);
        });

        socketRef.current.on("disconnect", (reason) => {
          setSocketConnected(false);
          if (reason === "io server disconnect") {
            setTimeout(() => {
              socketRef.current.connect();
            }, 1000);
          }
        });

        socketRef.current.on("connect_error", (error) => {
          console.error(" Socket connection error:", error.message);
          setSocketConnected(false);
          setTimeout(() => {
            socketRef.current.connect();
          }, 2000);
        });

        let notificationChannel;
        const event = decodedToken?.id || getProfile?.data?._id;
      
        if (event) {
          notificationChannel = `notification::${event}`;
        } else {
          console.error(" Cannot determine notification channel  role");
          return;
        }


        // Listen for all socket events for debugging
        socketRef.current.onAny((event, ...args) => {
         
        });

        socketRef.current.on(notificationChannel, (data) => {
          

          let notification = data;

          if (typeof data === "string") {
            try {
              notification = JSON.parse(data);
            } catch (err) {
              console.error("⚠️ Failed to parse notification:", err);
              notification = {
                message: data,
                timestamp: new Date().toISOString(),
                read: false,
                _id: Date.now().toString() // temporary ID for new notifications
              };
            }
          }

          // Ensure notification has required properties
          if (!notification.hasOwnProperty('read')) {
            notification.read = false;
          }

        
          setNotifications((prev) => {
            // Check if notification already exists to avoid duplicates
            const existingIndex = prev.findIndex(n => n._id === notification._id);
            if (existingIndex !== -1) {
              
              return prev;
            }
            
            const newNotifications = [notification, ...prev];
            
            return newNotifications;
          });

          // Only increment unread count if notification is unread
          if (!notification.read) {
            setUnreadCount((prev) => {
              const newCount = prev + 1;
              
              return newCount;
            });
          }

          message.info("New notification received");
          
          // Refetch notifications to get the latest from server
          setTimeout(() => {
            refetchNotifications();
          }, 500);
        });

       
      } catch (error) {
        console.error("Failed to initialize socket:", error);
        message.error("Failed to connect to notification service");
      }
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocketConnected(false);
      }
    };
  }, [decodedToken?.id, getProfile?.data?._id, token]); // Optimized dependencies to prevent unnecessary reconnections

  // Monitor notification changes and sync unread count
  useEffect(() => {
    if (notifications.length > 0) {
      const actualUnreadCount = notifications.filter(n => !n.read && !n.isRead).length;
      if (actualUnreadCount !== unreadCount) {
        setUnreadCount(actualUnreadCount);
      }
    }
  }, [notifications, unreadCount]);

  const handleNotificationRead = () => {
    const readNotifications = notifications.map((n) => ({
      ...n,
      read: true, // Use 'read' property to match API response
      isRead: true, // Keep for backward compatibility
    }));
    setNotifications(readNotifications);
    setUnreadCount(0);
  };

  const userMenuContent = (
    <div>
      <div className="mr-4 flex gap-2.5 font-semibold hover:text-black cursor-pointer">
        {`${
          getProfile?.data?.name || getProfile?.data?.userName || "John Doe"
        } `}
      </div>
      <p>{`${getProfile?.data?.role} `}</p>
      <Link
        to="/profile"
        className="flex items-center gap-2 py-1 mt-1 text-black hover:text-smart"
      >
        <RiSettings5Line className="text-gray-400 animate-spin" />
        <span>Setting</span>
      </Link>
      {/* <Link
        to="/auth/login"
        className="flex items-center gap-2 py-1 text-black hover:text-smart"
      >
        <RiShutDownLine className="text-red-500 animate-pulse" />
        <span>Log Out</span>
      </Link> */}
    </div>
  );

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: "16px",
          colorPrimaryBorderHover: "red",
        },
        components: {
          Dropdown: {
            paddingBlock: "5px",
          },
        },
      }}
    >
      <Flex
        align="center"
        justify="space-between"
        className="w-full min-h-[72px] px-4 py-2 shadow-sm overflow-auto text-slate-700 bg-white"
      >
        {/* <div>
          <CgMenu
            size={30}
            onClick={toggleSidebar}
            className="cursor-pointer text-smart"
          />
        </div> */}

        <Flex align="center" gap={30} justify="flex-end"  className="w-full ml-10">
          {/* <Online /> */}
          <Popover
            content={
              <NotificationPopover
                notifications={notifications}
                onRead={handleNotificationRead}
              />
            }
            trigger="click"
            arrow={false}
            placement="bottom"
            onOpenChange={(visible) => {
              if (visible) {
                // Don't auto-mark as read when opening, let user manually mark
                // handleNotificationRead();
              }
            }}
          >
            {/* <div className="w-12 h-12 bg-primary text-white flex items-center justify-center rounded-full relative cursor-pointer">
              <FaRegBell size={30} className="text-smart" />
              {unreadCount > 0 ? (
                <Badge
                  key={`badge-${unreadCount}`}
                  count={unreadCount}
                  overflowCount={5}
                  size="default"
                  color="red"
                  className="absolute top-2 right-3"
                />
              ) : null}
            </div> */}
          </Popover>

          <Popover
            content={userMenuContent}
            trigger="click"
            arrow={false}
            placement="bottomLeft"
          >
            <Avatar
              // shape="square"
              size={60}
              className="rounded-full cursor-pointer mr-16"
              src={getImageUrl(getProfile?.data?.image)}
             
            />
          </Popover>
        </Flex>
      </Flex>
    </ConfigProvider>
  );
};

export default Header;

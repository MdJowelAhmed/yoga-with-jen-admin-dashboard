import React from "react";
import {
  Modal,
  Typography,
  Divider,
  Row,
  Col,
  Tag,
  Badge,
  Card,
  Space,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  CrownOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { FaLocationDot } from "react-icons/fa6";

const { Title, Text } = Typography;

const UserDetailsModal = ({ visible, onClose, userDetails }) => {
  if (!userDetails) return null;

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to calculate remaining trial days
  const getRemainingTrialDays = () => {
    if (!userDetails.trialExpireAt) return 0;
    const now = new Date();
    const expireDate = new Date(userDetails.trialExpireAt);
    const diffTime = expireDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const modalTitleStyle = {
    color: "#CA3939",
    marginBottom: 0,
    fontWeight: 600,
  };

  const sectionTitleStyle = {
    color: "#262626",
    marginBottom: 16,
    fontWeight: 600,
    fontSize: "16px",
  };

  const labelStyle = {
    fontWeight: 500,
    color: "#595959",
    minWidth: "120px",
    display: "inline-block",
  };

  const valueStyle = {
    color: "#262626",
    fontWeight: 400,
  };

  const cardStyle = {
    marginBottom: 16,
    borderRadius: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  };

  const getStatusTag = (status, isSubscribed, isFreeTrial) => {
    if (status === "active" && isSubscribed) {
      return (
        <Tag color="success" icon={<CheckCircleOutlined />}>
          Active Subscriber
        </Tag>
      );
    } else if (status === "active" && isFreeTrial) {
      return (
        <Tag color="processing" icon={<ClockCircleOutlined />}>
          Free Trial
        </Tag>
      );
    } else if (status === "active") {
      return (
        <Tag color="default" icon={<CheckCircleOutlined />}>
          Active
        </Tag>
      );
    } else {
      return (
        <Tag color="error" icon={<ExclamationCircleOutlined />}>
          Inactive
        </Tag>
      );
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <UserOutlined style={{ color: "#CA3939" }} />
          <Title level={4} style={modalTitleStyle}>
            User Profile Details
          </Title>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      bodyStyle={{ padding: "0" }}
      style={{ top: 20 }}
    >
      <div style={{ padding: "24px" }}>
        {/* User Status Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #CA3939 0%, #DE5555 100%)",
            borderRadius: 8,
            padding: 20,
            marginBottom: 24,
            color: "white",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <Title level={3} style={{ color: "white", margin: 0 }}>
                {userDetails.name || "N/A"}
              </Title>
              <Text
                style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px" }}
              >
                Member since {formatDate(userDetails.joinDate)}
              </Text>
            </div>
            <div style={{ textAlign: "right" }}>
              {getStatusTag(
                userDetails.status,
                userDetails.isSubscribed,
                userDetails.isFreeTrial
              )}
              {userDetails.verified && (
                <div style={{ marginTop: 8 }}>
                  <Badge
                    status="success"
                    text="Verified Account"
                    style={{ color: "white" }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <Card title="Personal Information" style={cardStyle}>
          <Row gutter={[24, 16]}>
            <Col span={12}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MailOutlined style={{ color: "#CA3939" }} />
                <div>
                  <Text style={labelStyle}>Email:</Text>
                  <br />
                  <Text style={valueStyle}>{userDetails.email || "N/A"}</Text>
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <PhoneOutlined style={{ color: "#CA3939" }} />
                <div>
                  <Text style={labelStyle}>Phone:</Text>
                  <br />
                  <Text style={valueStyle}>
                    {userDetails.phone || "Not provided"}
                  </Text>
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <UserOutlined style={{ color: "#CA3939" }} />
                <div>
                  <Text style={labelStyle}>Role:</Text>
                  <br />
                  <Tag color="red">{userDetails.role}</Tag>
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FaLocationDot style={{ color: "#CA3939" }} />
                <div>
                  <Text style={labelStyle}>Address:</Text>
                  <br />
                  <Text style={valueStyle}>
                    {userDetails?.address || "Not provided"}
                  </Text>
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Activity Statistics */}
        <Card title="Activity & Progress" style={cardStyle}>
          <Row gutter={[24, 16]}>
            <Col span={8}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#CA3939",
                  }}
                >
                  {userDetails.completedSessions?.length || 0}
                </div>
                <Text style={{ color: "#8c8c8c" }}>Completed Sessions</Text>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#DE5555",
                  }}
                >
                  {userDetails.matTime || "0"}
                </div>
                <Text style={{ color: "#8c8c8c" }}>Total Mat Time</Text>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#CA3939",
                  }}
                >
                  {userDetails.loginCount}
                </div>
                <Text style={{ color: "#8c8c8c" }}>Login Count</Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Subscription Information */}
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CrownOutlined style={{ color: "#CA3939" }} />
              <span>Subscription Details</span>
            </div>
          }
          style={cardStyle}
        >
          <Row gutter={[24, 16]}>
            <Col span={8}>
              <Text style={labelStyle}>Subscription Status:</Text>
              <br />
              <Tag color={userDetails.isSubscribed ? "success" : "default"}>
                {userDetails.isSubscribed ? "Subscribed" : "Not Subscribed"}
              </Tag>
            </Col>
            <Col span={8}>
              <Text style={labelStyle}>Package:</Text>
              <br />
              <Text style={valueStyle}>{userDetails.packageName || "N/A"}</Text>
            </Col>
            {/* <Col span={12}>
              <Text style={labelStyle}>Subscription Title:</Text>
              <br />
              <Text style={valueStyle}>
                {userDetails.subscriptionTitle || "N/A"}
              </Text>
            </Col> */}
            <Col span={8}>
              <Text style={labelStyle}>Stripe Customer ID:</Text>
              <br />
              <Text
                style={valueStyle}
                copyable={{ text: userDetails.stripeCustomerId }}
              >
                {userDetails.stripeCustomerId || "N/A"}
              </Text>
            </Col>
          </Row>

          {userDetails.isFreeTrial && (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                background: "#ffeaea",
                border: "1px solid #ffb3b3",
                borderRadius: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ClockCircleOutlined style={{ color: "#DE5555" }} />
                <Text strong style={{ color: "#CA3939" }}>
                  Free Trial Active
                </Text>
              </div>
              <div style={{ marginTop: 8 }}>
                <Text>
                  Trial expires: {formatDate(userDetails.trialExpireAt)}
                </Text>
                <br />
                <Text>
                  Remaining days:{" "}
                  <strong>{getRemainingTrialDays()} days</strong>
                </Text>
              </div>
            </div>
          )}
        </Card>

        {/* System Information */}
        {/* <Card
          title="System Information"
          style={{ ...cardStyle, marginBottom: 0 }}
        >
          <Row gutter={[24, 16]}>
            <Col span={12}>
              <Text style={labelStyle}>User ID:</Text>
              <br />
              <Text style={valueStyle} copyable={{ text: userDetails._id }}>
                {userDetails._id}
              </Text>
            </Col>
            <Col span={12}>
              <Text style={labelStyle}>Created At:</Text>
              <br />
              <Text style={valueStyle}>
                {formatDate(userDetails.createdAt)}
              </Text>
            </Col>
            <Col span={12}>
              <Text style={labelStyle}>Last Updated:</Text>
              <br />
              <Text style={valueStyle}>
                {formatDate(userDetails.updatedAt)}
              </Text>
            </Col>
            <Col span={12}>
              <Text style={labelStyle}>Token Version:</Text>
              <br />
              <Text style={valueStyle}>{userDetails.tokenVersion}</Text>
            </Col>
          </Row>
        </Card> */}
      </div>
    </Modal>
  );
};

export default UserDetailsModal;

import React, { useState, useEffect } from "react";
import { Table, Input, Card, Typography, Tag, Badge } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useGetAllSubscriptionsQuery } from "../../redux/apiSlices/subscriptionUserApi";
import Spinner from "../common/Spinner";

const { Title } = Typography;

const SubscriptionManagementTable = () => {
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState([]);

  // API hook
  const { data: subscriptionsData, isLoading } =
    useGetAllSubscriptionsQuery(filters);


  // Update filters when search or pagination changes
  useEffect(() => {
    const newFilters = [
      { name: "page", value: currentPage },
      { name: "limit", value: pageSize },
    ];

    if (searchText) {
      newFilters.push({ name: "searchTerm", value: searchText });
    }

    setFilters(newFilters);
  }, [currentPage, pageSize, searchText]);

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "green";
      case "inactive":
        return "red";
      case "pending":
        return "orange";
      case "cancelled":
        return "red";
      default:
        return "default";
    }
  };

  // Payment type color mapping
  const getPaymentTypeColor = (paymentType) => {
    switch (paymentType?.toLowerCase()) {
      case "monthly":
        return "blue";
      case "yearly":
        return "purple";
      default:
        return "default";
    }
  };

  // Table columns
  const columns = [
    {
      title: "User Info",
      key: "userInfo",
      align: "center",
      render: (_, record) => (
        <div>
          <div>
            <strong>{record.userId?.name}</strong>
          </div>
          <div className="text-gray-500 text-sm">
            <a href={`mailto:${record.userId?.email}`}>
              {record.userId?.email}
            </a>
          </div>
        </div>
      ),
    },
    {
      title: "Package",
      key: "package",
      align: "center",
      render: (_, record) => (
        <div>
          <div>
            <strong>{record.package?.title}</strong>
          </div>
          {/* <div className="text-gray-500 text-sm">
            {record.package?.description}
          </div> */}
          <Tag
            color={getPaymentTypeColor(record.package?.paymentType)}
            className="mt-1"
          >
            {record.package?.paymentType}
          </Tag>
        </div>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      align: "center",
      render: (price) => (
        <span className="font-semibold text-green-600">${price}</span>
      ),
    },
    {
      title: "Period",
      key: "period",
      align: "center",
      render: (_, record) => (
        <div>
          <div className="text-sm">
            <strong>Start:</strong>{" "}
            {record.currentPeriodStart
              ? dayjs(record.currentPeriodStart).format("DD MMM YYYY")
              : record.status === "canceled"
              ? "Subscription Canceled"
              : "Not Active Yet"}
          </div>
    
          <div className="text-sm">
            <strong>End:</strong>{" "}
            {record.currentPeriodEnd
              ? dayjs(record.currentPeriodEnd).format("DD MMM YYYY")
              : record.status === "canceled"
              ? "Subscription Canceled"
              : "Not Active Yet"}
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status) => (
        <Badge
          status={status === "active" ? "success" : "error"}
          text={
            <Tag color={getStatusColor(status)}>{status?.toUpperCase()}</Tag>
          }
        />
      ),
    },
    {
      title: "Subscription",
      dataIndex: "provider",
      key: "provider",
      align: "center",
      render: (provider) =>
        provider ? (
          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
            {provider}
          </span>
        ) : null,
    },
  ];

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between">
        <Title level={2}>Subscription management</Title>

        {/* Search Only */}
        <div className="mb-4">
          <Input
            placeholder="Search by user name, email, or package"
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
            className="w-96"
          />
        </div>
      </div>

      {/* Simple Table */}
      <div className="border-2 rounded-lg">
        <Table
          columns={columns}
          dataSource={subscriptionsData?.subscriptions || []}
          rowKey="_id"
          loading={isLoading}
          size="middle"
          className="custom-table"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: subscriptionsData?.meta?.total || 0,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
          }}
        />
      </div>
    </div>
  );
};

export default SubscriptionManagementTable;

import React, { useState } from "react";
import { Table, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useGetRecentUsersQuery } from "../../redux/apiSlices/homeSlice";
import moment from "moment";

// Sample Data with Unique Keys




const OrderTable = () => {
  const { data } = useGetRecentUsersQuery()



  const columns = [
    {
      title: "User Name",
      dataIndex: "name",
      key: "name",
      align: "center",
    },
    { title: "Email", dataIndex: "email", key: "email", align: "center" },
    {
      title: "Joining Date",
      dataIndex: "createdAt",
      key: "createdAt",
      align: "center",
      render: (text) => <span>{moment(text).format("L")} </span>,
    },
    {
      title: "Subscription",
      dataIndex: "isSubscribed",
      key: "isSubscribed",
      align: "center",
      render: (text) => <span>{text ? "yes" : "No"} </span>,
    },
    {
      title: "Plan Running",
      dataIndex: "packageName",
      key: "packageName",
      align: "center",
      render: (text) => <span>{text || "N/A"}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
    },
  ];

  return (
    <div>
     

      {/* Table Container with Gradient Background */}
      <div className=" rounded-lg border-2">
        <Table
          dataSource={data}
          columns={columns}
          pagination={false}
          bordered={false}
          size="small"
          rowClassName="custom-table"
          className="custom-table"
        />
      </div>
    </div>
  );
};

export default OrderTable;

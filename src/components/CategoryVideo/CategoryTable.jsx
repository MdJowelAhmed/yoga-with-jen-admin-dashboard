import React from "react";
import { Table, Button, Space, Switch, Tag, Popconfirm } from "antd";
import {
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import moment from "moment/moment";
import { getImageUrl } from "../common/imageUrl";

const CategoryTable = ({
  categories,
  onEdit,
  onView,
  onStatusChange,
  onDelete, // Make sure this is passed as a prop
  onViewVideos, // New prop for viewing videos
}) => {

  const columns = [
    {
      title: "SL",
      key: "id",
      width: 60,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Category Name",
      dataIndex: "name",
      key: "name",
      align: "center",
    },
    {
      title: "Thumbnail",
      dataIndex: "thumbnail",
      key: "thumbnail",
      align: "center",
      render: (thumbnail) => (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <img
            src={getImageUrl(thumbnail)}
            alt="thumbnail"
            className="object-cover rounded-xl"
            style={{ width: 100, height: 60 }}
          />
        </div>
      ),
    },
    // {
    //   title: "Courses",
    //   dataIndex: "subCategory",
    //   key: "subCategory",
    //   align: "center",
    //   render: (subCategory) => {
    //     return Array.isArray(subCategory) ? subCategory.length : 0;
    //   },
    // },
    {
      title: "Videos",
      dataIndex: "videoCount",
      key: "videoCount",
      align: "center",
      render: (videoCount) => videoCount || 0,
    },
    {
      title: "Created Date",
      dataIndex: "createdAt",
      key: "createdAt",
      align: "center",
      render: (createdAt) => moment(createdAt).format("L"),
    },
    // {
    //   title: "Category Type",
    //   dataIndex: "categoryType",
    //   key: "categoryType",
    //   align: "center",
    // },
    // {
    //   title: "Status",
    //   dataIndex: "status",
    //   key: "status",
    //   align: "center",
    //   render: (status) => (
    //     <Tag color={status.toLowerCase() === "active" ? "green" : "red"}>
    //       {status}
    //     </Tag>
    //   ),
    // },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            className="text-blue-500"
            title="Edit Category"
          />
          {/* <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => onView(record)}
            className="text-green-500"
            title="View Sub Categories"
          /> */}
          <Button
            type="text"
            icon={<PlayCircleOutlined />}
            onClick={() => onViewVideos(record)}
            className="text-primary"
            title="View Videos"
          />
          {/* <Switch
            checked={record.status.toLowerCase() === "active"}
            size="small"
            onChange={(checked) => onStatusChange(checked, record)}
          /> */}
          <Button
            type="text"
            icon={<DeleteOutlined />}
            className="text-red-500"
            title="Delete Category"
            onClick={() => onDelete(record._id)}
          />
        </Space>
      ),
    },
  ];

  return (
   <div className="border-2 rounded-lg">
    <Table
      columns={columns}
      dataSource={categories}
      rowKey="_id"
      pagination={{ pageSize: 10 }}
      // bordered
      size="middle"
      className="custom-table"
    />
   </div>
  );
};

export default CategoryTable;

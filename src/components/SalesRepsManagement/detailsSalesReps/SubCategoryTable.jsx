import React from "react";
import { Table, Button, Space, Switch, Tag, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { getImageUrl } from "../../common/imageUrl";
import Thumbnail from "../../videoManagement/Thumbnail";

const SubCategoryTable = ({
  subCategories,
  onEdit,
  onView,
  onStatusChange,
  onDelete,
  categoryId,
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
      title: "Name",
      dataIndex: "name",
      key: "name",
      align: "center",
    },
    {
      title: "Thumbnail",
      dataIndex: "thumbnail",
      key: "thumbnail",
      render: (thumbnail) => (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Thumbnail
            thumbnailUrl={getImageUrl(thumbnail)}
            alt="thumbnail"
            className="object-cover rounded-xl"
            style={{ width: 100, height: 60 }}
          />
        </div>
      ),
      align: "center",
    },
    {
      title: "Videos",
      dataIndex: "videoCount",
      key: "videoCount",
      align: "center",
      render: (videoCount) => videoCount || 0,
    },
    // {
    //   title: "Created Date",
    //   dataIndex: "createdDate",
    //   key: "createdDate",
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
          />
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => onView(record)}
            className="text-green-500"
            title="View Sub Categories"
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
            title="Delete Sub-category"
            onClick={() => onDelete(record._id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={subCategories}
      rowKey="_id"
      pagination={{ pageSize: 10 }}
      bordered
      size="small"
      className="custom-table"
    />
  );
};

export default SubCategoryTable;

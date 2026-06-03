import React, { useState } from "react";
import { Table, Button, Switch, Space, Typography, Modal, message } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  useCreateBackUpAdminMutation,
  useDeleteBackUpAdminMutation,
  useGetLoginCredentialsQuery,
  useToggleBackUpAdminStatusMutation,
  useUpdateBackUpAdminMutation,
} from "../../redux/apiSlices/loginCredentials";
import AddBackUpAdminModal from "./AddBackUpAdminModal";
import Spinner from "../common/Spinner";

const { Title } = Typography;
const { confirm } = Modal;

export default function LoginCredentials() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);

  const { data, isLoading, refetch } = useGetLoginCredentialsQuery();
  const [createBackUpAdmin, { isLoading: isCreating }] =
    useCreateBackUpAdminMutation();
  const [deleteBackUpAdmin, { isLoading: isDeleting }] =
    useDeleteBackUpAdminMutation();
  const [updateBackUpAdmin, { isLoading: isUpdating }] =
    useUpdateBackUpAdminMutation();
  const [toggleBackUpAdminStatus, { isLoading: isToggling }] =
    useToggleBackUpAdminStatusMutation();

  const loginCredentials = data?.data || [];

  // const handleStatusChange = async (record, checked) => {
  //   try {
  //     await toggleBackUpAdminStatus({
  //       id: record._id,
  //       status: checked,
  //     }).unwrap();
  //     message.success(
  //       `Admin status ${checked ? "activated" : "deactivated"} successfully`
  //     );
  //     refetch();
  //   } catch (error) {
  //     message.error("Failed to update status");
  //     console.error("Status toggle error:", error);
  //   }
  // };

  const handleEdit = (record) => {
    setEditingAdmin(record);
    setIsModalOpen(true);
  };

  const handleDelete = (record) => {
    confirm({
      title: "Are you sure you want to delete this admin?",
      icon: <ExclamationCircleOutlined />,
      content: `This will permanently delete ${record.name}'s account.`,
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteBackUpAdmin(record._id).unwrap();
          message.success("Admin deleted successfully");
          refetch();
        } catch (error) {
          message.error("Failed to delete admin");
          console.error("Delete error:", error);
        }
      },
    });
  };

  const handleAddNewRole = () => {
    setEditingAdmin(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (values) => {
    try {
      if (editingAdmin) {
        // Update existing admin
        await updateBackUpAdmin({
          id: editingAdmin._id,
          ...values,
        }).unwrap();
        message.success("Admin updated successfully");
      } else {
        // Create new admin
        await createBackUpAdmin(values).unwrap();
        message.success("Admin created successfully");
      }
      setIsModalOpen(false);
      setEditingAdmin(null);
      refetch();
    } catch (error) {
      message.error(
        editingAdmin ? "Failed to update admin" : "Failed to create admin"
      );
      console.error("Submit error:", error);
    }
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setEditingAdmin(null);
  };

  // Transform API data to match table structure
  const transformedData = loginCredentials.map((admin, index) => ({
    key: admin._id,
    sl: `#${index + 1}`,
    userName: admin.name,
    email: admin.email,
    phone: admin.phone || "N/A",
    role: admin.role,
    createdAt: new Date(admin.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    status: admin.status !== false, // Assume active if status not explicitly false
    _id: admin._id,
    originalData: admin,
  }));

  const columns = [
    {
      title: "SL",
      dataIndex: "sl",
      key: "sl",
      width: 60,
    },
    {
      title: "User Name",
      dataIndex: "userName",
      key: "userName",
      width: 180,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 200,
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      width: 150,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 120,
    },
    {
      title: "Created at",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status, record) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <span
            style={{
              marginRight: 8,
              fontSize: "12px",
              color: status ? "#52c41a" : "#ff4d4f",
            }}
          >
            {status ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.originalData)}
            loading={isUpdating}
            style={{
              color: "#1890ff",
              border: "1px solid #d9d9d9",
              borderRadius: "6px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.originalData)}
            loading={isDeleting}
            style={{
              color: "#ff4d4f",
              border: "1px solid #d9d9d9",
              borderRadius: "6px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
          {/* <Switch
            checked={record.status}
            onChange={(checked) =>
              handleStatusChange(record.originalData, checked)
            }
            size="small"
            loading={isToggling}
          /> */}
        </Space>
      ),
    },
    ];
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-screen">
         <Spinner />
        </div>
      );
    }

  return (
    <div>
      <div className="flex justify-end items-center mb-4">
        <button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddNewRole}
          className="bg-primary text-white py-3 hover:py-3 px-4 rounded-md flex items-center"
          loading={isCreating}
        >
          Add New Admin
        </button>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={transformedData}
        loading={isLoading}
        pagination={false}
        bordered={false}
        size="middle"
        className="custom-table"
      />

      {/* Admin Modal */}
      <AddBackUpAdminModal
        open={isModalOpen}
        onCancel={handleModalCancel}
        onSubmit={handleModalSubmit}
        editingAdmin={editingAdmin}
        loading={editingAdmin ? isUpdating : isCreating}
      />
    </div>
  );
}

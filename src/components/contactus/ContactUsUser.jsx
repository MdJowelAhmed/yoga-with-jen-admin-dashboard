import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Typography,
  Button,
  Modal,
  Space,
  message,
  Form,
} from "antd";
import {
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  useGetAllContactsQuery,
  useGetContactDetailsQuery,
  useReplyToContactMutation,
  useDeleteContactReplyMutation,
  useDeleteContactMutation,
  useDeleteAllContactsMutation,
} from "../../redux/apiSlices/contactusApi";
import dayjs from "dayjs";
import Spinner from "../common/Spinner";

const { Title } = Typography;
const { TextArea } = Input;
const { confirm } = Modal;

const ContactmanagementTable = () => {
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState([]);
  const [detailsContactId, setDetailsContactId] = useState(null);
  const [replyContact, setReplyContact] = useState(null);
  const [replyForm] = Form.useForm();

  const { data: contactsData, isLoading, refetch } = useGetAllContactsQuery(filters);
  const { data: contactDetails, isLoading: isDetailsLoading } =
    useGetContactDetailsQuery(detailsContactId, { skip: !detailsContactId });
  const [replyToContact, { isLoading: isReplying }] = useReplyToContactMutation();

  const [deleteContact, { isLoading: isDeleting }] = useDeleteContactMutation();
  const [deleteAllContacts, { isLoading: isDeletingAll }] =
    useDeleteAllContactsMutation();

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

  const handleSearch = (value) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const openDetailsModal = (record) => {
    setDetailsContactId(record._id);
  };

  const closeDetailsModal = () => {
    setDetailsContactId(null);
  };

  const openReplyModal = (record) => {
    setReplyContact(record);
    replyForm.resetFields();
  };

  const closeReplyModal = () => {
    setReplyContact(null);
    replyForm.resetFields();
  };

  const handleSendReply = async () => {
    try {
      const values = await replyForm.validateFields();
      await replyToContact({
        id: replyContact._id,
        message: values.reply.trim(),
      }).unwrap();
      message.success("Reply sent successfully");
      closeReplyModal();
      refetch();
    } catch (error) {
      message.error("Failed to send reply");
      console.error("Reply error:", error);
    }
  };



  const handleDeleteContact = (record) => {
    confirm({
      title: "Delete contact?",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete the contact from ${record.name}?`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteContact(record._id).unwrap();
          message.success("Contact deleted successfully");
          if (detailsContactId === record._id) {
            closeDetailsModal();
          }
          if (replyContact?._id === record._id) {
            closeReplyModal();
          }
          refetch();
        } catch (error) {
          message.error("Failed to delete contact");
          console.error("Delete contact error:", error);
        }
      },
    });
  };

  const handleDeleteAllContacts = () => {
    confirm({
      title: "Delete all contacts?",
      icon: <ExclamationCircleOutlined />,
      content:
        "This will permanently delete all contact messages. This action cannot be undone.",
      okText: "Delete All",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteAllContacts().unwrap();
          message.success("All contacts deleted successfully");
          closeDetailsModal();
          closeReplyModal();
          setCurrentPage(1);
          refetch();
        } catch (error) {
          message.error("Failed to delete all contacts");
          console.error("Delete all error:", error);
        }
      },
    });
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <strong>{text}</strong>,
      align: "center",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      align: "center",
      render: (email) => <a href={`mailto:${email}`}>{email}</a>,
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      align: "center",
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      width: 300,
      align: "center",
      ellipsis: true,
    },
    {
      title: "Replied",
      dataIndex: "isReply",
      key: "isReply",
      width: 100,
      align: "center",
      render: (isReply) =>
        isReply ? (
          <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 20 }} />
        ) : (
          <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: 20 }} />
        ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      align: "center",
      render: (date) => <div>{dayjs(date).format("DD MMM YYYY")}</div>,
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      width: 260,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button size="middle" onClick={() => openDetailsModal(record)} >
            Details
          </Button>
          {record.isReply ? null : <Button
            size="middle"
            onClick={() => openReplyModal(record)}
            style={{  borderColor: "#CA3939" }}
          >
            Reply
          </Button>}
          <Button
            size="middle"
            danger
            // icon={<DeleteOutlined />}
            onClick={() => handleDeleteContact(record)}
            loading={isDeleting}
            title="Delete Contact"
          >Delete</Button>
        </Space>
      ),
    },
  ];

  const detailsRecord = contactDetails || null;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <Title level={2}>Contact management</Title>

        <div className="flex items-center gap-3 flex-wrap">
          {/* <Input.Search
            placeholder="Search by name, email"
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
            className="w-96 border"
            style={{ height: 45 }}
          /> */}
          <Input placeholder="Search by name, email" allowClear value={searchText} onChange={(e) => setSearchText(e.target.value)} onSearch={handleSearch} className="w-96 border" style={{ height: 45 }} />
          <Button
            danger
            type="primary"
            icon={<DeleteOutlined />}
            onClick={handleDeleteAllContacts}
            loading={isDeletingAll}
            style={{ height: 45 }}
          >
            Delete All
          </Button>
        </div>
      </div>

      <div className="border-2 rounded-lg mt-4">
        <Table
          columns={columns}
          dataSource={contactsData?.contacts || []}
          rowKey="_id"
          loading={isLoading}
          size="middle"
          className="custom-table"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: contactsData?.meta?.total || 0,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
          }}
        />
      </div>

      <Modal
        title="Contact Details"
        open={!!detailsContactId}
        onCancel={closeDetailsModal}
        footer={null}

        width={700}
      >
        {isDetailsLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : detailsRecord ? (
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-gray-600">Name</p>
              <p>{detailsRecord.name}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">Email</p>
              <p>{detailsRecord.email}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">Subject</p>
              <p>{detailsRecord.subject}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">Message</p>
              <p className="whitespace-pre-wrap">{detailsRecord.message}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">Status</p>
              <p className="capitalize">{detailsRecord.status}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">Reply</p>
              {detailsRecord.isReply && detailsRecord.reply ? (
                <p className="whitespace-pre-wrap bg-gray-50 p-3 rounded border">
                  {detailsRecord.reply}
                </p>
              ) : (
                <p className="text-gray-400">No reply yet</p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        title={`Reply to ${replyContact?.name || "Contact"}`}
        open={!!replyContact}
        onCancel={closeReplyModal}
        onOk={handleSendReply}
        okText="Send Reply"
        confirmLoading={isReplying}
        okButtonProps={{
          style: { backgroundColor: "#CA3939", borderColor: "#CA3939" },
        }}
        width={600}
      >
        <Form form={replyForm} layout="vertical">
          <Form.Item
            label="Reply Message"
            name="reply"
            rules={[
              { required: true, message: "Please enter a reply" },
              { whitespace: true, message: "Reply cannot be empty" },
            ]}
          >
            <TextArea rows={5} placeholder="Write your reply here..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContactmanagementTable;

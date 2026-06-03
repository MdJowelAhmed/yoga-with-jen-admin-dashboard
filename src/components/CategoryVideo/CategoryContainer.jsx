import React, { useState } from "react";
import { Button, Space, Modal, Dropdown, Menu, message } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import CategoryTable from "./CategoryTable";
import CategoryForm from "./CategoryForm";
import GradientButton from "../common/GradiantButton";
import {
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useToggleCategoryStatusMutation,
  useUpdateCategoryOrderMutation,
} from "../../redux/apiSlices/categoryApi";
import { Filtering } from "../common/Svg";
import Spinner from "../common/Spinner";
// import DraggableCategoryList from "./DraggableCategoryList";
import {
  SaveOutlined,
  TableOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import DragDropList from "../common/DragDropList";
import DraggableCategoryCard from "./DraggableCategoryCard";

const CategoryContainer = () => {
  const navigate = useNavigate();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("table"); // "table" or "grid"
  const [orderedCategories, setOrderedCategories] = useState([]);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);

  // Fetch data using RTK Query
  const { data: categoryData, isLoading: categoryLoading } =
    useGetCategoryQuery();

  // API mutations
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [toggleCategoryStatus] = useToggleCategoryStatusMutation();
  const [updateCategoryOrder] = useUpdateCategoryOrderMutation();

  // Extract the actual data from the API responses
  const categories = categoryData?.data || [];

  const formattedCategories = categories.map((category) => ({
    id: category._id,
    _id: category._id,
    name: category.name,
    description: category.description || "",
    thumbnail: category.thumbnail,
    // categoryType: category.categoryType,
    subCategory: category.subCategory || [],
    videoCount: category.videoCount || 0,
    createdAt: category.createdAt,
    status: category.status,
  }));

  // Initialize orderedCategories when categories are loaded
  React.useEffect(() => {
    if (formattedCategories.length > 0 && orderedCategories.length === 0) {
      setOrderedCategories(formattedCategories);
    }
  }, [formattedCategories]);

  const showModal = (record = null) => {
    setEditingCategory(record);
    setModalVisible(true);
  };

  const handleCategoryFormSubmit = async (values, thumbnailFile) => {
    try {
      const formData = new FormData();
      const categoryData = {};
      Object.keys(values).forEach((key) => {
        if (key !== "thumbnail") {
          categoryData[key] = values[key];
        }
      });
      formData.append("data", JSON.stringify(categoryData));

      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      }

      if (editingCategory) {
        const res = await updateCategory({
          id: editingCategory._id,
          updatedData: formData,
        }).unwrap();
        message.success("Category updated successfully!");
      } else {
        // Pass formData directly here:
        const res = await createCategory(formData).unwrap();
        message.success("Category created successfully!");
      }

      setModalVisible(false);
      setEditingCategory(null);
    } catch (error) {
      console.error("Error saving category:", error);
      message.error(error.data.message || "Failed to save category. Please try again.");
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingCategory(null);
  };

  const showCategoryDetails = (record) => {
    navigate(`/subcategory-management/${record._id}`);
  };

  const showAllVideos = (record) => {
    navigate(`/category-management/${record._id}`);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this category?",
      content: "This action cannot be undone",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await deleteCategory(id).unwrap();
          message.success("Category deleted successfully!");
        } catch (error) {
          console.error("Error deleting category:", error);
          message.error("Failed to delete category. Please try again.");
        }
      },
    });
  };

  const handleStatusChange = (checked, record) => {
    Modal.confirm({
      title: `Are you sure you want to ${
        checked ? "activate" : "deactivate"
      } this category?`,
      okText: "Yes",
      okType: "danger", // this makes the OK button red
      cancelText: "No",
      okButtonProps: {
        style: {
          backgroundColor: "#CA3939", 
          // borderColor: "#4CAF50",
          color: "#fff",
        },
      },
      cancelButtonProps: {
        style: {
          // backgroundColor: "#f44336", 
          borderColor: "#000",
          color: "#000",
        },
      },

      onOk: async () => {
        try {
          await toggleCategoryStatus({
            id: record._id,
            status: checked ? "active" : "inactive",
          }).unwrap();
          message.success(
            `Category ${checked ? "activated" : "deactivated"} successfully!`
          );
        } catch (error) {
          console.error("Error updating category status:", error);
          message.error("Failed to update category status. Please try again.");
        }
      },
    });
  };

  const handleReorder = (reorderedCategories) => {
    setOrderedCategories(reorderedCategories);
    setHasOrderChanges(true);
  };

  const handleUpdateOrder = async () => {
    try {
      // Create an array of category IDs in the new order
      const categoryOrder = orderedCategories.map((category, index) => ({
        _id: category._id,
        serial: category.serial,
      }));
      await updateCategoryOrder(categoryOrder).unwrap();
      message.success("Category order updated successfully!");
      setHasOrderChanges(false);
    } catch (error) {
      console.error("Error updating category order:", error);
      message.error( "Failed to update category order. Please try again.");
      
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "table" ? "grid" : "table");
  };

  const getFilteredCategories = () => {
    return formattedCategories.filter((cat) => {
      const typeMatch = filterType === "all" || cat.categoryType === filterType;
      const statusMatch =
        filterStatus === "all" ||
        cat.status.toLowerCase() === filterStatus.toLowerCase();
      return typeMatch && statusMatch;
    });
  };

  // const filterMenu = (
  //   <Menu>
  //     <Menu.Item key="all" onClick={() => setFilterType("all")}>
  //       All
  //     </Menu.Item>
  //     <Menu.Item key="class" onClick={() => setFilterType("class")}>
  //       Class
  //     </Menu.Item>
  //     <Menu.Item key="course" onClick={() => setFilterType("course")}>
  //       Course
  //     </Menu.Item>
  //   </Menu>
  // );

  const statusMenu = (
    <Menu>
      <Menu.Item key="all" onClick={() => setFilterStatus("all")}>
        All
      </Menu.Item>
      <Menu.Item key="active" onClick={() => setFilterStatus("active")}>
        Active
      </Menu.Item>
      <Menu.Item key="inactive" onClick={() => setFilterStatus("inactive")}>
        Inactive
      </Menu.Item>
    </Menu>
  );

  if (categoryLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  const filteredCategories = getFilteredCategories();

  return (
    <div className="p-4">
      <div>
        <div className="flex justify-end mb-4 items-center">
          <div>
            <Button
              type="default"
              icon={
                viewMode === "table" ? <AppstoreOutlined /> : <TableOutlined />
              }
              onClick={toggleViewMode}
              style={{
                borderRadius: "4px",
                marginRight: "10px",
              }}
              className="bg-primary text-white h-10 border-none"
            >
              {viewMode === "table" ? "Do Shuffle" : "Table View"}
            </Button>
          </div>
          <div className="flex items-center">
            {/* <Dropdown overlay={filterMenu} trigger={["click"]}>
              <Button
                className="mr-2 bg-red-600 text-white py-5"
                style={{ border: "none" }}
              >
                <Space>
                  <Filtering className="text-black no-hover-bg" />
                  {filterType === "all" ? "All Types" : filterType}
                  <DownOutlined />
                </Space>
              </Button>
            </Dropdown> */}

            {/* <Dropdown overlay={statusMenu} trigger={["click"]}>
              <Button
                className="mr-2 bg-red-600 text-white py-5"
                style={{ border: "none" }}
              >
                <Space>
                  <Filtering className="no-hover-bg" />
                  {filterStatus === "all" ? "All Status" : filterStatus}
                  <DownOutlined />
                </Space>
              </Button>
            </Dropdown> */}
          </div>
          <div>
            <GradientButton type="primary" onClick={() => showModal()}>
              Add New Category
            </GradientButton>
          </div>
        </div>

        {viewMode === "table" ? (
          <CategoryTable
            categories={filteredCategories}
            onEdit={showModal}
            onView={showCategoryDetails}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onViewVideos={showAllVideos}
          />
        ) : (
          <DragDropList
            items={orderedCategories} 
            onReorder={handleReorder} 
            onUpdateOrder={handleUpdateOrder} 
            hasChanges={hasOrderChanges} 
            renderItem={(
              category,
              index,
              draggedItem 
            ) => (
              <DraggableCategoryCard
                category={category}
                onEdit={showModal}
                onView={showCategoryDetails}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                onViewVideos={showAllVideos}
                isDragging={draggedItem?._id === category._id}
                serialNumber={index + 1}
              />
            )}
          />
        )}
      </div>

      {/* Add/Edit Category Modal */}
      <CategoryForm
        visible={modalVisible}
        onCancel={handleCancel}
        onSubmit={handleCategoryFormSubmit}
        initialValues={editingCategory}
      />
    </div>
  );
};

export default CategoryContainer;

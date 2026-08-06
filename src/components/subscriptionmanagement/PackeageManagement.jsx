import { useState } from "react";
import { Pencil, X, Plus, ChevronDown, Apple, Play, CirclePlay } from "lucide-react";
import { Dropdown, Menu, Button, Modal } from "antd";
import {
  useGetSubscriptionPackagesQuery,
  useCreateSubscriptionPackageMutation,
  useUpdateSubscriptionPackageMutation,
  useDeleteSubscriptionPackageMutation,
} from "../../redux/apiSlices/subscriptionManagementApi";
import Spinner from "../common/Spinner";
import { Filtering } from "../common/Svg";

// Duration options that match the API's expected enum values
const DURATION_OPTIONS = [
  { value: "1 month", label: "1 Month" },
  { value: "3 months", label: "3 Months" },
  { value: "6 months", label: "6 Months" },
  { value: "1 year", label: "1 Year" },
];

// Payment type options that match the API's expected enum values
const PAYMENT_TYPE_OPTIONS = [
  { value: "Yearly", label: "Yearly" },
  { value: "Monthly", label: "Monthly" },
];

const getPaymentTypeFromDuration = (duration) => {
  const normalized = (duration || "").toLowerCase();
  return normalized === "1 year" ? "Yearly" : "Monthly";
};

// Membership types that can see discounts
const MEMBERSHIP_OPTIONS = [
  { value: "all", label: "All Users" },
  { value: "premium", label: "Premium Members" },
  { value: "gold", label: "Gold Members" },
  { value: "platinum", label: "Platinum Members" },
  { value: "vip", label: "VIP Members" },
];

export default function SubscriptionPackagesManagement() {
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [selectedType, setSelectedType] = useState("all");
  const [currentPackage, setCurrentPackage] = useState({
    title: "",
    description: "",
    price: "",
    duration: "1 month",
    paymentType: "Monthly",
    subscriptionType: "web",
    // New discount fields
    discountPercentage: "",
    discountVisibleTo: "all",
    // Platform fields
    isGoogle: true,
    googleProductId: "",
    appleProductId: "",
  });
  const [editingPackageId, setEditingPackageId] = useState(null);

  // RTK Query hooks
  const { data: subscriptionPackages = [], isLoading: isLoadingPackages } =
    useGetSubscriptionPackagesQuery();
  const [createPackage, { isLoading: isCreating }] =
    useCreateSubscriptionPackageMutation();
  const [updatePackage, { isLoading: isUpdating }] =
    useUpdateSubscriptionPackageMutation();
  const [deletePackage] = useDeleteSubscriptionPackageMutation();


  // Form validation function
  const isFormValid = () => {
    const requiredFields = [
      "title",
      "description",
      "price",
      "duration",
      "paymentType",
      "subscriptionType",
    ];

    // Check if all required fields have values
    for (let field of requiredFields) {
      if (
        !currentPackage[field] ||
        currentPackage[field].toString().trim() === ""
      ) {
        return false;
      }
    }

    // Check if price is a valid positive number
    const price = Number(currentPackage.price);
    if (isNaN(price) || price <= 0) {
      return false;
    }

    // Check if discount percentage is valid (if provided)
    if (currentPackage.discountPercentage !== "") {
      const discount = Number(currentPackage.discountPercentage);

      if (
        !Number.isInteger(discount) ||
        isNaN(discount) ||
        discount < 0 ||
        discount > 99
      ) {
        return false;
      }
    }

    // App subscription specific validation
    if (currentPackage.subscriptionType === "app") {
      if (currentPackage.isGoogle && !currentPackage.googleProductId) {
        return false;
      }
      if (!currentPackage.isGoogle && !currentPackage.appleProductId) {
        return false;
      }
    }

    return true;
  };

  // Package functions
  const openPackageModal = (packageObj = null) => {
    if (packageObj) {
      // Edit existing - normalize data to match API expectations
      const normalizedDuration =
        packageObj.duration?.toLowerCase() || "1 month";

      // Form shows original price; API `price` is already discounted
      const editPrice =
        packageObj.originalPrice !== undefined &&
        packageObj.originalPrice !== null
          ? packageObj.originalPrice
          : packageObj.price;

      const formatPrice = (value) => {
        if (value === undefined || value === null || value === "") return "";
        const num = Number(value);
        return Number.isInteger(num) ? String(num) : num.toFixed(2);
      };

      // Infer platform from product IDs if needed
      const hasApple =
        packageObj.appleProductId &&
        packageObj.appleProductId.trim() !== "";
      const hasGoogle =
        packageObj.googleProductId &&
        packageObj.googleProductId.trim() !== "";
      const isGooglePlatform = hasApple && !hasGoogle
        ? false
        : packageObj.hasOwnProperty("isGoogle")
          ? packageObj.isGoogle
          : true;

      setCurrentPackage({
        title: packageObj.title,
        description: packageObj.description,
        price: formatPrice(editPrice),
        duration: normalizedDuration,
        paymentType: getPaymentTypeFromDuration(normalizedDuration),
        subscriptionType: packageObj.subscriptionType,
        // API returns `discount`, form uses `discountPercentage`
        discountPercentage:
          packageObj.discount > 0 ? String(packageObj.discount) : "",
        discountVisibleTo: packageObj.discountVisibleTo || "all",
        // Platform specific
        isGoogle: isGooglePlatform,
        googleProductId: packageObj.googleProductId || "",
        appleProductId: packageObj.appleProductId || "",
      });
      setEditingPackageId(packageObj._id || packageObj.id);
    } else {
      // Add new
      setCurrentPackage({
        title: "",
        description: "",
        price: "",
        duration: "1 month",
        paymentType: "Monthly",
        subscriptionType: "web",
        discountPercentage: "",
        discountVisibleTo: "all",
        isGoogle: true,
        googleProductId: "",
        appleProductId: "",
      });
      setEditingPackageId(null);
    }
    setShowPackageModal(true);
  };

  const savePackage = async () => {
    // Double check form validity before saving
    if (!isFormValid()) {
      Modal.error({
        title: "Form Validation Error",
        content: "Please fill in all required fields with valid values.",
      });
      return;
    }

    try {
      // Whole numbers as-is; decimals keep exactly 2 places (20.5 → "20.50")
      const numPrice = parseFloat(currentPackage.price);
      const priceValue = Number.isInteger(numPrice)
        ? numPrice
        : numPrice.toFixed(2);

      // Format package data - send original price and discount percentage to backend
      const formattedPackage = {
        ...currentPackage,
        price: priceValue,
        discount: currentPackage.discountPercentage
          ? parseInt(currentPackage.discountPercentage, 10)
          : 0,
      };

      if (editingPackageId !== null) {
        // Update existing package
        await updatePackage({
          id: editingPackageId,
          ...formattedPackage,
        });
      } else {
        // Add new package
        await createPackage(formattedPackage);
      }
      setShowPackageModal(false);
      setCurrentPackage({
        title: "",
        description: "",
        price: "",
        duration: "1 month",
        paymentType: "Monthly",
        subscriptionType: "web",
        discountPercentage: "",
        discountVisibleTo: "all",
        isGoogle: true,
        googleProductId: "",
        appleProductId: "",
      });
      setEditingPackageId(null);
    } catch (error) {
      console.error("Error saving package:", error);
      Modal.error({
        title: "Error saving package",
        content: error.message || "Please check all fields and try again.",
      });
    }
  };

  const handlePackageChange = (e) => {
    const { name, value } = e.target;

    // Price: allow digits with up to 2 decimal places (including .50, .00)
    if (name === "price") {
      if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
        setCurrentPackage((prev) => ({
          ...prev,
          price: value,
        }));
      }
      return;
    }

    // Duration drives payment type: months → Monthly, year → Yearly
    if (name === "duration") {
      setCurrentPackage((prev) => ({
        ...prev,
        duration: value,
        paymentType: getPaymentTypeFromDuration(value),
      }));
      return;
    }

    setCurrentPackage((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const confirmDeletePackage = (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this subscription package?",
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deletePackage(id);
        } catch (error) {
          console.error("Error deleting package:", error);
          Modal.error({
            title: "Error deleting package",
            content:
              error.message || "An error occurred while deleting the package.",
          });
        }
      },
    });
  };

  // Filter packages based on selected type
  const filteredPackages =
    selectedType.toLowerCase() === "all"
      ? subscriptionPackages
      : subscriptionPackages.filter(
        (pkg) =>
          pkg.subscriptionType.toLowerCase() === selectedType.toLowerCase()
      );

  // Filter menu items
  const typeFilterMenu = (
    <Menu>
      <Menu.Item key="all" onClick={() => setSelectedType("all")}>
        All Types
      </Menu.Item>
      <Menu.Item key="web" onClick={() => setSelectedType("web")}>
        Web
      </Menu.Item>
      <Menu.Item key="app" onClick={() => setSelectedType("app")}>
        App
      </Menu.Item>

    </Menu>
  );

  if (isLoadingPackages) {
    return <Spinner />;
  }

  return (
    <div className="">
      {/* Type Filter */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Dropdown overlay={typeFilterMenu} trigger={["click"]}>
            <Button
              className="py-5 mr-2 text-white bg-red-600 hover:text-black"
              style={{ border: "none" }}
            >
              <div className="flex items-center gap-4">
                <Filtering />
                <span>
                  {selectedType === "All" ? "All Types" : selectedType}
                </span>
                <ChevronDown className="ml-2" size={14} />
              </div>
            </Button>
          </Dropdown>
        </div>

        {/* Add Package Button */}
        <button
          className="flex items-center gap-2 px-4 py-2 text-white bg-red-500 rounded-md"
          onClick={() => openPackageModal()}
        >
          <Plus size={18} />
          Add Subscription Package
        </button>
      </div>

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 gap-8 mb-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredPackages.length === 0 ? (
          <div className="p-4 col-span-full text-center text-gray-500">
            No subscription packages found. Add a new package to get started.
          </div>
        ) : (
          filteredPackages.map((pkg) => {
            const hasDiscount = pkg.discount > 0;

            return (
              <div
                key={pkg.id || pkg._id}
                className="relative flex-1 p-10 border rounded-lg min-w-64"
              >
                {/* Type Label - Rotated and positioned at top left */}
                <div
                  className="absolute top-0 px-3 py-1 text-xs text-black bg-gray-100 rounded-md -left-5 flex items-center gap-1"
                  style={{
                    transform: "rotate(-50deg)",
                    transformOrigin: "top right",
                  }}
                >
                  <span>{pkg.subscriptionType}</span>
                  {pkg.subscriptionType === "app" && (
                    <>
                      {pkg.appleProductId && pkg.appleProductId.trim() !== "" ? (
                        <Apple size={14} />
                      ) : pkg.googleProductId && pkg.googleProductId.trim() !== "" ? (
                        <CirclePlay size={14} />
                      ) : null}
                    </>
                  )}
                </div>

                {/* Discount Badge */}
                {hasDiscount && (
                  <div className="absolute top-2 right-2 px-2 py-1 text-xs text-white bg-primary rounded-full">
                    {pkg.discount}% OFF
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    className="p-1 mr-2"
                    onClick={() => openPackageModal(pkg)}
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    className="p-1 text-primary"
                    onClick={() => confirmDeletePackage(pkg.id || pkg._id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>

                <div className="mb-3 text-sm text-center">{pkg.title}</div>

                {/* Updated Price Display */}
                <div className="mb-3 text-center">
                  {hasDiscount ? (
                    <div>
                      {/* Original Price with strikethrough */}
                      <div className="text-2xl font-bold text-gray-400 line-through mb-1">
                        $
                        {Number.isInteger(Number(pkg.originalPrice))
                          ? Number(pkg.originalPrice)
                          : Number(pkg.originalPrice).toFixed(2)}
                      </div>
                      {/* Discounted Price */}
                      <div className="text-5xl font-bold text-red-600">
                        $
                        {Number.isInteger(Number(pkg.price))
                          ? Number(pkg.price)
                          : Number(pkg.price).toFixed(2)}
                      </div>
                      {/* Savings amount */}
                      {/* <div className="text-sm text-green-600 mt-1">
                        Save ${pkg.originalPrice - pkg.price}
                      </div> */}
                    </div>
                  ) : (
                    <div className="text-6xl font-bold">
                      $
                      {Number.isInteger(Number(pkg.price))
                        ? Number(pkg.price)
                        : Number(pkg.price).toFixed(2)}
                    </div>
                  )}
                </div>

                <div className="mb-2 text-xs text-center">
                  {DURATION_OPTIONS.find(
                    (opt) => opt.value === pkg.duration?.toLowerCase()
                  )?.label || pkg.duration}{" "}
                  - {pkg.paymentType}
                </div>

                {/* Membership Visibility - Updated to use discount field */}
                {/* {hasDiscount && pkg.discountVisibleTo !== "all" && (
                  <div className="mb-2 text-xs text-center text-orange-600">
                    Discount for{" "}
                    {
                      MEMBERSHIP_OPTIONS.find(
                        (opt) => opt.value === pkg.discountVisibleTo
                      )?.label
                    }{" "}
                    only
                  </div>
                )} */}

                <p className="mb-8 text-xs text-center">{pkg.description}</p>
                <button className="w-full py-2 text-white bg-primary  rounded-md">
                  Subscribe
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Subscription Package Modal */}
      {showPackageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowPackageModal(false)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden bg-white rounded-lg shadow-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-2xl font-bold text-primary">
                {editingPackageId !== null
                  ? "Edit Package"
                  : "Add New Package"}
              </h2>
              <button onClick={() => setShowPackageModal(false)}>
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4">
              <form className="space-y-4">
                <div className="grid grid-cols-2  gap-6">
                  {/* Title */}
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={currentPackage.title}
                      onChange={handlePackageChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="e.g. Basic Plan, Premium Plan"
                      required
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Duration <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="duration"
                      value={currentPackage.duration}
                      onChange={handlePackageChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                      required
                    >
                      {DURATION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Original Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      name="price"
                      value={currentPackage.price}
                      onChange={handlePackageChange}
                      onBlur={() => {
                        // Whole numbers stay as-is (20); decimals keep 2 places (20.5 → 20.50)
                        if (
                          currentPackage.price !== "" &&
                          !isNaN(Number(currentPackage.price))
                        ) {
                          const num = parseFloat(currentPackage.price);
                          setCurrentPackage((prev) => ({
                            ...prev,
                            price: Number.isInteger(num)
                              ? String(num)
                              : num.toFixed(2),
                          }));
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="e.g. 15.50"
                      required
                    />
                  </div>
                  {/* Payment Type */}
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Payment Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="paymentType"
                      value={currentPackage.paymentType}
                      disabled
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                      required
                    >
                      {PAYMENT_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Auto-selected from duration (months → Monthly, year → Yearly)
                    </p>
                  </div>
                </div>


                <div className="grid grid-cols-2  gap-6">
                  {/* Discount Section */}
                  <div className="p-4 border rounded-md bg-gray-50">
                   

                    {/* Discount Percentage */}
                    <div className="">
                      <label className="block mb-1 text-sm font-medium text-gray-700">
                        Discount Percentage (%)
                      </label>
                      <input
                        type="number"
                        name="discountPercentage"
                        value={currentPackage.discountPercentage}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (!/^\d*$/.test(value)) {
                            Modal.error({
                              title: "Invalid Input",
                              content:
                                "Fractional numbers (decimals) are not allowed.",
                              okButtonProps: {
                                style: {
                                  backgroundColor: "#ef4444",
                                  // borderColor: "#ef4444",
                                  color: "#fff",
                                },
                              },
                            });
                            return;
                          }

                          if (value.length > 2) {
                            Modal.error({
                              title: "Invalid Input",
                              content:
                                "Discount can only be up to 2 digits (1-99).",
                              okButtonProps: {
                                style: {
                                  backgroundColor: "#ef4444",
                                  // borderColor: "#ef4444",
                                  color: "#fff",
                                },
                              },
                            });
                            return;
                          }

                          setCurrentPackage((prev) => ({
                            ...prev,
                            discountPercentage: value,
                          }));
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="e.g. 20 (for 20% off)"
                        min="0"
                        max="99"
                      />

                      <p className="mt-1 text-xs text-gray-500">
                       Enter a discount percentage from 1-99. The final price will be calculated automatically.
                      </p>
                    </div>
                  </div>
                  {/* Description */}
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Description <span className="text-primary">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={currentPackage.description}
                      onChange={handlePackageChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                      rows="4"
                      placeholder="Enter package description"
                      required
                    ></textarea>
                  </div>
                </div>

                {/* Subscription Type */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Subscription Type <span className="text-primary">*</span>
                  </label>
                  <select
                    name="subscriptionType"
                    value={currentPackage.subscriptionType}
                    onChange={handlePackageChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  >
                    <option value="app">App</option>
                    <option value="web">Web</option>
                  </select>
                </div>

                {/* App Logic: Platform & Product ID */}
                {currentPackage.subscriptionType === "app" && (
                  <div className="p-4 border rounded-md bg-blue-50">
                    <h3 className="mb-3 text-lg font-semibold text-gray-700">
                      App Configuration
                    </h3>

                    {/* Platform Selection */}
                    <div className="mb-4">
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Platform <span className="text-primary">*</span>
                      </label>
                      <div className="flex items-center gap-6">
                        <label
                          className={`flex items-center gap-2 ${
                            editingPackageId !== null
                              ? "cursor-not-allowed opacity-70"
                              : "cursor-pointer"
                          }`}
                        >
                          <input
                            type="radio"
                            name="isGoogle"
                            checked={currentPackage.isGoogle === true}
                            disabled={editingPackageId !== null}
                            onChange={() =>
                              setCurrentPackage((prev) => ({
                                ...prev,
                                isGoogle: true,
                              }))
                            }
                            className="w-4 h-4 text-primary border-gray-300 focus:ring-primary disabled:cursor-not-allowed"
                          />
                          <span className="text-sm text-gray-700">Google Play</span>
                        </label>

                        <label
                          className={`flex items-center gap-2 ${
                            editingPackageId !== null
                              ? "cursor-not-allowed opacity-70"
                              : "cursor-pointer"
                          }`}
                        >
                          <input
                            type="radio"
                            name="isGoogle"
                            checked={currentPackage.isGoogle === false}
                            disabled={editingPackageId !== null}
                            onChange={() =>
                              setCurrentPackage((prev) => ({
                                ...prev,
                                isGoogle: false,
                              }))
                            }
                            className="w-4 h-4 text-primary border-gray-300 focus:ring-primary disabled:cursor-not-allowed"
                          />
                          <span className="text-sm text-gray-700">Apple App Store</span>
                        </label>
                      </div>
                      {editingPackageId !== null && (
                        <p className="mt-1 text-xs text-gray-500">
                          Platform cannot be changed while editing
                        </p>
                      )}
                    </div>

                    {/* Product ID Input */}
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">
                        {currentPackage.isGoogle
                          ? "Google Product ID"
                          : "Apple Product ID"}{" "}
                        <span className="text-primary">*</span>
                      </label>
                      <input
                        type="text"
                        value={
                          currentPackage.isGoogle
                            ? currentPackage.googleProductId
                            : currentPackage.appleProductId
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setCurrentPackage((prev) => ({
                            ...prev,
                            // Update the field corresponding to the current platform selection
                            [prev.isGoogle ? "googleProductId" : "appleProductId"]:
                              val,
                          }));
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder={
                          currentPackage.isGoogle
                            ? "e.g. basic_03"
                            : "e.g. com.app.basic"
                        }
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        This ID must match the product ID configured in{" "}
                        {currentPackage.isGoogle
                          ? "Google Play Console"
                          : "App Store Connect"}
                        .
                      </p>
                    </div>
                  </div>
                )}


              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-4">
              <button
                className={`w-full py-3 font-medium text-white rounded-md transition-colors ${!isFormValid() || isCreating || isUpdating
                  ? "bg-gray-400 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/80"
                  }`}
                onClick={savePackage}
                disabled={!isFormValid() || isCreating || isUpdating}
              >
                {isCreating || isUpdating ? "Saving..." : "Save"}
              </button>

              {/* Validation message */}
              {!isFormValid() && (
                <p className="mt-2 text-sm text-primary text-center">
                  Please fill in all required fields with valid values
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// export default SubscriptionPackagesManagement;

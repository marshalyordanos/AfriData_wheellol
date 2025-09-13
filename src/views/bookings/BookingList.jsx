import React, { useEffect, useRef, useState } from "react";
import { Input, Button, Dropdown, Tag } from "antd";
import { ReloadOutlined, MoreOutlined, PlusOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";

import CommonTable from "../../components/commons/CommonTable";
import CommonModal from "../../components/commons/CommonModel";
import CommonDeleteModal from "../../components/commons/CommonDeleteModal";
import BookingEditForm from "../../components/Forms/BookingEditForm";
import BookingCreateForm from "../../components/Forms/BookingCreateForm";
import BookingViewForm from "../../components/Forms/BookingViewForm";

import {
  fetchBookingsThunk,
  createBookingThunk,
  updateBookingThunk,
  cancelBookingThunk,
  completeBookingThunk,
  deleteBookingThunk,
  updateBookingState,
  bookingQuery,
  bookingSearchText,
} from "./BookingRedux";

const BookingList = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [modeID, setModeID] = useState("");
  const delayTimerRef = useRef(null);

  const bookingQ = useSelector(bookingQuery);
  const searchText = useSelector(bookingSearchText);
  const { page, limit } = bookingQ;
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState([]);
  const [total, setTotal] = useState(0);

  const getPaginationInfo = () => [
    Number(searchParams.get("page") || 1),
    Number(searchParams.get("limit") || limit),
  ];

  const loadBookings = async () => {
    setLoading(true);
    try {
      const { payload } = await dispatch(fetchBookingsThunk({ ...bookingQ }));
      setBookingData(payload.data || []);
      setTotal(payload.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const [pg, lm] = getPaginationInfo();
    dispatch(updateBookingState({ page: pg, limit: lm }));
    loadBookings();
  }, []);

  const handleSearch = (e) => {
    const { value } = e.target;
    clearTimeout(delayTimerRef.current);
    delayTimerRef.current = setTimeout(() => {
      dispatch(updateBookingState({ page: 1, searchText: value || "" }));
      loadBookings();
    }, 500);
  };

  const handlePagination = (pg, pageSize) => {
    setSearchParams({ page: pg, limit: pageSize });
    dispatch(updateBookingState({ page: pg, limit: pageSize }));
    loadBookings();
  };

  const tableChange = (pagination, filters, sorter) => {
    let field = sorter?.field;
    if (Array.isArray(field)) field = field.join(".");
    const order = sorter?.order || "";
    dispatch(updateBookingState({ sort: field || "", order }));
    loadBookings();
  };

  const handleReload = () => {
    setSearchParams({ page: 1, limit: 5 });
    dispatch(
      updateBookingState({
        page: 1,
        limit: 5,
        sort: "",
        order: "",
        searchText: "",
      })
    );
    loadBookings();
  };

  const handleAction = async (action, id) => {
    switch (action) {
      case "cancel":
        await dispatch(cancelBookingThunk(id));
        break;
      case "complete":
        await dispatch(completeBookingThunk(id));
        break;
      case "delete":
        await dispatch(deleteBookingThunk(id));
        break;
      default:
        break;
    }
    loadBookings();
  };

  const columns = [
    {
      title: "Brand",
      dataIndex: ["car_id", "brand", "name"],
      sorter: true,
      render: (text) => text || "Unknown",
    },
    {
      title: "Model",
      dataIndex: ["car_id", "model", "name"],
      sorter: true,
      render: (text) => text || "Unknown",
    },
    { title: "Year", dataIndex: ["car_id", "year"], sorter: true },
    {
      title: "Price / Day",
      dataIndex: ["car_id", "rental_price_per_day"],
      sorter: true,
      render: (val) => (val ? `$${val}` : "N/A"),
    },
    {
      title: "Renter",
      dataIndex: ["renter_id", "first_name"],
      render: (_, record) =>
        record?.renter_id
          ? `${record.renter_id.first_name || ""} ${
              record.renter_id.last_name || ""
            }`
          : "N/A",
    },
    { title: "Renter Email", dataIndex: ["renter_id", "email"] },
    {
      title: "Status",
      dataIndex: "status",
      sorter: true,
      render: (status) => {
        const colors = {
          Pending: "orange",
          Confirmed: "blue",
          Cancelled: "red",
          Completed: "green",
        };
        return <Tag color={colors[status] || "default"}>{status}</Tag>;
      },
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_, record) => {
        const actions = [{ key: "view", label: <Button>View</Button> }];
        if (!["Cancelled", "Completed"].includes(record.status)) {
          actions.push({ key: "edit", label: <Button>Edit</Button> });
          actions.push({
            key: "cancel",
            label: <Button danger>Cancel</Button>,
          });
          actions.push({
            key: "complete",
            label: <Button type="primary">Complete</Button>,
          });
        }
        actions.push({ key: "delete", label: <Button danger>Delete</Button> });

        return (
          <Dropdown
            menu={{
              items: actions,
              onClick: async (e) => {
                const { key } = e;
                if (key === "view") {
                  setModeID(record._id);
                  setIsViewModalOpen(true);
                } else if (key === "edit") {
                  setModeID(record._id);
                  setIsModalOpen(true);
                } else if (key === "delete") {
                  setModeID(record._id);
                  setIsDeleteModalOpen(true);
                } else {
                  const confirm =
                    key === "cancel" ? window.confirm("Are you sure?") : true;
                  if (confirm) await handleAction(key, record._id);
                }
              },
            }}
            trigger={["click"]}
            placement="bottomLeft"
          >
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div>
      {/* Edit Modal */}
      {isModalOpen && (
        <CommonModal
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          width={600}
          title="Edit Booking"
        >
          <BookingEditForm
            booking={bookingData.find((b) => b._id === modeID)}
            onSave={async (updatedValues) => {
              await dispatch(
                updateBookingThunk({ id: modeID, data: updatedValues })
              );
              setIsModalOpen(false);
              loadBookings();
            }}
            onCancel={() => setIsModalOpen(false)}
          />
        </CommonModal>
      )}

      {/* View Modal */}
      {isViewModalOpen && (
        <CommonModal
          isModalOpen={isViewModalOpen}
          setIsModalOpen={setIsViewModalOpen}
          width={700}
          title="Booking Details"
        >
          <BookingViewForm
            booking={bookingData.find((b) => b._id === modeID)}
          />
        </CommonModal>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CommonModal
          isModalOpen={isCreateModalOpen}
          setIsModalOpen={setIsCreateModalOpen}
          width={600}
          title="Create Booking"
        >
          <BookingCreateForm
            onSave={async (newBooking) => {
              await dispatch(createBookingThunk(newBooking));
              setIsCreateModalOpen(false);
              loadBookings();
            }}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </CommonModal>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <CommonDeleteModal
          isModalOpen={isDeleteModalOpen}
          setIsModalOpen={setIsDeleteModalOpen}
          handleDelete={async () => {
            await handleAction("delete", modeID);
            setIsDeleteModalOpen(false);
            setModeID("");
          }}
          loading={loading}
        >
          <h1>Are you sure?</h1>
        </CommonDeleteModal>
      )}

      {/* Top Actions */}
      <div className="flex justify-between items-center p-4">
        <Input
          placeholder="Search"
          value={searchText}
          onChange={handleSearch}
          allowClear
        />
        <div className="flex gap-2">
          <Button icon={<ReloadOutlined />} onClick={handleReload} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Booking
          </Button>
        </div>
      </div>

      {/* Table */}
      <CommonTable
        data={bookingData}
        columns={columns}
        handlePagination={handlePagination}
        total={total}
        loading={loading}
        tableChange={tableChange}
      />
    </div>
  );
};

export default BookingList;

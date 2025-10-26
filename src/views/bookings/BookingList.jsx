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
  const navigate = useNavigate();

  const bookingQ = useSelector(bookingQuery);
  const searchText = useSelector(bookingSearchText);
  const { page, limit } = bookingQ;
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState([]);
  const [total, setTotal] = useState(0);
  const [localSearch, setLocalSearch] = useState(searchText || "");

  const getPaginationInfo = () => [
    Number(searchParams.get("page") || 1),
    Number(searchParams.get("limit") || limit),
  ];

  const loadBookings = async (overrides = {}) => {
    setLoading(true);
    try {
      const params = { ...bookingQ, ...overrides };
      const { payload } = await dispatch(fetchBookingsThunk(params));
      const rawList = payload?.data?.bookings || payload?.data || payload || [];
      const raw = Array.isArray(rawList) ? rawList : rawList.bookings || [];
      const mapped = (Array.isArray(raw) ? raw : [raw]).map((b) => ({
        id: b.id || b._id,
        ...b,
        car: b.car || {},
        guest: b.guest || b.renter || {},
        rental_price_per_day:
          b.car?.rentalPricePerDay ||
          b.car?.rental_price_per_day ||
          b.rentalPricePerDay ||
          0,
        status: (b.status || "").toString(),
      }));

      setBookingData(mapped);
      setTotal(payload?.total || payload?.data?.total || mapped.length || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const [pg, lm] = getPaginationInfo();
    dispatch(updateBookingState({ page: pg, limit: lm }));
    loadBookings({ page: pg, limit: lm });
  }, []);

  useEffect(() => {
    setLocalSearch(searchText || "");
  }, [searchText]);

  async function searchData(val = "", overrides = {}) {
    try {
      setLoading(true);
      const params = { ...bookingQ, ...overrides, searchText: val };
      const { payload } = await dispatch(fetchBookingsThunk(params));
      const rawList = payload?.data?.bookings || payload?.data || payload || [];
      const raw = Array.isArray(rawList) ? rawList : rawList.bookings || [];
      const mapped = (Array.isArray(raw) ? raw : [raw]).map((b) => ({
        _id: b._id || b.id,
        id: b._id || b.id,
        ...b,
        car: b.car || {},
        guest: b.guest || b.renter || {},
        rental_price_per_day:
          b.car?.rentalPricePerDay ||
          b.car?.rental_price_per_day ||
          b.rentalPricePerDay ||
          0,
        status: (b.status || "").toString(),
      }));

      setBookingData(mapped);
      setTotal(payload?.total || payload?.data?.total || mapped.length || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e) => {
    const { value } = e.target;
    clearTimeout(delayTimerRef.current);
    delayTimerRef.current = setTimeout(() => {
      const [pg, lm] = getPaginationInfo();
      dispatch(updateBookingState({ page: 1, searchText: value || "" }));
      loadBookings({ page: 1, limit: lm, searchText: value || "" });
    }, 500);
  };

  const handlePagination = (pg, pageSize) => {
    setSearchParams({ page: pg, limit: pageSize });
    dispatch(updateBookingState({ page: pg, limit: pageSize }));
    loadBookings({ page: pg, limit: pageSize });
  };

  const tableChange = (pagination, filters, sorter) => {
    let field = sorter?.field;
    if (Array.isArray(field)) field = field.join(".");
    const order = sorter?.order || "";
    dispatch(updateBookingState({ sort: field || "", order }));
    loadBookings();
  };

  const onRowClick = (record) => {
    if (record && (record.id || record._id)) {
      const bookingId = record.id || record._id;
      navigate(`/dash/bookings/${bookingId}`);
      return;
    }
    setModeID(record?._id || record?.id);
    setIsViewModalOpen(true);
  };

  const handleReload = () => {
    setSearchParams({ page: 1, limit: 10 });
    dispatch(
      updateBookingState({
        page: 1,
        limit: 10,
        sort: "",
        order: "",
        searchText: "",
      })
    );
    loadBookings({ page: 1, limit: 10, sort: "", order: "", searchText: "" });
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
      title: "Action",
      dataIndex: "action",
      render: (_, record) => {
        const actions = [{ key: "view", label: <Button>View</Button> }];
        if (
          !["CANCELLED", "COMPLETED"].includes(
            (record.status || "").toString().toUpperCase()
          )
        ) {
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
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown
              menu={{
                items: actions,
                onClick: async (e) => {
                  const { key } = e;
                  if (key === "view") {
                    setModeID(record._id);
                    setIsViewModalOpen(true);
                  } else if (key === "edit") {
                    setModeID(record.__id);
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
          </div>
        );
      },
    },
    // 1. Car (make + model or fallback to carType)
    {
      title: "Car",
      dataIndex: "car",
      render: (_, record) =>
        `${record.car.make?.name || ""} ${
          record.car.model?.name || ""
        }`.trim() || "-",
    },
    // 2. Host Name
    {
      title: "Host",
      dataIndex: "host",
      render: (_, record) =>
        record.host
          ? `${record.host.firstName || ""} ${
              record.host.lastName || ""
            }`.trim()
          : "-",
    },
    // 3. Guest Name
    {
      title: "Guest",
      dataIndex: "guest",
      render: (_, record) =>
        record.guest
          ? `${record.guest.firstName || ""} ${
              record.guest.lastName || ""
            }`.trim()
          : "-",
    },
    // 4. Start Date
    {
      title: "Start Date",
      dataIndex: "startDate",
      render: (d) => (d ? new Date(d).toLocaleString() : "-"),
    },
    // 5. End Date
    {
      title: "End Date",
      dataIndex: "endDate",
      render: (d) => (d ? new Date(d).toLocaleString() : "-"),
    },
    // 6. Pickup Location (clean formatted)
    {
      title: "Pickup",
      dataIndex: "pickupLocation",
      render: (loc) => {
        if (!loc) return "-";
        // expected format: "lat+*+lon+*+Place Name"
        return String(loc).split("+*+").slice(-1)[0] || loc;
      },
    },
    // 7. Dropoff Location
    {
      title: "Dropoff",
      dataIndex: "dropoffLocation",
      render: (loc) => {
        if (!loc) return "-";
        return String(loc).split("+*+").slice(-1)[0] || loc;
      },
    },
    // 8. With Driver
    {
      title: "With Driver",
      dataIndex: "withDriver",
      render: (v) => (v ? "Yes" : "No"),
    },
    // 9. Total Price
    {
      title: "Total Price",
      dataIndex: "totalPrice",
      render: (p) => (p ? `${p}` : "-"),
    },
    // 10. Payment Status
    {
      title: "Payment Status",
      dataIndex: ["payment", "status"],
      render: (s) => s || "-",
    },
    // 11. Booking Status
    {
      title: "Booking Status",
      dataIndex: "status",
      render: (s) => s || "-",
    },
    // 12. Created At
    {
      title: "Created At",
      dataIndex: "createdAt",
      render: (d) => (d ? new Date(d).toLocaleString() : "-"),
    },
    // 13. Chat link
    {
      title: "Chat",
      dataIndex: "chat",
      render: (_, record) =>
        // show chat for confirmed or completed bookings
        record &&
        ["confirmed", "completed"].includes(
          String(record.status || "").toLowerCase()
        ) ? (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              const bookingId = record.id || record._id;
              if (bookingId)
                navigate(`/dash/messages/${bookingId}`, { state: record });
            }}
          >
            Chat
          </Button>
        ) : null,
    },
    // 13. Dispute
    {
      title: "Dispute",
      dataIndex: "dispute",
      render: (d) => (d ? "Yes" : "No"),
    },
  ];

  return (
    <div>
      {/* Edit Modal */}
      {isModalOpen && (
        <CommonModal
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          width={1000}
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
          width={1000}
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
          width={1000}
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

      <span className="flex md:flex-row flex-col justify-between items-start md:items-end borde border-rose-700">
        <div className="flex flex-col p-6 md:w-[45vw] w-full">
          <h1 className="text-2xl font-bold pb-4">Bookings</h1>
          <div className="flex">
            <Input
              onChange={(e) => {
                const v = e.target.value;
                setLocalSearch(v);
                clearTimeout(delayTimerRef.current);
                delayTimerRef.current = setTimeout(() => {
                  const [pg, lm] = getPaginationInfo();
                  dispatch(
                    updateBookingState({
                      page: 1,
                      limit: lm,
                      searchText: v || "",
                    })
                  );
                  searchData(v || "");
                }, 500);
              }}
              placeholder="Search"
              value={localSearch}
              allowClear
              style={{ borderRadius: "0px 0px 0px 0px" }}
              className=" drop-shadow-sm rounded-r  py-2"
            />
          </div>
        </div>
        <span className="flex ml-6 mb-6 md:mr-6">
          <button
            onClick={handleReload}
            className="
             border border-[#1D9BF0] py-2 px-3
             text-[#1D9BF0] rounded mr-4 flex items-center justify-center"
          >
            <ReloadOutlined className=" boder boder-red-900" />
          </button>

          <button
            className="px-4  py-2 border border-[#3BB66E] 
            text-white bg-[#3BB66E] rounded"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <span className="flex flex-row">
              <PlusOutlined />
              <p className="pl-2">Create Booking</p>
            </span>
          </button>
        </span>
      </span>

      {/* Table */}
      <CommonTable
        data={bookingData}
        columns={columns}
        handlePagination={handlePagination}
        total={total}
        loading={loading}
        loadding={loading}
        tableChange={tableChange}
        onRow={(record) => ({
          onClick: () => onRowClick(record),
          style: { cursor: "pointer" },
        })}
        rowKey={(r) => r?.id}
        currentPage={Number(page) || 1}
        pageSize={Number(limit) || 10}
      />
    </div>
  );
};

export default BookingList;

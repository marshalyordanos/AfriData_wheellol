import React, { useEffect, useRef, useState } from "react";
import { Input, Button, Tag, Dropdown, Select, DatePicker } from "antd";
import { ReloadOutlined, PlusOutlined, MoreOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";

import CommonTable from "../../components/commons/CommonTable";
import CommonModal from "../../components/commons/CommonModel";
import CommonDeleteModal from "../../components/commons/CommonDeleteModal";
import BookingCreateForm from "../../components/Forms/BookingCreateForm";

import {
  fetchBookingsThunk,
  // createBookingThunk,
  updateBookingThunk,
  cancelBookingThunk,
  completeBookingThunk,
  deleteBookingThunk,
  updateBookingState,
  bookingQuery,
  bookingSearchText,
} from "./BookingRedux";
import BookingService from "./BookingService";
import BookingUpdateForm from "../../components/Forms/BookingUpdateForm";
import SummaryCard from "../../components/commons/SummaryCard";
import {
  FaCheckCircle,
  FaClipboardList,
  FaGavel,
  FaHourglassHalf,
  FaTimesCircle,
  FaUserSlash,
} from "react-icons/fa";
import {
  selectbookingSummary,
  selectCurrentUser,
} from "../../redux/auth/authSlice";

const BookingList = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const delayTimerRef = useRef(null);
  const navigate = useNavigate();

  const bookingQ = useSelector(bookingQuery);
  const searchText = useSelector(bookingSearchText);
  const { page, limit } = bookingQ;
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    status: null,
    withDriver: null,
    dateRange: null,
  });
  const [localSearch, setLocalSearch] = useState(searchText || "");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const bookingSummary = useSelector(selectbookingSummary);
  const currentUser = useSelector(selectCurrentUser);

  const normalizeRole = (u) => {
    if (!u) return null;
    if (typeof u === "string") return u.toLowerCase();
    if (u.role) {
      if (typeof u.role === "string") return u.role.toLowerCase();
      if (u.role.name) return String(u.role.name).toLowerCase();
    }
    if (u.user) return normalizeRole(u.user);
    return null;
  };

  const currentRole = normalizeRole(currentUser) || "superadmin";
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
        id: b.id,
        ...b,
        car: b.car || {},
        guest: b.guest || {},
        rental_price_per_day:
          b.car?.rentalPricePerDay || b.car?.rental_price_per_day || 0,
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

  const handleFilterChange = (newFilters) => {
    const merged = { ...filters, ...newFilters };
    setFilters(merged);

    // build `filter` object
    const filter = {};
    if (merged.status) filter.status = merged.status;
    // with driver filtering
    if (merged.withDriver !== null && merged.withDriver !== undefined)
      filter.withDriver = merged.withDriver;
    if (merged.dateRange && merged.dateRange.length === 2) {
      filter.startDate = merged.dateRange[0].toISOString();
      filter.endDate = merged.dateRange[1].toISOString();
    }

    const [pg, lm] = getPaginationInfo();
    dispatch(updateBookingState({ page: 1 }));
    setSearchParams({ page: 1, limit: lm });
    loadBookings({ page: 1, limit: lm, filter });
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

  const paymentTag = (status) => {
    if (!status) return <Tag color="default">N/A</Tag>;
    const s = status.toString().toLowerCase();
    if (s.includes("paid") || s.includes("completed") || s === "success")
      return <Tag color="green">{status}</Tag>;
    if (s.includes("pending") || s.includes("await"))
      return <Tag color="orange">{status}</Tag>;
    if (s.includes("failed") || s.includes("declined"))
      return <Tag color="red">{status}</Tag>;
    return <Tag color="blue">{status}</Tag>;
  };

  const bookingTag = (status) => {
    if (!status) return <Tag color="default">N/A</Tag>;
    const s = status.toString().toLowerCase();
    if (s.includes("completed")) return <Tag color="green">{status}</Tag>;
    if (s.includes("cancel")) return <Tag color="red">{status}</Tag>;
    if (s.includes("pending") || s.includes("new") || s.includes("await"))
      return <Tag color="orange">{status}</Tag>;
    if (s.includes("confirmed")) return <Tag color="blue">{status}</Tag>;
    return <Tag color="purple">{status}</Tag>;
  };

  const onRowClick = (record) => {
    if (record && (record.id || record._id)) {
      const bookingId = record.id || record._id;
      navigate(`/dash/bookings/${bookingId}`);
    }
  };

  const onActionClick = (value, record) => {
    const key = value?.key || (value && value.key);
    if (key === "edit") {
      setSelectedBooking(record);
      setIsUpdateModalOpen(true);
    }
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

  const columns = [
    {
      title: " ",
      dataIndex: "action",
      render: (_, record) => {
        return (
          <Dropdown
            menu={{
              items: [
                {
                  key: "edit",
                  label: <Button type="text">Update</Button>,
                },
              ],
              onClick: (info) => {
                try {
                  info?.domEvent?.stopPropagation();
                } catch (err) {
                  // ignore
                }
                onActionClick(info, record);
              },
            }}
            trigger={["click"]}
            placement="bottomLeft"
          >
            <Button
              type="text"
              icon={<MoreOutlined style={{ fontSize: 18 }} />}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
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
    {
      title: "Total Price",
      dataIndex: "totalPrice",
      render: (p) => (p ? `${p}` : "-"),
    },
    // 10. Payment Status
    {
      title: "Payment Status",
      dataIndex: ["payment", "status"],
      render: (s, r) => paymentTag(s || r?.payment?.status),
    },
    // 11. Booking Status
    {
      title: "Booking Status",
      dataIndex: "status",
      render: (s) => bookingTag(s),
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
                navigate(`/dash/messages/${bookingId}`, {
                  state: {
                    from: "bookingList",
                    chatPartner: record.guest,
                  },
                });
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
              try {
                // newBooking is expected to match the backend payload shape.
                await BookingService.createBooking(newBooking);
                setIsCreateModalOpen(false);
                loadBookings();
              } catch (err) {
                console.error("Failed to create booking:", err);
              }
            }}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </CommonModal>
      )}

      {isUpdateModalOpen && (
        <CommonModal
          isModalOpen={isUpdateModalOpen}
          setIsModalOpen={setIsUpdateModalOpen}
          width={1000}
          title="Update Booking"
        >
          <BookingUpdateForm
            booking={selectedBooking}
            onSave={async (updated) => {
              try {
                const id = selectedBooking.id;
                await BookingService.updateBooking(updated, id);
                setIsUpdateModalOpen(false);
                setSelectedBooking(null);
                loadBookings();
              } catch (err) {
                console.error("Update failed:", err);
              }
            }}
            onCancel={() => setIsUpdateModalOpen(false)}
          />
        </CommonModal>
      )}

      <div className="flex gap-2 mb-6 flex-wrap px-6 my-6">
        {/* Booking Cards */}
        {/* Total Bookings */}
        <SummaryCard
          title="Total Bookings"
          value={bookingSummary?.totalBookings ?? 0}
          Icon={FaClipboardList}
          iconBgColor="bg-indigo-100"
          iconColor="text-indigo-500"
          description="All bookings"
        />

        {/* Pending */}
        <SummaryCard
          title="Pending Bookings"
          value={bookingSummary?.pending ?? 0}
          Icon={FaHourglassHalf}
          iconBgColor="bg-yellow-100"
          iconColor="text-yellow-500"
          description="Bookings awaiting confirmation"
        />

        {/* Cancelled by Guest */}
        <SummaryCard
          title="Cancelled by Guest"
          value={bookingSummary?.cancelledByGuest ?? 0}
          Icon={FaUserSlash}
          iconBgColor="bg-red-100"
          iconColor="text-red-500"
          description="Guest cancelled"
        />

        {/* Cancelled by Host */}
        <SummaryCard
          title="Cancelled by Host"
          value={bookingSummary?.cancelledByHost ?? 0}
          Icon={FaTimesCircle}
          iconBgColor="bg-red-100"
          iconColor="text-red-500"
          description="Host cancelled"
        />

        {/* Cancelled by Admin */}
        <SummaryCard
          title="Cancelled by Admin"
          value={bookingSummary?.cancelledByAdmin ?? 0}
          Icon={FaGavel}
          iconBgColor="bg-red-100"
          iconColor="text-red-500"
          description="Admin cancelled"
        />

        {/* Completed */}
        <SummaryCard
          title="Completed Bookings"
          value={bookingSummary?.completed ?? 0}
          Icon={FaCheckCircle}
          iconBgColor="bg-green-100"
          iconColor="text-green-500"
          description="Successfully completed"
        />
      </div>
      <span className="flex md:flex-row flex-col justify-between items-start md:items-end borde border-rose-700">
        <div className="flex flex-col p-6 md:w-[45vw] w-full">
          <h1 className="text-2xl font-bold pb-4">Bookings</h1>
          <div className="flex gap-3 flex-wrap items-center">
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

            <Select
              placeholder="Status"
              allowClear
              style={{ width: 160 }}
              onChange={(val) => handleFilterChange({ status: val })}
            >
              <Select.Option value="PENDING">PENDING</Select.Option>
              <Select.Option value="CONFIRMED">CONFIRMED</Select.Option>
              <Select.Option value="COMPLETED">COMPLETED</Select.Option>
              <Select.Option value="CANCELLED">CANCELLED</Select.Option>
            </Select>

            <Select
              placeholder="With Driver"
              allowClear
              style={{ width: 140 }}
              onChange={(val) => handleFilterChange({ withDriver: val })}
            >
              <Select.Option value={true}>Yes</Select.Option>
              <Select.Option value={false}>No</Select.Option>
            </Select>

            <DatePicker.RangePicker
              onChange={(dates) => handleFilterChange({ dateRange: dates })}
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

          {currentRole !== "host" && (
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
          )}
        </span>
      </span>

      {/* Table */}
      <div style={{ fontSize: 3 }}>
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
    </div>
  );
};

export default BookingList;

import React, { useEffect, useRef, useState } from "react";
import {
  Input,
  Button,
  Dropdown,
  Select,
  DatePicker,
  Table,
  Pagination,
  Tooltip,
  Skeleton,
} from "antd";
import {
  ReloadOutlined,
  PlusOutlined,
  MoreOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/api";
import CommonModal from "../../components/commons/CommonModel";
import CommonTable from "../../components/commons/CommonTable";
import BookingCreateForm from "../../components/Forms/BookingCreateForm";

import {
  fetchBookingsThunk,
  updateBookingState,
  bookingQuery,
  bookingSearchText,
} from "./BookingRedux";
import BookingService from "./BookingService";
import BookingUpdateForm from "../../components/Forms/BookingUpdateForm";
import {
  FaCar,
  FaCheckCircle,
  FaClipboardList,
  FaGavel,
  FaHourglassHalf,
  FaTimesCircle,
  FaUserSlash,
  FaUserTie,
  FaMapMarkerAlt,
  FaExclamationTriangle,
} from "react-icons/fa";
import { selectCurrentUser } from "../../redux/auth/authSlice";
import {
  formatCurrency,
  formatReadableDate,
} from "../../utils/date_currency_formatter";
import {
  Page,
  PageHeader,
  Btn,
  ReloadBtn,
  StatsStrip,
  TableCard,
  StatusPill,
  PersonCell,
  RowMenu,
  EmptyState,
} from "../../components/modern/ModernUI";

/* ---------- small helpers ---------- */
const parseDate = (d) => {
  if (!d) return null;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
};
const shortDate = (d) => {
  const dt = parseDate(d);
  if (!dt) return d ? formatReadableDate(d) : "—";
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
const shortTime = (d) => {
  const dt = parseDate(d);
  if (!dt) return "";
  return dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};
const placeName = (loc) => {
  if (!loc) return "";
  return String(loc).split("+*+").slice(-1)[0] || String(loc);
};
const tripDays = (s, e) => {
  const a = parseDate(s);
  const b = parseDate(e);
  if (!a || !b) return null;
  return Math.max(1, Math.ceil((b - a) / 86400000));
};

const STATUS_TABS = [
  { key: null, label: "All", summaryKey: "totalBookings" },
  { key: "PENDING", label: "Pending", summaryKey: "pending" },
  { key: "CONFIRMED", label: "Confirmed", summaryKey: "confirmed" },
  { key: "COMPLETED", label: "Completed", summaryKey: "completed" },
  { key: "CANCELLED_BY_GUEST", label: "Cancelled · Guest", summaryKey: "cancelledByGuest" },
  { key: "CANCELLED_BY_HOST", label: "Cancelled · Host", summaryKey: "cancelledByHost" },
  { key: "CANCELLED_BY_ADMIN", label: "Cancelled · Admin", summaryKey: "cancelledByAdmin" },
];

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
  const [bookingSummary, setBookingSummary] = useState({});
  const currentUser = useSelector(selectCurrentUser);
  const [selectedBooking, setSelectedBooking] = useState(null);

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

  const mapBookings = (payload) => {
    const rawList = payload?.data?.bookings || payload?.data || payload || [];
    const raw = Array.isArray(rawList) ? rawList : rawList.bookings || [];
    return (Array.isArray(raw) ? raw : [raw]).map((b) => ({
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
      startDateFormatted: b.startDate ? formatReadableDate(b.startDate) : "-",
      endDateFormatted: b.endDate ? formatReadableDate(b.endDate) : "-",
    }));
  };

  const buildFilterParams = (f = filters) => {
    const filter = {};
    if (f.status) filter.status = f.status;
    if (f.withDriver !== null && f.withDriver !== undefined)
      filter.withDriver = f.withDriver;
    let startDate = null;
    let endDate = null;
    if (f.dateRange && f.dateRange.length === 2) {
      startDate = f.dateRange[0].toISOString();
      endDate = f.dateRange[1].toISOString();
    }
    return { filter, startDate, endDate };
  };

  const loadBookings = async (overrides = {}) => {
    setLoading(true);
    try {
      const params = { ...bookingQ, ...overrides };
      const { payload } = await dispatch(fetchBookingsThunk(params));
      const mapped = mapBookings(payload);
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

  const onSearchChange = (e) => {
    const v = e.target.value;
    setLocalSearch(v);
    clearTimeout(delayTimerRef.current);
    delayTimerRef.current = setTimeout(() => {
      const [, lm] = getPaginationInfo();
      dispatch(updateBookingState({ page: 1, limit: lm, searchText: v || "" }));
      loadBookings({ page: 1, limit: lm, searchText: v || "", ...buildFilterParams() });
    }, 500);
  };

  const handleFilterChange = (newFilters) => {
    const merged = { ...filters, ...newFilters };
    setFilters(merged);
    const [, lm] = getPaginationInfo();
    dispatch(updateBookingState({ page: 1 }));
    setSearchParams({ page: 1, limit: lm });
    loadBookings({ page: 1, limit: lm, ...buildFilterParams(merged) });
  };

  const handlePagination = (pg, pageSize) => {
    setSearchParams({ page: pg, limit: pageSize });
    dispatch(updateBookingState({ page: pg, limit: pageSize }));
    loadBookings({ page: pg, limit: pageSize, ...buildFilterParams() });
  };

  const tableChange = (pagination, _filters, sorter) => {
    let field = sorter?.field;
    if (Array.isArray(field)) field = field.join(".");
    const order = sorter?.order || "";
    dispatch(updateBookingState({ sort: field || "", order }));
    loadBookings({ sort: field || "", order, ...buildFilterParams() });
  };

  const onRowClick = (record) => {
    if (record && (record.id || record._id)) {
      navigate(`/dash/bookings/${record.id || record._id}`);
    }
  };

  const openChat = (record) => {
    const bookingId = record.id || record._id;
    if (bookingId)
      navigate(`/dash/messages/${bookingId}`, {
        state: { from: "bookingList", chatPartner: record.guest },
      });
  };

  const canChat = (record) => {
    const status = String(record?.status || "").toLowerCase();
    if (currentRole === "host") return status === "confirmed";
    return !!record?.dispute;
  };

  const onActionClick = (value, record) => {
    const key = value?.key;
    if (key === "edit") {
      setSelectedBooking(record);
      setIsUpdateModalOpen(true);
    } else if (key === "view") {
      onRowClick(record);
    } else if (key === "chat") {
      openChat(record);
    }
  };

  const handleReload = () => {
    setLocalSearch("");
    setFilters({ status: null, withDriver: null, dateRange: null });
    setSearchParams({ page: 1, limit: 10 });
    dispatch(
      updateBookingState({ page: 1, limit: 10, sort: "", order: "", searchText: "" })
    );
    loadBookings({ page: 1, limit: 10, sort: "", order: "", searchText: "" });
    fetchSummary();
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get("users/summary?entity=booking");
      setBookingSummary(res.data.data?.booking || {});
    } catch (error) {
      console.error("fetchSummary: ", error);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const actionMenu = (record) => {
    const items = [
      { key: "view", icon: <EyeOutlined />, label: "View details" },
    ];
    if (currentRole !== "host")
      items.push({ key: "edit", icon: <EditOutlined />, label: "Update booking" });
    if (canChat(record))
      items.push({ key: "chat", icon: <MessageOutlined />, label: "Open chat" });
    return items;
  };

  const columns = [
    {
      title: "Booking",
      dataIndex: "car",
      fixed: "left",
      render: (_, r) => {
        const name =
          `${r.car?.make?.name || ""} ${r.car?.model?.name || ""}`.trim() || "Unknown car";
        const sub = [r.car?.year, r.car?.plateNumber || r.car?.licensePlate]
          .filter(Boolean)
          .join(" · ");
        return (
          <div className="mp-cell">
            <span className="mp-car-icon">
              <FaCar />
            </span>
            <div className="min-w-0">
              <div className="mp-cell-main">{name}</div>
              <div className="mp-cell-sub">
                {sub || `#${String(r.id || "").slice(0, 8)}`}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Guest",
      dataIndex: "guest",
      render: (_, r) => <PersonCell person={r.guest} />,
    },
    {
      title: "Host",
      dataIndex: "host",
      render: (_, r) => <PersonCell person={r.host} />,
    },
    {
      title: "Trip dates",
      dataIndex: "startDate",
      sorter: true,
      render: (_, r) => {
        const days = tripDays(r.startDate, r.endDate);
        return (
          <div>
            <div className="mp-cell-main" style={{ fontWeight: 500 }}>
              {shortDate(r.startDate)} <span className="text-slate-300 px-1">→</span>{" "}
              {shortDate(r.endDate)}
            </div>
            <div className="mp-cell-sub">
              {shortTime(r.startDate)}
              {days ? ` · ${days} day${days > 1 ? "s" : ""}` : ""}
            </div>
          </div>
        );
      },
    },
    {
      title: "Route",
      dataIndex: "pickupLocation",
      render: (_, r) => {
        const from = placeName(r.pickupLocation);
        const to = placeName(r.dropoffLocation);
        if (!from && !to) return <span className="text-slate-400">—</span>;
        return (
          <div style={{ maxWidth: 220 }}>
            <Tooltip title={from}>
              <div className="mp-chip truncate">
                <FaMapMarkerAlt style={{ color: "#059669", fontSize: 11 }} />
                <span className="truncate">{from || "—"}</span>
              </div>
            </Tooltip>
            <Tooltip title={to}>
              <div className="mp-chip truncate" style={{ marginTop: 4 }}>
                <FaMapMarkerAlt style={{ color: "#fc6b38", fontSize: 11 }} />
                <span className="truncate">{to || "—"}</span>
              </div>
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: "Amount",
      dataIndex: "totalPrice",
      sorter: true,
      align: "right",
      render: (p, r) => (
        <div style={{ textAlign: "right" }}>
          <div className="mp-price">{p ? formatCurrency(p) : "—"}</div>
          <div className="mp-cell-sub">
            {r.withDriver ? (
              <span className="inline-flex items-center gap-1">
                <FaUserTie /> With driver
              </span>
            ) : (
              "Self-drive"
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Payment",
      dataIndex: ["payment", "status"],
      render: (s, r) => <StatusPill status={s || r?.payment?.status} />,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s, r) => (
        <div className="flex items-center gap-2">
          <StatusPill status={s} />
          {r.dispute && (
            <Tooltip title="This booking has an open dispute">
              <FaExclamationTriangle style={{ color: "#dc2626" }} />
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      sorter: true,
      render: (d) => (
        <div>
          <div style={{ fontWeight: 500 }}>{shortDate(d)}</div>
          <div className="mp-cell-sub">{shortTime(d)}</div>
        </div>
      ),
    },
    {
      title: "",
      dataIndex: "action",
      fixed: "right",
      width: 96,
      align: "right",
      render: (_, record) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {canChat(record) && (
            <Tooltip title="Open chat">
              <button className="mp-iconbtn is-accent" aria-label="Open chat" onClick={() => openChat(record)}>
                <MessageOutlined />
              </button>
            </Tooltip>
          )}
          <RowMenu items={actionMenu(record)} record={record} onClick={onActionClick} />
        </div>
      ),
    },
  ];

  const s = bookingSummary || {};
  const totalCount = Number(s.totalBookings || 0);
  const pct = (n) => (totalCount ? Math.round((Number(n || 0) / totalCount) * 100) : 0);
  const cancelledTotal =
    Number(s.cancelledByGuest || 0) +
    Number(s.cancelledByHost || 0) +
    Number(s.cancelledByAdmin || 0);

  const stats = [
    { label: "Total bookings", value: totalCount, icon: FaClipboardList, accent: "navy", foot: "All time", status: null },
    { label: "Pending", value: s.pending ?? 0, icon: FaHourglassHalf, accent: "amber", percent: pct(s.pending), foot: `${pct(s.pending)}%`, status: "PENDING" },
    { label: "Completed", value: s.completed ?? 0, icon: FaCheckCircle, accent: "green", percent: pct(s.completed), foot: `${pct(s.completed)}%`, status: "COMPLETED" },
    { label: "Cancelled · Guest", value: s.cancelledByGuest ?? 0, icon: FaUserSlash, accent: "rose", percent: pct(s.cancelledByGuest), foot: `${pct(s.cancelledByGuest)}%`, status: "CANCELLED_BY_GUEST" },
    { label: "Cancelled · Host", value: s.cancelledByHost ?? 0, icon: FaTimesCircle, accent: "red", percent: pct(s.cancelledByHost), foot: `${pct(s.cancelledByHost)}%`, status: "CANCELLED_BY_HOST" },
    { label: "Cancelled · Admin", value: s.cancelledByAdmin ?? 0, icon: FaGavel, accent: "violet", percent: pct(s.cancelledByAdmin), foot: `${pct(s.cancelledByAdmin)}%`, status: "CANCELLED_BY_ADMIN" },
  ];

  const currentPage = Number(page) || 1;
  const pageSize = Number(limit) || 10;
  const from = total ? (currentPage - 1) * pageSize + 1 : 0;
  const to = Math.min(currentPage * pageSize, total);

  return (
    <Page>
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
                await BookingService.createBooking(newBooking);
                setIsCreateModalOpen(false);
                loadBookings();
                fetchSummary();
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
                await BookingService.updateBooking(updated, selectedBooking.id);
                setIsUpdateModalOpen(false);
                setSelectedBooking(null);
                loadBookings();
                fetchSummary();
              } catch (err) {
                console.error("Update failed:", err);
              }
            }}
            onCancel={() => setIsUpdateModalOpen(false)}
          />
        </CommonModal>
      )}

      <PageHeader
        eyebrow="Operations"
        title="Bookings"
        subtitle={`Track every reservation across your fleet${
          cancelledTotal ? ` · ${cancelledTotal} cancelled overall` : ""
        }`}
        actions={
          <>
            <ReloadBtn onClick={handleReload} loading={loading} />
            {currentRole !== "host" && (
              <Btn variant="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>
                New booking
              </Btn>
            )}
          </>
        }
      />

      <StatsStrip
        items={[
          { label: "Total bookings", value: totalCount.toLocaleString(), note: "All time", color: "#09234c", key: null },
          { label: "Pending", value: s.pending ?? 0, note: `${pct(s.pending)}% · need action`, color: "#f59e0b", key: "PENDING" },
          { label: "Completed", value: s.completed ?? 0, note: `${pct(s.completed)}% of all bookings`, color: "#1d4f91", key: "COMPLETED" },
          {
            label: "Cancelled",
            value: cancelledTotal,
            note: `Guest ${s.cancelledByGuest ?? 0} · Host ${s.cancelledByHost ?? 0} · Admin ${s.cancelledByAdmin ?? 0}`,
            color: "#94a3b8",
            key: "CANCELLED_BY_GUEST",
          },
        ].map((it) => ({
          ...it,
          active: it.key && filters.status === it.key,
          onClick: () => handleFilterChange({ status: it.key }),
        }))}
      />

      <TableCard
        tabs={STATUS_TABS.map((t) => ({ key: t.key, label: t.label, count: s[t.summaryKey] }))}
        activeTab={filters.status}
        onTabChange={(k) => handleFilterChange({ status: k })}
        search={{ value: localSearch, onChange: onSearchChange, placeholder: "Search by booking ID, car, guest or host" }}
        filters={
          <>
            <Select
              placeholder="Driver"
              allowClear
              className={`mp-filter ${filters.withDriver !== null && filters.withDriver !== undefined ? "is-on" : ""}`}
              value={filters.withDriver ?? undefined}
              style={{ width: 150 }}
              onChange={(val) => handleFilterChange({ withDriver: val ?? null })}
              options={[
                { value: true, label: "With driver" },
                { value: false, label: "Self-drive" },
              ]}
            />
            <DatePicker.RangePicker
              value={filters.dateRange}
              onChange={(dates) => handleFilterChange({ dateRange: dates })}
              style={{ width: 260 }}
            />
          </>
        }
        chips={[
          filters.status && {
            k: "Status",
            v: STATUS_TABS.find((t) => t.key === filters.status)?.label || filters.status,
            onRemove: () => handleFilterChange({ status: null }),
          },
          filters.withDriver !== null &&
            filters.withDriver !== undefined && {
              k: "Driver",
              v: filters.withDriver ? "With driver" : "Self-drive",
              onRemove: () => handleFilterChange({ withDriver: null }),
            },
          filters.dateRange &&
            filters.dateRange.length === 2 && {
              k: "Dates",
              v: `${filters.dateRange[0].format("MMM D")} – ${filters.dateRange[1].format("MMM D")}`,
              onRemove: () => handleFilterChange({ dateRange: null }),
            },
        ]}
        onClearChips={handleReload}
        resultLabel={`${total} result${total === 1 ? "" : "s"}`}
      >
        <div className="hidden md:block">
          <CommonTable
            rowKey={(r) => r?.id}
            columns={columns}
            data={bookingData}
            loadding={loading}
            tableChange={tableChange}
            total={total}
            currentPage={currentPage}
            pageSize={pageSize}
            handlePagination={handlePagination}
            unit="bookings"
            onRow={(record) => ({ onClick: () => onRowClick(record), style: { cursor: "pointer" } })}
          />
        </div>

        <div className="block md:hidden mp-mlist">
          {loading ? (
            Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="mp-mcard">
                  <Skeleton active paragraph={{ rows: 3 }} />
                </div>
              ))
          ) : bookingData.length ? (
            bookingData.map((b) => (
              <div key={b.id} className="mp-mcard" onClick={() => onRowClick(b)}>
                <div className="mp-mcard-head">
                  <div className="mp-cell">
                    <span className="mp-car-icon">
                      <FaCar />
                    </span>
                    <div>
                      <div className="mp-cell-main">
                        {`${b.car?.make?.name || ""} ${b.car?.model?.name || ""}`.trim() || "Unknown car"}
                      </div>
                      <div className="mp-cell-sub">
                        {shortDate(b.startDate)} → {shortDate(b.endDate)}
                      </div>
                    </div>
                  </div>
                  <RowMenu items={actionMenu(b)} record={b} onClick={onActionClick} />
                </div>
                <div className="mp-mcard-row">
                  <span>Guest</span>
                  <span>{`${b.guest?.firstName || ""} ${b.guest?.lastName || ""}`.trim() || "—"}</span>
                </div>
                <div className="mp-mcard-row">
                  <span>Amount</span>
                  <span className="mp-price">{b.totalPrice ? formatCurrency(b.totalPrice) : "—"}</span>
                </div>
                <div className="mp-mcard-row">
                  <span>Status</span>
                  <StatusPill status={b.status} />
                </div>
              </div>
            ))
          ) : (
            <EmptyState title="No bookings found" text="Try clearing the filters." />
          )}
          <div className="my-4 flex justify-center">
            <Pagination current={currentPage} pageSize={pageSize} total={total} onChange={handlePagination} size="small" />
          </div>
        </div>
      </TableCard>
    </Page>
  );
};

export default BookingList;

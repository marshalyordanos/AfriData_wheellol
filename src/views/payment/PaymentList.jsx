import React, { useEffect, useRef, useState } from "react";
import {
  Input,
  Button,
  Tag,
  Dropdown,
  Modal,
  message,
  Select,
  DatePicker,
} from "antd";
import { SendOutlined, RollbackOutlined } from "@ant-design/icons";
import {
  Page,
  PageHeader,
  ReloadBtn,
  StatsStrip,
  TableCard,
  PersonCell,
  StatusPill,
  TwoLine,
  RowMenu,
  actionColumn,
  EmptyState,
  KeyValueList,
  prettyStatus,
  fullName,
} from "../../components/modern/ModernUI";
import { shortDate, shortTime } from "../../utils/dateFormat";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/api";

import CommonTable from "../../components/commons/CommonTable";
import CommonCard from "../../components/commons/CommonCard";
import { Pagination } from "antd";
import PaymentService from "./PaymentService";
import {
  formatCurrency,
  formatReadableDate,
} from "../../utils/date_currency_formatter";
import { Form, InputNumber } from "antd";
import SummaryCard from "../../components/commons/SummaryCard";
import {
  FaCheckCircle,
  FaDollarSign,
  FaHourglassHalf,
  FaTimesCircle,
  FaUndoAlt,
  FaWallet,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { selectpaymentSummary } from "../../redux/auth/authSlice";
import { selectCurrentUser } from "../../redux/auth/authSlice";
import CommonCardSkeleton from "../../components/commons/CommonSkeleton";

const { confirm } = Modal;

const PaymentList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const delayTimerRef = useRef(null);
  const amountDebounceRef = useRef(null);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [localSearch, setLocalSearch] = useState("");
  const [filters, setFilters] = useState({
    status: null,
    method: null,
    amountRange: [null, null],
  });
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundRecord, setRefundRecord] = useState(null);
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundForm] = Form.useForm();

  const getPaginationInfo = () => [
    Number(searchParams.get("page") || 1),
    Number(searchParams.get("limit") || 10),
  ];

  const [paymentSummary, setPaymentSummary] = useState("");
  const currentPage = Number(searchParams.get("page") || 1);
  const currentLimit = Number(searchParams.get("limit") || 10);
  const [page, setPage] = useState(currentPage);
  const [pageSize, setPageSize] = useState(currentLimit);
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

  const fetchSummary = async () => {
    try {
      const res = await api.get("users/summary?entity=payment");
      setPaymentSummary(res.data.data?.payment);

      console.log("fetchSummary: ", res.data);
    } catch (error) {
      console.error("fetchSummary: ", error);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);
  const loadPayments = async ({
    page = 1,
    pageSize = 10,
    search = "",
    filter = null,
  } = {}) => {
    setLoading(true);
    try {
      const res = await PaymentService.searchPayments({
        page,
        limit: pageSize,
        searchText: search,
        filter,
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setPayments(list);
      setTotal(res.pagination?.total || res.total || list.length || 0);
    } catch (err) {
      console.error(err);
      message.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const [pg, lm] = getPaginationInfo();
    loadPayments({ page: pg, pageSize: lm });
  }, []);

  const handleSearch = (e) => {
    const v = e.target.value;
    setLocalSearch(v);
    clearTimeout(delayTimerRef.current);
    delayTimerRef.current = setTimeout(() => {
      const [pg, lm] = getPaginationInfo();
      setSearchParams({ page: 1, limit: lm });
      // include current filters
      const curFilter = buildFilterFromState(filters);
      loadPayments({ page: 1, pageSize: lm, search: v, filter: curFilter });
    }, 400);
  };

  const handlePagination = (pg, pageSize) => {
    setSearchParams({ page: pg, limit: pageSize });
    setPage(pg);
    setPageSize(pageSize);
    loadPayments({
      page: pg,
      pageSize,
      search: localSearch,
      filter: buildFilterFromState(filters),
    });
  };

  useEffect(() => {
    setPage(currentPage);
    setPageSize(currentLimit);
  }, [currentPage, currentLimit]);

  const confirmAndRun = (title, fn) => {
    confirm({
      title,
      onOk: fn,
      onCancel() {},
    });
  };

  const handleAction = async (action, record) => {
    const id = record.id || record._id;
    if (!id) return;
    if (action === "refund") {
      // open refund modal to collect amount and reason
      setRefundRecord(record);
      setRefundModalOpen(true);
      return;
    }

    if (action === "release") {
      confirmAndRun("Release payment to host?", async () => {
        try {
          await PaymentService.releasePayment({
            bookingId: record.bookingId,
            hostId: record.recipientId,
          });
          message.success("Release initiated");
          loadPayments({
            page: getPaginationInfo()[0],
            pageSize: getPaginationInfo()[1],
            search: localSearch,
          });
        } catch (err) {
          console.error(err);
          message.error("Release failed");
        }
      });
      return;
    }
  };

  // build filter object
  const buildFilterFromState = (s) => {
    const f = {};
    if (s?.status) f.status = s.status;
    if (s?.method) f.method = s.method;
    const [min, max] = s?.amountRange || [];
    if (min !== null && min !== undefined) f.amount_gte = min;
    if (max !== null && max !== undefined) f.amount_lte = max;
    return Object.keys(f).length ? f : null;
  };

  const handleFilterChange = (newFilters) => {
    const merged = { ...filters, ...newFilters };
    setFilters(merged);
    const f = buildFilterFromState(merged);
    const [pg, lm] = getPaginationInfo();
    setSearchParams({ page: 1, limit: lm });
    setPage(1);
    loadPayments({ page: 1, pageSize: lm, search: localSearch, filter: f });
  };

  const submitRefund = async (values) => {
    if (!refundRecord) return;
    const payload = {
      bookingId: refundRecord.bookingId,
      refundAmount: Number(values.refundAmount),
      reason: values.reason || "",
    };
    try {
      setRefundSubmitting(true);
      await PaymentService.refundPayment(payload);
      message.success("Refund sent");
      setRefundModalOpen(false);
      refundForm.resetFields();
      loadPayments({ page: page, pageSize: pageSize, search: localSearch });
    } catch (err) {
      console.error(err);
      message.error("Refund failed");
    } finally {
      setRefundSubmitting(false);
    }
  };

  const money = (v) => (v || v === 0 ? formatCurrency(v) : "—");
  const actionItems = [
    { key: "release", icon: <SendOutlined />, label: "Release to host" },
    { key: "refund", icon: <RollbackOutlined />, label: "Refund", danger: true },
  ];
  const openPayment = (record) => {
    const id = record.id || record._id;
    if (id) navigate(`/dash/payments/${id}`, { state: record });
  };

  const columns = [
    {
      title: "Payer",
      dataIndex: ["payer", "firstName"],
      key: "payer",
      render: (_, r) => <PersonCell person={r.payer} sub={r.type ? prettyStatus(r.type) : r.payer?.email} />,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (a) => <span className="mp-price">{money(a)}</span>,
    },
    {
      title: "Method",
      dataIndex: "method",
      key: "method",
      render: (m) => (m ? prettyStatus(m) : <span className="mp-muted">—</span>),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s) => <StatusPill status={s} />,
    },
    {
      title: "Split",
      key: "split",
      render: (_, r) => (
        <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "var(--c-text-2)" }}>
          <div>Host <b style={{ fontWeight: 600 }}>{money(r.hostEarnings)}</b></div>
          <div className="mp-cell-sub" style={{ marginTop: 0 }}>
            Fee {money(r.platformFee)} · Insurance {money(r.insuranceFee)}
          </div>
        </div>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (d) => <TwoLine main={shortDate(d)} sub={shortTime(d)} />,
    },
    {
      ...actionColumn((_, r) => (
        <RowMenu items={actionItems} record={r} onClick={(info, rec) => handleAction(info.key, rec)} />
      )),
      dataIndex: "action",
    },
  ];

  const tableColumns = currentRole === "host" ? columns.filter((c) => c.dataIndex !== "action") : columns;

  const S = paymentSummary || {};
  const statusTabs = [
    { key: null, label: "All", count: S.totalPayments },
    { key: "PENDING", label: "Pending", count: S.pending },
    { key: "COMPLETED", label: "Completed", count: S.completed },
    { key: "REFUNDED", label: "Refunded", count: S.refunded },
  ];
  const updateAmount = (idx, val) => {
    const n = val === "" || val === null || val === undefined ? null : Number(val);
    const newRange = [...(filters.amountRange || [null, null])];
    newRange[idx] = n;
    setFilters((prev) => ({ ...prev, amountRange: newRange }));
    clearTimeout(amountDebounceRef.current);
    amountDebounceRef.current = setTimeout(() => handleFilterChange({ amountRange: newRange }), 600);
  };
  const [minA, maxA] = filters.amountRange || [];

  return (
    <Page>
      <PageHeader
        eyebrow="Finance"
        title="Payments"
        subtitle="Money collected from guests, and how it is split."
        actions={
          <ReloadBtn
            loading={loading}
            onClick={() => {
              const [pg, lm] = getPaginationInfo();
              loadPayments({ page: pg, pageSize: lm, search: localSearch });
              setSearchParams({ page: pg, limit: lm });
              fetchSummary();
            }}
          />
        }
      />

      <StatsStrip
        items={[
          { label: "Total collected", value: `${(S.totals?.amount ?? 0).toLocaleString()}`, note: "ETB, all time", color: "#059669" },
          { label: "Payments", value: S.totalPayments ?? 0, note: "All transactions", color: "#09234c" },
          { label: "Pending", value: S.pending ?? 0, note: "Awaiting processing", color: "#f59e0b", onClick: () => handleFilterChange({ status: "PENDING" }), active: filters.status === "PENDING" },
          { label: "Completed", value: S.completed ?? 0, note: "Successfully paid", color: "#1d4f91", onClick: () => handleFilterChange({ status: "COMPLETED" }), active: filters.status === "COMPLETED" },
          { label: "Failed", value: S.failed ?? 0, note: "Payment failed", color: "#dc2626" },
          { label: "Refunded", value: S.refunded ?? 0, note: "Returned to guests", color: "#94a3b8", onClick: () => handleFilterChange({ status: "REFUNDED" }), active: filters.status === "REFUNDED" },
        ]}
      />

      <TableCard
        tabs={statusTabs}
        activeTab={filters.status ?? null}
        onTabChange={(k) => handleFilterChange({ status: k })}
        search={{ value: localSearch, onChange: handleSearch, placeholder: "Search payer, reference or booking" }}
        filters={
          <>
            <Select
              placeholder="Method"
              allowClear
              showSearch
              className={`mp-filter ${filters.method ? "is-on" : ""}`}
              style={{ width: 190 }}
              onChange={(v) => handleFilterChange({ method: v ?? null })}
              value={filters.method}
              options={PAYMENT_METHODS.map((m) => ({ value: m, label: prettyStatus(m) }))}
            />
            <InputNumber
              placeholder="Min ETB"
              value={minA ?? null}
              min={0}
              onChange={(v) => updateAmount(0, v)}
              style={{ width: 120 }}
            />
            <InputNumber
              placeholder="Max ETB"
              value={maxA ?? null}
              min={0}
              onChange={(v) => updateAmount(1, v)}
              style={{ width: 120 }}
            />
          </>
        }
        chips={[
          filters.status && { k: "Status", v: prettyStatus(filters.status), onRemove: () => handleFilterChange({ status: null }) },
          filters.method && { k: "Method", v: prettyStatus(filters.method), onRemove: () => handleFilterChange({ method: null }) },
          (minA != null || maxA != null) && {
            k: "Amount",
            v: `${minA ?? 0} – ${maxA ?? "∞"} ETB`,
            onRemove: () => handleFilterChange({ amountRange: [null, null] }),
          },
        ]}
        onClearChips={() => handleFilterChange({ status: null, method: null, amountRange: [null, null] })}
        resultLabel={`${total || 0} payments`}
      >
        <div className="hidden md:block">
          <CommonTable
            data={payments}
            columns={tableColumns}
            total={total}
            loading={loading}
            currentPage={page}
            pageSize={pageSize}
            rowKey={(r) => r?.id}
            unit="payments"
            handlePagination={(p, ps) => handlePagination(p, ps)}
            onRow={(record) => ({ onClick: () => openPayment(record), style: { cursor: "pointer" } })}
          />
        </div>

        <div className="block md:hidden mp-mlist">
          {loading && Array(4).fill(1).map((_, i) => <CommonCardSkeleton key={i} />)}
          {!loading && payments && payments.length > 0
            ? payments.map((p) => (
                <CommonCard
                  key={p?.id || p?._id}
                  item={p}
                  title={["payer.firstName", "payer.lastName"]}
                  fieldMap={{ amount: "Amount__ETB", method: "Method", status: "Status", hostEarnings: "Host earnings__ETB" }}
                  {...(currentRole === "host" ? {} : { actionItems })}
                  onActionClick={(info, item) => handleAction(info.key, item)}
                  onCardClick={openPayment}
                />
              ))
            : !loading && <EmptyState title="No payments found" />}
          <div className="my-4 flex justify-center">
            <Pagination current={page} pageSize={pageSize} total={total} onChange={handlePagination} size="small" />
          </div>
        </div>
      </TableCard>

      <Modal
        title="Refund payment"
        open={refundModalOpen}
        className="mp-modal"
        okText="Send refund"
        okButtonProps={{ danger: true }}
        onCancel={() => {
          setRefundModalOpen(false);
          refundForm.resetFields();
        }}
        onOk={() => refundForm.submit()}
        confirmLoading={refundSubmitting}
      >
        {refundRecord && (
          <div className="mp-subcard" style={{ margin: "8px 0 16px" }}>
            <KeyValueList
              rows={[
                { label: "Payer", value: fullName(refundRecord.payer) || "—" },
                { label: "Original amount", value: money(refundRecord.amount) },
              ]}
            />
          </div>
        )}
        <Form form={refundForm} layout="vertical" onFinish={submitRefund}>
          <Form.Item label="Refund amount (ETB)" name="refundAmount" rules={[{ required: true, message: "Enter refund amount" }]}>
            <InputNumber min={0} max={refundRecord?.amount || undefined} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Reason" name="reason">
            <Input.TextArea rows={3} placeholder="Shown to the guest" />
          </Form.Item>
        </Form>
      </Modal>
    </Page>
  );
};

const PAYMENT_METHODS = [
  "ABYSSINIA", "AWASH", "COMMERCIAL_BANK_OF_ETHIOPIA", "DASHEN", "NIB", "ZEMEN", "ABAY", "WEGAGEN",
  "UNITED", "ADDIS_INTERNATIONAL", "BERHAN", "COOPERATIVE_BANK_OF_OROMIA", "ENAT", "HIWOT", "LION",
  "BUNA", "DEBUB_GLOBAL", "OROMIA_INTERNATIONAL", "AMHARA", "HIJRA", "SIINQEE", "SHABELLE", "GADA",
  "GEBEYA", "TSEDEY", "RAYAN", "TSEDAY", "LILA_ABBISINIA", "OTHER",
];

export default PaymentList;

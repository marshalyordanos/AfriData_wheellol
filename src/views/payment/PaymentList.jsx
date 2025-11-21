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
import { ReloadOutlined, MoreOutlined } from "@ant-design/icons";
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
      okButtonProps: {
        style: {
          backgroundColor: "var(--color-primary)",
          borderColor: "var(--color-primary)",
          color: "white",
        },
      },
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

  const columns = [
    {
      title: " ",
      dataIndex: "action",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              { key: "refund", label: <Button type="text">Refund</Button> },
              { key: "release", label: <Button type="text">Release</Button> },
            ],
            onClick: (info) => {
              try {
                info.domEvent.stopPropagation();
              } catch (e) {}
              handleAction(info.key, record);
            },
          }}
          trigger={["click"]}
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
    {
      title: "Payer",
      dataIndex: ["payer", "firstName"],
      key: "payer",
      render: (_, r) =>
        r.payer ? `${r.payer.firstName || ""} ${r.payer.lastName || ""}` : "-",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (a, r) =>
        a || a === 0 ? `${formatCurrency(a)} ` : "-",
    },
    {
      title: "Method",
      dataIndex: "method",
      key: "method",
      render: (m) => m || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s) => {
        if (!s) return "-";
        const st = String(s).toLowerCase();
        let color = "default";
        if (st.includes("completed") || st === "completed") color = "green";
        else if (st.includes("refunded") || st === "refunded") color = "blue";
        else if (st.includes("pending") || st === "pending") color = "orange";
        return <Tag color={color}>{s}</Tag>;
      },
    },
    {
      title: "Host Earnings",
      dataIndex: "hostEarnings",
      key: "hostEarnings",
      render: (v, r) =>
        v || v === 0 ? `${formatCurrency(v)} ` : "-",
    },
    {
      title: "Platform Fee",
      dataIndex: "platformFee",
      key: "platformFee",
      render: (v, r) =>
        v || v === 0 ? `${formatCurrency(v)} ` : "-",
    },
    {
      title: "Insurance Fee",
      dataIndex: "insuranceFee",
      key: "insuranceFee",
      render: (v, r) =>
        v || v === 0 ? `${formatCurrency(v)} ` : "-",
    },

    { title: "Type", dataIndex: "type", key: "type" },
    // {
    //   title: "Transactions",
    //   dataIndex: "transactions",
    //   key: "transactions",
    //   render: (t) => (Array.isArray(t) ? t.length : 0),
    // },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (d) => (d ? formatReadableDate(d) : "-"),
    },
  ];

  const tableColumns =
    currentRole === "host"
      ? columns.filter((c) => c.dataIndex !== "action")
      : columns;

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap px-6 my-3">
        {/* Booking Cards */}

        <SummaryCard
          title="Total Payments"
          value={paymentSummary?.totalPayments ?? 0}
          Icon={FaWallet}
          iconBgColor="bg-indigo-100"
          iconColor="text-indigo-500"
          description="All payments"
        />

        {/* Pending Payments */}
        <SummaryCard
          title="Pending Payments"
          value={paymentSummary?.pending ?? 0}
          Icon={FaHourglassHalf}
          iconBgColor="bg-yellow-100"
          iconColor="text-yellow-500"
          description="Awaiting processing"
        />

        {/* Completed Payments */}
        <SummaryCard
          title="Completed Payments"
          value={paymentSummary?.completed ?? 0}
          Icon={FaCheckCircle}
          iconBgColor="bg-green-100"
          iconColor="text-green-500"
          description="Successfully completed"
        />

        {/* Failed Payments */}
        <SummaryCard
          title="Failed Payments"
          value={paymentSummary?.failed ?? 0}
          Icon={FaTimesCircle}
          iconBgColor="bg-red-100"
          iconColor="text-red-500"
          description="Payments failed"
        />

        {/* Refunded Payments */}
        <SummaryCard
          title="Refunded Payments"
          value={paymentSummary?.refunded ?? 0}
          Icon={FaUndoAlt}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-500"
          description="Refunded transactions"
        />

        {/* Total Amount */}
        <SummaryCard
          title="Total Amount"
          value={`${(
            paymentSummary?.totals?.amount ?? 0
          ).toLocaleString()} ETB`}
          Icon={FaDollarSign}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          description="Total collected"
        />
      </div>
      <div className="flex md:flex-row flex-col justify-between items-start md:items-end px-6">
        <div className="flex flex-col md:w-[45vw] w-full">
          <h1 className="text-2xl font-bold pb-4">Payments</h1>

          <div className="flex gap-3 flex-wrap items-center">
            <Input
              placeholder="Search"
              value={localSearch}
              onChange={handleSearch}
              allowClear
              style={{ borderRadius: "0px 0px 0px 0px" }}
              className=" drop-shadow-sm rounded-r  py-2"
            />

            <Select
              placeholder="Status"
              allowClear
              style={{ width: 160 }}
              onChange={(v) => handleFilterChange({ status: v })}
              value={filters.status}
            >
              <Select.Option value="COMPLETED">COMPLETED</Select.Option>
              <Select.Option value="PENDING">PENDING</Select.Option>
              <Select.Option value="REFUNDED">REFUNDED</Select.Option>
            </Select>

            <Select
              placeholder="Method"
              allowClear
              style={{ width: 160 }}
              onChange={(v) => handleFilterChange({ method: v })}
              value={filters.method}
            >
              <Select.Option value="ABYSSINIA">ABYSSINIA</Select.Option>
              <Select.Option value="AWASH">AWASH</Select.Option>
              <Select.Option value="COMMERCIAL_BANK_OF_ETHIOPIA">
                COMMERCIAL_BANK_OF_ETHIOPIA
              </Select.Option>
              <Select.Option value="DASHEN">DASHEN</Select.Option>
              <Select.Option value="NIB">NIB</Select.Option>
              <Select.Option value="ZEMEN">ZEMEN</Select.Option>
              <Select.Option value="ABAY">ABAY</Select.Option>
              <Select.Option value="WEGAGEN">WEGAGEN</Select.Option>
              <Select.Option value="UNITED">UNITED</Select.Option>
              <Select.Option value="ADDIS_INTERNATIONAL">
                ADDIS_INTERNATIONAL
              </Select.Option>
              <Select.Option value="BERHAN">BERHAN</Select.Option>
              <Select.Option value="COOPERATIVE_BANK_OF_OROMIA">
                COOPERATIVE_BANK_OF_OROMIA
              </Select.Option>
              <Select.Option value="ENAT">ENAT</Select.Option>
              <Select.Option value="HIWOT">HIWOT</Select.Option>
              <Select.Option value="LION">LION</Select.Option>
              <Select.Option value="BUNA">BUNA</Select.Option>
              <Select.Option value="DEBUB_GLOBAL">DEBUB_GLOBAL</Select.Option>
              <Select.Option value="OROMIA_INTERNATIONAL">
                OROMIA_INTERNATIONAL
              </Select.Option>
              <Select.Option value="AMHARA">AMHARA</Select.Option>
              <Select.Option value="HIJRA">HIJRA</Select.Option>
              <Select.Option value="SIINQEE">SIINQEE</Select.Option>
              <Select.Option value="SHABELLE">SHABELLE</Select.Option>
              <Select.Option value="GADA">GADA</Select.Option>
              <Select.Option value="GEBEYA">GEBEYA</Select.Option>
              <Select.Option value="TSEDEY">TSEDEY</Select.Option>
              <Select.Option value="RAYAN">RAYAN</Select.Option>
              <Select.Option value="TSEDAY">TSEDAY</Select.Option>
              <Select.Option value="LILA_ABBISINIA">
                LILA_ABBISINIA
              </Select.Option>
              <Select.Option value="OTHER">OTHER</Select.Option>
            </Select>

            <Input
              placeholder="Min Amount"
              value={filters.amountRange?.[0] ?? ""}
              onChange={(e) => {
                // update filters state immediately
                const newMin = e.target.value ? Number(e.target.value) : null;
                const newRange = [newMin, filters.amountRange?.[1] ?? null];
                setFilters((prev) => ({ ...prev, amountRange: newRange }));

                // debounce sending the request until typing stops
                clearTimeout(amountDebounceRef.current);
                amountDebounceRef.current = setTimeout(() => {
                  handleFilterChange({ amountRange: newRange });
                }, 600);
              }}
              style={{ width: 120 }}
            />
            <Input
              placeholder="Max Amount"
              value={filters.amountRange?.[1] ?? ""}
              onChange={(e) => {
                const newMax = e.target.value ? Number(e.target.value) : null;
                const newRange = [filters.amountRange?.[0] ?? null, newMax];
                setFilters((prev) => ({ ...prev, amountRange: newRange }));

                clearTimeout(amountDebounceRef.current);
                amountDebounceRef.current = setTimeout(() => {
                  handleFilterChange({ amountRange: newRange });
                }, 600);
              }}
              style={{ width: 120 }}
            />
          </div>
        </div>
        <div className="flex items-center mt-4 md:mt-0">
          <button
            onClick={() => {
              const [pg, lm] = getPaginationInfo();
              loadPayments({ page: pg, pageSize: lm, search: localSearch });
              setSearchParams({ page: pg, limit: lm });
            }}
            className="border border-[var(--color-primary)] py-2 px-3 text-[var(--color-primary)] rounded mr-4"
          >
            <ReloadOutlined />
          </button>
        </div>
      </div>

      <div className="hidden md:block">
        <CommonTable
          data={payments}
          columns={tableColumns}
          total={total}
          loading={loading}
          currentPage={page}
          pageSize={pageSize}
          rowKey={(r) => r?.id}
          handlePagination={(p, ps) => handlePagination(p, ps)}
          onRow={(record) => ({
            onClick: () => {
              const id = record.id || record._id;
              if (id) navigate(`/dash/payments/${id}`, { state: record });
            },
            style: { cursor: "pointer" },
          })}
        />
      </div>

      <div className="block md:hidden px-6">
        {loading &&
          Array(5)
            .fill(1)
            .map((_) => <CommonCardSkeleton />)}
        {payments && payments.length > 0 ? (
          payments.map((p) => (
            <CommonCard
              key={p?.id || p?._id}
              item={p}
              title={["payer.firstName", "payer.lastName"]}
              fieldMap={{
                amount: "Amount",
                method: "Method",
                status: "Status",
                hostEarnings: "Host Earnings",
              }}
              {...(currentRole === "host"
                ? {}
                : {
                    actionItems: [
                      {
                        key: "refund",
                        label: <Button type="text">Refund</Button>,
                      },
                      {
                        key: "release",
                        label: <Button type="text">Release</Button>,
                      },
                    ],
                  })}
              onActionClick={(info, item) => handleAction(info.key, item)}
              onCardClick={(record) => {
                const id = record.id || record._id;
                if (id) navigate(`/dash/payments/${id}`, { state: record });
              }}
            />
          ))
        ) : (
          <div className="p-6">No payments found</div>
        )}

        <div className="my-4 flex justify-center">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={handlePagination}
            showSizeChanger
          />
        </div>
      </div>

      <Modal
        title={`Refund Payment`}
        open={refundModalOpen}
        onCancel={() => {
          setRefundModalOpen(false);
          refundForm.resetFields();
        }}
        onOk={() => refundForm.submit()}
        confirmLoading={refundSubmitting}
        okButtonProps={{
          style: {
            backgroundColor: "var(--color-primary)",
            borderColor: "var(--color-primary)",
            color: "white",
          },
        }}
      >
        <Form form={refundForm} layout="vertical" onFinish={submitRefund}>
          {/* <Form.Item label="Booking ID">
            <Input disabled value={refundRecord?.bookingId || ""} />
          </Form.Item> */}
          <Form.Item
            label="Refund Amount"
            name="refundAmount"
            rules={[{ required: true, message: "Enter refund amount" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Reason" name="reason">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PaymentList;

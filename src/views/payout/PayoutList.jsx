import React, { useEffect, useState, useRef } from "react";
import {
  Input,
  Button,
  Tag,
  Dropdown,
  Modal,
  message,
  Select,
  Pagination,
  Form,
  InputNumber,
} from "antd";
import { ReloadOutlined, MoreOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser } from "../../redux/auth/authSlice";
import {
  fetchPayouts,
  approvePayout,
  rejectPayout,
  selectPayouts,
  selectPayoutsLoading,
  selectPayoutsPagination,
} from "./PayoutRedux";
import CommonTable from "../../components/commons/CommonTable";
import CommonCard from "../../components/commons/CommonCard";
import CommonCardSkeleton from "../../components/commons/CommonSkeleton";
import PayoutService from "./PayoutService";

const { confirm } = Modal;

const PayoutList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const payouts = useSelector(selectPayouts);
  const loading = useSelector(selectPayoutsLoading);
  const pagination = useSelector(selectPayoutsPagination);
  const currentUser = useSelector(selectCurrentUser);

  // derive host earnings safely
  const initialHostEarnings =
    currentUser?.user?.hostProfile?.earnings ||
    currentUser?.hostProfile?.earnings ||
    0;

  // local earnings state to reflect immediate changes after withdraw
  const [hostEarningsLocal, setHostEarningsLocal] =
    useState(initialHostEarnings);

  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutForm] = Form.useForm();
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve' | 'reject'
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionForm] = Form.useForm();

  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({
    status: null,
    bankType: null,
  });

  const debounceRef = useRef(null);

  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("limit") || 10);

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

  const getUserId = () => {
    if (!currentUser) return null;
    if (currentUser.id) return currentUser.id;
    if (currentUser.user && currentUser.user.id) return currentUser.user.id;
    return null;
  };

  const loadData = ({
    page = 1,
    limit = 10,
    search = "",
    filter = null,
  } = {}) => {
    dispatch(fetchPayouts({ page, limit, searchText: search, filter }));
  };

  useEffect(() => {
    loadData({ page, limit: pageSize });
  }, []);

  // fetch fresh user profile
  const refreshProfile = async () => {
    const id = getUserId();
    if (!id) return;
    try {
      const user = await PayoutService.getUserProfileById(id);
      const earnings = user?.hostProfile?.earnings || 0;
      setHostEarningsLocal(earnings);
    } catch (err) {
      console.error("Failed to refresh user profile:", err);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, [currentUser]);

  const buildFilter = (src) => {
    const s = src || filters;
    const f = {};
    if (s.status) f.status = s.status;
    if (s.bankType) f.bankType = s.bankType;
    return Object.keys(f).length ? f : null;
  };

  /** Handle search with debounce */
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchText(val);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchParams({ page: 1, limit: pageSize });
      loadData({
        page: 1,
        limit: pageSize,
        search: val,
        filter: buildFilter(filters),
      });
    }, 500);
  };

  /** Handle filters */
  const handleFilterChange = (type, value) => {
    const newFilters = { ...filters, [type]: value };
    setFilters(newFilters);

    setSearchParams({ page: 1, limit: pageSize });
    loadData({
      page: 1,
      limit: pageSize,
      search: searchText,
      filter: buildFilter(newFilters),
    });
  };

  const handleAction = (action, record) => {
    setSelectedPayout(record);
    setActionType(action);
    actionForm.resetFields();
    setActionModalOpen(true);
  };

  /** Table columns (hide action for hosts) */
  const columns = [];

  if (currentRole !== "host") {
    columns.push({
      title: "",
      render: (_, r) => (
        <Dropdown
          menu={{
            items: [
              { key: "approve", label: "Approve" },
              { key: "reject", label: "Reject" },
            ],
            onClick: (i) => handleAction(i.key, r),
          }}
          trigger={["click"]}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    });
  }

  columns.push(
    {
      title: "Amount",
      dataIndex: "amount",
      render: (a) => `${a} ETB`,
    },
    {
      title: "Bank",
      dataIndex: "bankType",
    },
    {
      title: "Account Number",
      dataIndex: "accountNumber",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => {
        const color =
          s === "APPROVED" ? "green" : s === "REJECTED" ? "red" : "orange";
        return <Tag color={color}>{s}</Tag>;
      },
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      render: (d) => new Date(d).toLocaleString(),
    }
  );

  const handlePagination = (pg, ps) => {
    setSearchParams({ page: pg, limit: ps });
    loadData({
      page: pg,
      limit: ps,
      search: searchText,
      filter: buildFilter(),
    });
  };

  return (
    <div className="px-6 py-4">
      {/* Earnings banner (hosts only) */}
      {currentRole === "host" && (
        <div className="mb-6 p-5 rounded-2xl bg-green-50 shadow-[4px_4px_12px_#e5e7eb,-4px_-4px_12px_#ffffff] border border-green-100 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Your Current Earnings</div>
            <div className="text-3xl font-bold text-gray-800 mt-1">
              {Number(hostEarningsLocal).toLocaleString()} ETB
            </div>
          </div>

          <div className="p-3 rounded-full bg-green-100 text-green-700 shadow-inner">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 1.343-3 3v3m6-3a3 3 0 00-3-3m9 3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4">Payout Requests</h1>

      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex gap-3 items-center flex-wrap">
          <Input
            placeholder="Search by account or host"
            value={searchText}
            onChange={handleSearchChange}
            allowClear
            style={{ width: 250 }}
            className="drop-shadow-sm py-2"
          />

          <Select
            placeholder="Status"
            allowClear
            style={{ width: 160 }}
            value={filters.status}
            onChange={(val) => handleFilterChange("status", val)}
          >
            <Select.Option value="PENDING">PENDING</Select.Option>
            <Select.Option value="APPROVED">APPROVED</Select.Option>
            <Select.Option value="REJECTED">REJECTED</Select.Option>
          </Select>

          <Select
            placeholder="Bank"
            allowClear
            style={{ width: 200 }}
            value={filters.bankType}
            onChange={(val) => handleFilterChange("bankType", val)}
          >
            <Select.Option value="TELEBIRR">TELEBIRR</Select.Option>
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
            <Select.Option value="LILA_ABBISINIA">LILA_ABBISINIA</Select.Option>
            <Select.Option value="OTHER">OTHER</Select.Option>
          </Select>
        </div>

        <div className="flex items-center">
          <button
            onClick={() => loadData({ page, limit: pageSize })}
            className="border border-[var(--color-primary)] py-2 px-3 text-[var(--color-primary)] rounded mr-4"
          >
            <ReloadOutlined />
          </button>
          {currentRole === "host" && (
            <button
              className="px-4 py-2 border border-[var(--color-primary)] text-white bg-[var(--color-primary)] rounded ml-2 flex items-center"
              onClick={() => setPayoutModalOpen(true)}
            >
              <PlusOutlined className="mr-2" /> Withdraw
            </button>
          )}
        </div>
      </div>

      <Modal
        title={`Withdraw Funds`}
        open={payoutModalOpen}
        onCancel={() => {
          setPayoutModalOpen(false);
          payoutForm.resetFields();
        }}
        onOk={() => payoutForm.submit()}
        confirmLoading={payoutSubmitting}
        okText="Withdraw"
        okButtonProps={{
          style: {
            backgroundColor: "var(--color-primary)",
            borderColor: "var(--color-primary)",
            color: "white",
          },
        }}
      >
        <Form
          form={payoutForm}
          layout="vertical"
          onFinish={async (values) => {
            try {
              setPayoutSubmitting(true);
              await PayoutService.withdraw(values);
              message.success("Withdraw request sent");
              const amt = Number(values.amount || 0);
              setHostEarningsLocal((prev) => Math.max(0, prev - amt));
              setPayoutModalOpen(false);
              payoutForm.resetFields();
              loadData({ page, limit: pageSize });
              refreshProfile();
            } catch (err) {
              console.error(err);
              message.error(
                err?.response?.data?.message || "Failed to create payout"
              );
            } finally {
              setPayoutSubmitting(false);
            }
          }}
        >
          <Form.Item
            label="Amount"
            name="amount"
            rules={[{ required: true, message: "Enter amount" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Account Number"
            name="accountNumber"
            rules={[{ required: true, message: "Enter account number" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Bank Type"
            name="bankType"
            rules={[{ required: true, message: "Select bank type" }]}
          >
            <Select placeholder="Select bank type">
              <Select.Option value="TELEBIRR">TELEBIRR</Select.Option>
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
          </Form.Item>
        </Form>
      </Modal>
      <div className="hidden md:block">
        <CommonTable
          data={payouts}
          columns={columns}
          loading={loading}
          total={pagination?.total || 0}
          currentPage={page}
          pageSize={pageSize}
          handlePagination={handlePagination}
          rowKey={(r) => r.id}
        />
      </div>

      {/* Mobile cards */}
      <div className="block md:hidden px-0">
        {loading &&
          Array(5)
            .fill(1)
            .map((_, i) => <CommonCardSkeleton key={i} />)}

        {payouts && payouts.length > 0 ? (
          payouts.map((p) => (
            <CommonCard
              key={p?.id}
              item={p}
              title={["accountNumber"]}
              fieldMap={{
                amount: "Amount",
                bankType: "Bank",
                status: "Status",
              }}
              {...(currentRole === "host"
                ? {}
                : {
                    actionItems: [
                      {
                        key: "approve",
                        label: <Button type="text">Approve</Button>,
                      },
                      {
                        key: "reject",
                        label: <Button type="text">Reject</Button>,
                      },
                    ],
                  })}
              onActionClick={(info, item) => handleAction(info.key, item)}
            />
          ))
        ) : (
          <div className="p-6">No payout requests found</div>
        )}

        <div className="my-4 flex justify-center">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={pagination?.total || 0}
            onChange={handlePagination}
            showSizeChanger
          />
        </div>
      </div>

      <Modal
        title={actionType === "approve" ? "Approve payout" : "Reject payout"}
        open={actionModalOpen}
        onCancel={() => {
          setActionModalOpen(false);
          setSelectedPayout(null);
        }}
        onOk={() => actionForm.submit()}
        confirmLoading={actionSubmitting}
        okButtonProps={{
          style: {
            backgroundColor: "var(--color-primary)",
            borderColor: "var(--color-primary)",
            color: "white",
          },
        }}
      >
        <Form
          form={actionForm}
          layout="vertical"
          onFinish={async (values) => {
            if (!selectedPayout) return;
            const id = selectedPayout.id;
            try {
              setActionSubmitting(true);
              if (actionType === "approve") {
                await dispatch(
                  approvePayout({ payoutId: id, reason: values.reason })
                ).unwrap();
                message.success("Payout approved");
              } else {
                await dispatch(
                  rejectPayout({ payoutId: id, reason: values.reason })
                ).unwrap();
                message.success("Payout rejected");
              }
              setActionModalOpen(false);
              setSelectedPayout(null);
              loadData({ page, limit: pageSize });
            } catch (err) {
              console.error(err);
              message.error("Action failed");
            } finally {
              setActionSubmitting(false);
            }
          }}
        >
          <Form.Item
            label="Reason"
            name="reason"
            rules={[{ required: true, message: "Please provide a reason" }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PayoutList;

import React, { useEffect, useRef, useState } from "react";
import { Button, Dropdown, Input, message, Tag, Pagination, Modal, Typography } from "antd";
import { StopOutlined, CheckCircleOutlined, KeyOutlined } from "@ant-design/icons";
import {
  Page,
  PageHeader,
  ReloadBtn,
  StatsStrip,
  TableCard,
  PersonCell,
  ActivePill,
  TwoLine,
  RowMenu,
  actionColumn,
  EmptyState,
  prettyStatus,
} from "../../components/modern/ModernUI";
import { shortDate, shortTime } from "../../utils/dateFormat";
import CommonTable from "../../components/commons/CommonTable";
import CommonCard from "../../components/commons/CommonCard";
import GustService from "./GustService";
import { useDispatch, useSelector } from "react-redux";
import { searchGust, updateGustState, gustSearchText } from "./GustRedux";
import { useSearchParams, useNavigate } from "react-router-dom";
import CommonCardSkeleton from "../../components/commons/CommonSkeleton";

const GustList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const searchText = useSelector(gustSearchText);
  const page = useSelector((state) => state.gust.query.page);
  const limit = useSelector((state) => state.gust.query.limit);
  const [gustData, setGustData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modeID, setModeID] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const delayTimerRef = useRef(null);

  const getPaginationInfo = () => [
    searchParams.get("page") || 1,
    searchParams.get("limit") || 10,
  ];

  useEffect(() => {
    const [page, limit] = getPaginationInfo();
    dispatch(updateGustState({ page, limit }));
    searchData();
  }, []);

  async function searchData(val = "") {
    try {
      setLoading(true);
      const { payload } = await dispatch(searchGust(val));
      setGustData(payload.data);
      setTotal(payload.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handlePagination = async (p, pageSize) => {
    dispatch(updateGustState({ page: p, limit: pageSize }));
    await searchData();
  };

  const searchHandler = (e) => {
    const { value } = e.target;
    const [page, limit] = getPaginationInfo();
    dispatch(updateGustState({ page, limit, searchText: value }));
    clearTimeout(delayTimerRef.current);
    delayTimerRef.current = setTimeout(() => {
      searchData(value);
    }, 500);
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      setLoading(true);
      let res;
      if (isActive) {
        res = await GustService.deactivateGuest(id);
      } else {
        res = await GustService.activateGuest(id);
      }
      message.success(res?.message || "Guest status updated successfully");
      await searchData();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to change guest active status";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerified = async (id, isVerified) => {
    try {
      setLoading(true);
      const res = await GustService.setPhoneVerified(id, !isVerified);
      message.success(res?.message || "Verification status updated");
      await searchData();
    } catch (err) {
      message.error(
        err?.response?.data?.message || err?.message || "Failed to update verification status"
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset password -> backend generates a temp password (e.g. QWERTY23).
  // It stays visible in the list until the guest sets their own password.
  const handleResetPassword = (record) => {
    const id = record._id || record.id;
    const name = [record.firstName, record.lastName].filter(Boolean).join(" ");
    Modal.confirm({
      title: "Reset password?",
      content: `A new temporary password will be generated for ${name || "this guest"}. Their current password will stop working.`,
      okText: "Reset password",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await GustService.resetPassword(id);
          const temp = res?.data?.tempPassword;
          await searchData();
          Modal.success({
            title: "Password reset",
            content: (
              <div>
                <p style={{ marginBottom: 8 }}>Share this temporary password with the guest:</p>
                <Typography.Text copyable code style={{ fontSize: 18, letterSpacing: 2 }}>
                  {temp}
                </Typography.Text>
                <p className="mp-muted" style={{ marginTop: 8, fontSize: 12 }}>
                  It stays visible in the guest list until they change it.
                </p>
              </div>
            ),
          });
        } catch (err) {
          message.error(err?.response?.data?.message || err?.message || "Failed to reset password");
        }
      },
    });
  };

  const handleReload = () => searchData();

  const items = (record) => [
    {
      key: "toggleActive",
      icon: record.isActive ? <StopOutlined /> : <CheckCircleOutlined />,
      label: record.isActive ? "Deactivate guest" : "Activate guest",
      danger: !!record.isActive,
    },
    {
      key: "toggleVerified",
      icon: <CheckCircleOutlined />,
      label: record.isVerified ? "Mark phone unverified" : "Verify phone",
    },
    {
      key: "resetPassword",
      icon: <KeyOutlined />,
      label: "Reset password",
    },
  ];

  const onClick = ({ key }, record) => {
    const id = record._id || record.id;
    setModeID(id);
    if (key === "toggleActive") handleToggleActive(id, record.isActive);
    if (key === "toggleVerified") handleToggleVerified(id, record.isVerified);
    if (key === "resetPassword") handleResetPassword(record);
  };

  const columns = [
    {
      title: "Guest",
      dataIndex: "firstName",
      key: "firstName",
      sorter: true,
      render: (_, r) => <PersonCell person={r} sub={r.email} />,
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      sorter: true,
      render: (v) => v || <span className="mp-muted">—</span>,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => (role?.name ? prettyStatus(role.name) : <span className="mp-muted">—</span>),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (v) => <ActivePill active={v} />,
    },
    {
      title: "Phone verified",
      dataIndex: "isVerified",
      key: "isVerified",
      render: (v) => <ActivePill active={!!v} on="Verified" off="Unverified" />,
    },
    {
      title: "Temp password",
      dataIndex: "tempPassword",
      key: "tempPassword",
      render: (v) =>
        v ? (
          <Typography.Text copyable code>{v}</Typography.Text>
        ) : (
          <span className="mp-muted">—</span>
        ),
    },
    {
      title: "Joined",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: true,
      render: (d) => <TwoLine main={shortDate(d)} sub={shortTime(d)} />,
    },
    actionColumn((_, r) => <RowMenu items={items(r)} record={r} onClick={onClick} />),
  ];

  const tableChange = (pagination, filters, sorter) => {
    const sortField = sorter.field;
    const order = sorter.order === "ascend" ? "asc" : sorter.order === "descend" ? "desc" : undefined;
    dispatch(updateGustState({ sort: sortField, order }));
    searchData();
  };

  const activeCount = (gustData || []).filter((g) => g.isActive).length;

  return (
    <Page>
      <PageHeader
        eyebrow="People"
        title="Guests"
        subtitle="Everyone who rents cars on Wheellol."
        actions={<ReloadBtn onClick={handleReload} loading={loading} />}
      />

      <StatsStrip
        items={[
          { label: "Total guests", value: total || 0, note: "Registered accounts", color: "#09234c" },
          { label: "Active", value: activeCount, note: "On this page", color: "#059669" },
          { label: "Inactive", value: (gustData || []).length - activeCount, note: "On this page", color: "#94a3b8" },
        ]}
      />

      <TableCard
        search={{ value: searchText, onChange: searchHandler, placeholder: "Search by name, email or phone" }}
        resultLabel={`${total || 0} guests`}
      >
        <div className="hidden md:block">
          <CommonTable
            data={gustData}
            columns={columns}
            total={total}
            loadding={loading}
            rowKey={(r) => r?._id || r?.id}
            tableChange={tableChange}
            handlePagination={handlePagination}
            currentPage={parseInt(page) || 1}
            pageSize={parseInt(limit) || 10}
            unit="guests"
          />
        </div>

        <div className="block md:hidden mp-mlist">
          {loading && Array(4).fill(1).map((_, i) => <CommonCardSkeleton key={i} />)}
          {!loading && gustData && gustData.length > 0
            ? gustData.map((g) => (
                <CommonCard
                  key={g?._id || g?.id}
                  item={g}
                  title={["firstName", "lastName"]}
                  fieldMap={{ email: "Email", phone: "Phone", isActive: "Status", ...(g?.tempPassword ? { tempPassword: "Temp password" } : {}) }}
                  actionItems={items(g)}
                  onActionClick={(info, item) => onClick(info, item)}
                />
              ))
            : !loading && <EmptyState title="No guests found" text="Try a different search." />}
          <div className="my-4 flex justify-center">
            <Pagination
              current={parseInt(page) || 1}
              pageSize={parseInt(limit) || 10}
              total={total}
              onChange={handlePagination}
              size="small"
            />
          </div>
        </div>
      </TableCard>
    </Page>
  );
};

export default GustList;

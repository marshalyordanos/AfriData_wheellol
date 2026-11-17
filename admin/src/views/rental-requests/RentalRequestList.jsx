import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tooltip, Pagination, Button } from "antd";
import { DollarOutlined, PhoneOutlined, CarOutlined, EnvironmentOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import CommonTable from "../../components/commons/CommonTable";
import CommonCardSkeleton from "../../components/commons/CommonSkeleton";
import {
  Page,
  PageHeader,
  ReloadBtn,
  StatsStrip,
  TableCard,
  StatusPill,
  PersonCell,
  TwoLine,
  ThumbCell,
  EmptyState,
} from "../../components/modern/ModernUI";
import RecordPaymentModal from "./RecordPaymentModal";
import RentalRequestService, { STATUS, STATUS_ORDER, carName, etb } from "./rentalRequestHelpers";

export const RequestStatus = ({ status }) => (
  <StatusPill tone={STATUS[status]?.tone}>{STATUS[status]?.label || status}</StatusPill>
);

const PaidBar = ({ r }) =>
  r.paidPercent === null || r.paidPercent === undefined ? (
    <span className="mp-muted">{r.paidAmount ? etb(r.paidAmount) : "—"}</span>
  ) : (
    <div className="mp-progress">
      <span className="bar">
        <span style={{ width: `${Math.min(100, r.paidPercent)}%`, background: r.paidPercent >= 100 ? "#059669" : "#fc6b38" }} />
      </span>
      <span className="pct">{Math.round(r.paidPercent)}%</span>
    </div>
  );

const RentalRequestList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState("");
  // ?search= lets other pages (e.g. Locations) open a filtered list
  const [urlParams] = useSearchParams();
  const [search, setSearch] = useState(urlParams.get("search") || "");
  const [searchInput, setSearchInput] = useState(urlParams.get("search") || "");
  const timer = useRef(null);
  const [payFor, setPayFor] = useState(null);
  const canPay = (r) => r.status !== "CANCELLED" && !(r.totalPrice && r.balance <= 0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await RentalRequestService.list({ page, pageSize, search, status });
      setRows(res.data || []);
      setTotal(res.pagination?.total || 0);
      setCounts(res.counts || {});
    } catch {
      // error toast is shown by the api interceptor
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  const allCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const pickStatus = (s) => {
    setPage(1);
    setStatus(s || "");
  };

  const columns = [
    {
      title: "Request",
      dataIndex: "trackingCode",
      render: (code, r) => (
        <ThumbCell
          icon={<CarOutlined />}
          title={code}
          sub={dayjs(r.createdAt).format("DD MMM YYYY · HH:mm")}
        />
      ),
    },
    {
      title: "Customer",
      dataIndex: "contactName",
      render: (name, r) => (
        <div className="mp-cell">
          <PersonCell
            name={name}
            sub={
              <a href={`tel:${r.contactPhone}`} onClick={(e) => e.stopPropagation()} style={{ color: "var(--c-text-3)" }}>
                <PhoneOutlined /> {r.contactPhone}
              </a>
            }
          />
          {!r.customer && <StatusPill tone="gray">Guest</StatusPill>}
        </div>
      ),
    },
    {
      title: "Trip",
      render: (_, r) => (
        <div style={{ maxWidth: 260 }}>
          <div className="mp-chip" style={{ fontWeight: 600, color: "var(--c-text)" }}>
            <EnvironmentOutlined style={{ color: "#1d4f91" }} />
            <span className="truncate">
              {r.pickupCity} → {r.destinations?.join(", ") || "—"}
            </span>
          </div>
          <div className="mp-cell-sub">
            {dayjs(r.pickupDate).format("DD MMM YYYY")} · {r.days} day{r.days > 1 ? "s" : ""}
            {r.purpose ? ` · ${r.purpose}` : ""}
            {r.ruralAccess ? " · Rural" : ""}
          </div>
        </div>
      ),
    },
    {
      title: "Cars",
      render: (_, r) => (
        <Tooltip title={r.cars?.map((c) => carName(c.car)).join(", ")} placement="topLeft">
          <span>
            <TwoLine
              main={r.cars?.length === 1 ? carName(r.cars[0].car) : `${r.cars?.length || 0} cars`}
              sub={r.cars?.length > 1 ? carName(r.cars[0]?.car) + " + more" : null}
            />
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Price",
      dataIndex: "totalPrice",
      align: "right",
      render: (p) => (p ? <span className="mp-price">{etb(p)}</span> : <span className="mp-muted">Not set</span>),
    },
    { title: "Paid", width: 160, render: (_, r) => <PaidBar r={r} /> },
    { title: "Status", dataIndex: "status", render: (s) => <RequestStatus status={s} /> },
    {
      title: "Action",
      align: "right",
      render: (_, r) =>
        canPay(r) ? (
          <Button
            size="small"
            type="primary"
            icon={<DollarOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              setPayFor(r);
            }}
          >
            Record payment
          </Button>
        ) : null,
    },
  ];

  const stripItems = [
    { label: "All requests", value: allCount, note: "Across every status", color: "#09234c", key: "" },
    ...STATUS_ORDER.map((s) => ({ label: STATUS[s].label, value: counts[s] || 0, color: STATUS[s].hex, key: s })),
  ].map((it) => ({
    ...it,
    note:
      it.note ||
      (allCount ? `${Math.round(((it.value || 0) / allCount) * 100)}% of all` : "—"),
    active: status === it.key && it.key !== "",
    onClick: () => pickStatus(it.key),
  }));

  return (
    <Page>
      <PageHeader
        eyebrow="Operations"
        title="Booking requests"
        subtitle="Call the customer, agree the price, then record payments."
        actions={<ReloadBtn onClick={load} loading={loading} />}
      />

      <StatsStrip items={stripItems} />

      <TableCard
        tabs={[
          { key: "", label: "All", count: allCount },
          ...STATUS_ORDER.map((s) => ({ key: s, label: STATUS[s].label, count: counts[s] || 0 })),
        ]}
        activeTab={status}
        onTabChange={pickStatus}
        search={{
          value: searchInput,
          placeholder: "Search by code, name or phone",
          onChange: (e) => {
            const v = e.target.value;
            setSearchInput(v);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => {
              setPage(1);
              setSearch(v);
            }, 400);
          },
        }}
        chips={[
          status && { k: "Status", v: STATUS[status]?.label, onRemove: () => pickStatus("") },
          search && {
            k: "Search",
            v: search,
            onRemove: () => {
              setSearchInput("");
              setSearch("");
            },
          },
        ]}
        onClearChips={() => {
          setSearchInput("");
          setSearch("");
          pickStatus("");
        }}
        resultLabel={`${total} result${total === 1 ? "" : "s"}`}
      >
        <div className="hidden md:block">
          <CommonTable
            rowKey="id"
            loadding={loading}
            columns={columns}
            data={rows}
            total={total}
            currentPage={page}
            pageSize={pageSize}
            unit="requests"
            handlePagination={(p, ps) => {
              setPage(p);
              setPageSize(ps);
            }}
            onRow={(r) => ({ onClick: () => navigate(`/dash/requests/${r.id}`), style: { cursor: "pointer" } })}
          />
        </div>

        <div className="block md:hidden mp-mlist">
          {loading && Array(4).fill(1).map((_, i) => <CommonCardSkeleton key={i} />)}
          {!loading && rows.length === 0 && <EmptyState title="No requests found" />}
          {!loading &&
            rows.map((r) => (
              <div key={r.id} className="mp-mcard" onClick={() => navigate(`/dash/requests/${r.id}`)}>
                <div className="mp-mcard-head">
                  <div>
                    <div className="mp-cell-main">{r.trackingCode}</div>
                    <div className="mp-cell-sub">{r.contactName}</div>
                  </div>
                  <RequestStatus status={r.status} />
                </div>
                <div className="mp-mcard-row">
                  <span>Trip</span>
                  <span>
                    {r.pickupCity} · {dayjs(r.pickupDate).format("DD MMM")} · {r.days}d
                  </span>
                </div>
                <div className="mp-mcard-row">
                  <span>Price</span>
                  <span className="mp-price">{r.totalPrice ? etb(r.totalPrice) : "Not set"}</span>
                </div>
                <div className="mp-mcard-row">
                  <span>Paid</span>
                  <PaidBar r={r} />
                </div>
                {canPay(r) && (
                  <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
                    <Button size="small" type="primary" block icon={<DollarOutlined />} onClick={() => setPayFor(r)}>
                      Record payment
                    </Button>
                  </div>
                )}
              </div>
            ))}
          <div className="my-4 flex justify-center">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              size="small"
              onChange={(p, ps) => {
                setPage(p);
                setPageSize(ps);
              }}
            />
          </div>
        </div>
      </TableCard>

      <RecordPaymentModal request={payFor} open={!!payFor} onClose={() => setPayFor(null)} onSaved={load} />
    </Page>
  );
};

export default RentalRequestList;

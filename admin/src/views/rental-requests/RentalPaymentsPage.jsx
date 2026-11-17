import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Tooltip } from "antd";
import { FilePdfOutlined, LinkOutlined, PaperClipOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import CommonTable from "../../components/commons/CommonTable";
import {
  Page,
  PageHeader,
  ReloadBtn,
  StatsStrip,
  TableCard,
  StatusPill,
  PersonCell,
} from "../../components/modern/ModernUI";
import RentalRequestService, { PAYMENT_METHODS, etb, methodLabel } from "./rentalRequestHelpers";
import { RequestStatus } from "./RentalRequestList";
import { downloadInvoicePdf } from "./invoicePdf";

const Progress = ({ pct, color }) =>
  pct === null || pct === undefined ? (
    <span className="mp-muted">—</span>
  ) : (
    <div className="mp-progress">
      <span className="bar">
        <span style={{ width: `${Math.min(100, pct)}%`, background: color || (pct >= 100 ? "#059669" : "#fc6b38") }} />
      </span>
      <span className="pct">{Math.round(pct * 10) / 10}%</span>
    </div>
  );

const RentalPaymentsPage = () => {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ byMethod: [] });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [method, setMethod] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const timer = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await RentalRequestService.listPayments({ page, pageSize, search, method });
      setRows(res.data || []);
      setTotal(res.pagination?.total || 0);
      setStats(res.stats || { byMethod: [] });
    } catch {
      // toast by api interceptor
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, method]);

  useEffect(() => {
    load();
  }, [load]);

  const pickMethod = (m) => {
    setPage(1);
    setMethod(m || "");
  };

  const columns = [
    {
      title: "Payment",
      render: (_, p) => (
        <div>
          <div className="mp-cell-main">{p.invoiceNo}</div>
          <div className="mp-cell-sub">{dayjs(p.paidAt).format("DD MMM YYYY · HH:mm")}</div>
        </div>
      ),
    },
    {
      title: "Booking",
      render: (_, p) => (
        <div>
          <Link to={`/dash/requests/${p.request.id}`} className="mp-chip" style={{ fontWeight: 600 }}>
            <LinkOutlined /> {p.request.trackingCode}
          </Link>
          <div className="mp-cell-sub">
            {p.request.pickupCity} → {p.request.destinations?.join(", ") || "—"}
          </div>
        </div>
      ),
    },
    {
      title: "Customer",
      render: (_, p) => <PersonCell name={p.request.contactName} sub={p.request.contactPhone} />,
    },
    {
      title: "Amount",
      align: "right",
      render: (_, p) => <span className="mp-price">{etb(p.amount)}</span>,
    },
    {
      title: "Of price",
      width: 150,
      render: (_, p) => (
        <Tooltip title={p.request.totalPrice ? `Agreed price ${etb(p.request.totalPrice)}` : "No agreed price yet"}>
          <div>
            <Progress pct={p.sharePercent} color="#1d4f91" />
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Booking paid",
      width: 150,
      render: (_, p) => (
        <Tooltip title={p.balanceAfter !== null ? `Balance after: ${etb(p.balanceAfter)}` : ""}>
          <div>
            <Progress pct={p.cumulativePercent} />
          </div>
        </Tooltip>
      ),
    },
    { title: "Method", dataIndex: "method", render: (m) => <StatusPill tone="gray">{methodLabel(m)}</StatusPill> },
    {
      title: "Booking status",
      render: (_, p) => <RequestStatus status={p.request.status} />,
    },
    {
      title: "",
      align: "right",
      render: (_, p) => (
        <div className="flex gap-2 justify-end">
          {p.receiptUrl && (
            <Tooltip title="View receipt">
              <Button size="small" icon={<PaperClipOutlined />} href={p.receiptUrl} target="_blank" />
            </Tooltip>
          )}
          <Button size="small" type="primary" icon={<FilePdfOutlined />} onClick={() => downloadInvoicePdf(p)}>
            Invoice
          </Button>
        </div>
      ),
    },
  ];

  const methodAmount = (m) => stats.byMethod?.find((x) => x.method === m);
  const stripItems = [
    { label: "Total collected", value: etb(stats.totalCollected || 0), note: `${stats.paymentCount || 0} payments`, color: "#059669" },
    { label: "This month", value: etb(stats.thisMonth || 0), note: `${stats.thisMonthCount || 0} payments`, color: "#fc6b38" },
    ...PAYMENT_METHODS.filter((m) => methodAmount(m.value)).map((m) => ({
      label: m.label,
      value: etb(methodAmount(m.value).amount),
      note: `${methodAmount(m.value).count} payments`,
      color: "#1d4f91",
      active: method === m.value,
      onClick: () => pickMethod(method === m.value ? "" : m.value),
    })),
  ];

  return (
    <Page>
      <PageHeader
        eyebrow="Finance"
        title="Request payments"
        subtitle="Every payment received for booking requests, with the share of the price it covered and a PDF invoice."
        actions={<ReloadBtn onClick={load} loading={loading} />}
      />
      <StatsStrip items={stripItems} />
      <TableCard
        tabs={[{ key: "", label: "All" }, ...PAYMENT_METHODS.map((m) => ({ key: m.value, label: m.label }))]}
        activeTab={method}
        onTabChange={pickMethod}
        search={{
          value: searchInput,
          placeholder: "Search by booking code, customer, phone or reference",
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
        resultLabel={`${total} payment${total === 1 ? "" : "s"}`}
      >
        <CommonTable
          rowKey="id"
          loadding={loading}
          columns={columns}
          data={rows}
          total={total}
          currentPage={page}
          pageSize={pageSize}
          unit="payments"
          handlePagination={(p, ps) => {
            setPage(p);
            setPageSize(ps);
          }}
        />
      </TableCard>
    </Page>
  );
};

export default RentalPaymentsPage;

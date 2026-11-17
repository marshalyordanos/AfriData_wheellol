import React, { useEffect, useMemo, useState } from "react";
import { Skeleton, Segmented } from "antd";
import { ArrowRightOutlined, PlusOutlined, CarOutlined, RightOutlined } from "@ant-design/icons";
import { FaDollarSign, FaCalendarCheck, FaClipboardList, FaRoute, FaUser, FaUserTie } from "react-icons/fa";
import Chart from "react-apexcharts";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import api from "../../api/api";
import { selectCurrentUser } from "../../redux/auth/authSlice";
import { formatCurrency } from "../../utils/date_currency_formatter";
import { normalizeRole } from "../../components/layout/navConfig";
import CommonTable from "../../components/commons/CommonTable";
import RentalRequestService, { STATUS, STATUS_ORDER, carName, etb } from "../rental-requests/rentalRequestHelpers";
import { RequestStatus } from "../rental-requests/RentalRequestList";
import {
  Page,
  PageHeader,
  Btn,
  ReloadBtn,
  StatCard,
  StatusPill,
  PersonCell,
  Card,
  TwoLine,
  ThumbCell,
  EmptyState,
  Avatar,
} from "../../components/modern/ModernUI";
import { shortDate } from "../../utils/dateFormat";
import { useAppearance } from "../../theme/AppearanceProvider";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const compact = (n) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(Number(n || 0));
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

/* tiny inline sparkline */
const Spark = ({ values = [], color = "#fc6b38" }) => {
  const vals = values.length > 1 ? values : [0, 0];
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const pts = vals.map((v, i) => [(i * 120) / (vals.length - 1), 30 - ((v - min) / (max - min || 1)) * 26]);
  const line = "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L");
  return (
    <svg viewBox="0 0 120 32" preserveAspectRatio="none" style={{ width: "100%", height: 34, display: "block" }} aria-hidden="true">
      <path d={`${line} L120 32 L0 32 Z`} fill={color} opacity="0.12" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  // charts are SVG, so they need real colour values from the theme
  const { palette } = useAppearance();
  const C = {
    accent: palette.primary.base,
    accentText: palette.primary.text,
    grid: palette.n.border,
    axis: palette.n.text3,
    text: palette.n.text,
    surface: palette.n.surface,
  };
  const user = useSelector(selectCurrentUser);
  const u = user?.user || user || {};
  const isHost = normalizeRole(user) === "host";

  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState({});
  const [latest, setLatest] = useState([]);
  const [graph, setGraph] = useState({});
  const [bookingSummary, setBookingSummary] = useState({});
  const [requests, setRequests] = useState([]);
  const [reqCounts, setReqCounts] = useState({});
  const [chartType, setChartType] = useState("area");

  const fetchAll = async () => {
    setLoading(true);
    const calls = [
      api.get("users/summary?entity=total"),
      api.get("users/summary?entity=latestBookings"),
      api.get("users/summary?entity=graph"),
      api.get("users/summary?entity=booking"),
    ];
    if (!isHost) calls.push(RentalRequestService.list({ page: 1, pageSize: 50 }));
    const [t, l, g, b, r] = await Promise.allSettled(calls);
    if (t.status === "fulfilled") setTotals(t.value.data?.data || {});
    if (l.status === "fulfilled") setLatest(Array.isArray(l.value.data?.data) ? l.value.data.data : []);
    if (g.status === "fulfilled") setGraph(g.value.data?.data || {});
    if (b.status === "fulfilled") setBookingSummary(b.value.data?.data?.booking || {});
    if (r && r.status === "fulfilled") {
      setRequests(r.value.data || []);
      setReqCounts(r.value.counts || {});
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- derived numbers ---------- */
  const revenue = useMemo(() => {
    const vals = Object.values(graph || {}).map((v) => Number(v) || 0);
    return vals.length ? vals : Array(12).fill(0);
  }, [graph]);
  const m = new Date().getMonth();
  const thisMonth = revenue[m] || 0;
  const lastMonth = m > 0 ? revenue[m - 1] || 0 : 0;
  const mom = lastMonth ? ((thisMonth - lastMonth) / lastMonth) * 100 : null;
  const yearRevenue = revenue.reduce((a, b) => a + b, 0);

  const reqTotal = Object.values(reqCounts).reduce((a, b) => a + b, 0);
  const openRequests = (reqCounts.PENDING || 0) + (reqCounts.UNDER_NEGOTIATION || 0);
  const priced = requests.filter((r) => r.totalPrice > 0);
  const pipelineValue = priced.reduce((a, r) => a + Number(r.totalPrice || 0), 0);
  const outstanding = priced
    .filter((r) => r.status !== "CANCELLED")
    .reduce((a, r) => a + Math.max(0, Number(r.balance ?? r.totalPrice - (r.paidAmount || 0))), 0);

  const kpis = [
    {
      label: "Total revenue",
      value: formatCurrency(totals?.totalRevenue || 0),
      icon: FaDollarSign,
      accent: "orange",
      foot: mom === null ? "Lifetime earnings" : `${mom >= 0 ? "▲" : "▼"} ${Math.abs(mom).toFixed(1)}% vs last month`,
      spark: revenue,
    },
    !isHost && {
      label: "Booking requests",
      value: reqTotal.toLocaleString(),
      icon: FaClipboardList,
      accent: "navy",
      foot: `${openRequests} waiting for you`,
      onClick: () => navigate("/dash/requests"),
    },
    !isHost && {
      label: "On trip now",
      value: (reqCounts.ACTIVE || 0).toLocaleString(),
      icon: FaRoute,
      accent: "violet",
      foot: `${reqCounts.APPROVED || 0} approved, starting soon`,
    },
    {
      label: "Total bookings",
      value: Number(totals?.totalBookings || 0).toLocaleString(),
      icon: FaCalendarCheck,
      accent: "sky",
      foot: `${bookingSummary.pending || 0} pending`,
      onClick: () => navigate("/dash/bookings"),
    },
    { label: "Total users", value: Number(totals?.totalUsers || 0).toLocaleString(), icon: FaUser, accent: "green", foot: "Guests & hosts" },
    { label: "Active owners", value: Number(totals?.activeHosts || 0).toLocaleString(), icon: FaUserTie, accent: "amber", foot: "Hosts with listings" },
  ].filter(Boolean);

  /* ---------- revenue chart ---------- */
  const revenueChart = {
    series: [{ name: "Revenue", data: revenue }],
    options: {
      chart: { type: chartType, toolbar: { show: false }, fontFamily: "DM Sans, sans-serif", zoom: { enabled: false } },
      colors: [C.accent],
      fill:
        chartType === "area"
          ? { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.02, stops: [0, 95] } }
          : { opacity: 1 },
      plotOptions: { bar: { borderRadius: 6, columnWidth: "46%" } },
      stroke: { curve: "smooth", width: chartType === "area" ? 2.5 : 0 },
      markers: { size: 0, hover: { size: 5 } },
      grid: { borderColor: C.grid, strokeDashArray: 4, xaxis: { lines: { show: false } }, padding: { left: 8, right: 8 } },
      xaxis: {
        categories: MONTHS,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: C.axis, fontSize: "12px" } },
      },
      yaxis: { labels: { style: { colors: C.axis, fontSize: "12px" }, formatter: (v) => compact(v) } },
      dataLabels: { enabled: false },
      tooltip: { theme: palette.dark ? "dark" : "light", y: { formatter: (v) => formatCurrency(v) } },
    },
  };

  /* ---------- donut: request pipeline (admin) or booking status (host) ---------- */
  const donutParts = !isHost && reqTotal
    ? STATUS_ORDER.map((s) => ({ label: STATUS[s].label, value: reqCounts[s] || 0, color: STATUS[s].hex, key: s }))
    : (() => {
        const cancelled =
          Number(bookingSummary.cancelledByGuest || 0) +
          Number(bookingSummary.cancelledByHost || 0) +
          Number(bookingSummary.cancelledByAdmin || 0);
        const parts = [
          { label: "Pending", value: Number(bookingSummary.pending || 0), color: "#f59e0b" },
          { label: "Completed", value: Number(bookingSummary.completed || 0), color: "#1d4f91" },
          { label: "Cancelled", value: cancelled, color: "#94a3b8" },
        ];
        const other = Math.max(0, Number(bookingSummary.totalBookings || 0) - parts.reduce((a, p) => a + p.value, 0));
        if (other) parts.push({ label: "Confirmed / other", value: other, color: C.accent });
        return parts;
      })();
  const donutTotal = donutParts.reduce((a, p) => a + p.value, 0);
  const donut = {
    series: donutParts.map((p) => p.value),
    options: {
      chart: { type: "donut", fontFamily: "DM Sans, sans-serif" },
      labels: donutParts.map((p) => p.label),
      colors: donutParts.map((p) => p.color),
      legend: { show: false },
      dataLabels: { enabled: false },
      stroke: { width: 3, colors: [C.surface] },
      plotOptions: {
        pie: {
          donut: {
            size: "74%",
            labels: {
              show: true,
              name: { fontSize: "12px", color: C.axis, offsetY: 18 },
              value: { fontSize: "26px", fontWeight: 700, color: C.text, offsetY: -14 },
              total: {
                show: true,
                label: !isHost && reqTotal ? "Requests" : "Bookings",
                color: C.axis,
                fontSize: "12px",
                formatter: () => donutTotal.toLocaleString(),
              },
            },
          },
        },
      },
    },
  };

  /* ---------- needs attention ---------- */
  const attention = !isHost
    ? [
        { count: reqCounts.PENDING || 0, title: "New requests to call", sub: "Customers waiting for a price", bg: "#fffaeb", fg: "#b54708", to: "/dash/requests" },
        { count: reqCounts.UNDER_NEGOTIATION || 0, title: "In negotiation", sub: "Agree the price and approve", bg: "#eaf1fb", fg: "#1d4f91", to: "/dash/requests" },
        {
          count: priced.filter((r) => r.status === "APPROVED" && (r.paidPercent || 0) < 10).length,
          title: "Approved, no advance yet",
          sub: "Record the 10% advance",
          bg: "#f3edff",
          fg: "#6d28d9",
          to: "/dash/requests",
        },
        {
          count: priced.filter((r) => r.status === "ACTIVE" && (r.paidPercent || 0) < 100).length,
          title: "On trip with balance due",
          sub: "Collect the next instalment",
          bg: "#fff4ef",
          fg: "#c2410c",
          to: "/dash/requests",
        },
      ]
    : [
        { count: bookingSummary.pending || 0, title: "Bookings to confirm", sub: "Guests waiting for you", bg: "#fffaeb", fg: "#b54708", to: "/dash/bookings" },
      ];
  const attentionTotal = attention.reduce((a, x) => a + x.count, 0);

  /* ---------- upcoming pickups & top cities from requests ---------- */
  const upcoming = requests
    .filter((r) => r.status !== "CANCELLED" && r.status !== "COMPLETED" && dayjs(r.pickupDate).isAfter(dayjs().subtract(1, "day")))
    .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate))
    .slice(0, 5);
  const cityMap = requests.reduce((acc, r) => {
    if (r.pickupCity) acc[r.pickupCity] = (acc[r.pickupCity] || 0) + 1;
    return acc;
  }, {});
  const cities = Object.entries(cityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const cityMax = cities[0]?.[1] || 1;

  /* ---------- tables ---------- */
  const requestCols = [
    {
      title: "Request",
      dataIndex: "trackingCode",
      render: (c, r) => <ThumbCell icon={<CarOutlined />} title={c} sub={dayjs(r.createdAt).format("DD MMM · HH:mm")} />,
    },
    { title: "Customer", dataIndex: "contactName", render: (n, r) => <PersonCell name={n} sub={r.contactPhone} /> },
    {
      title: "Trip",
      render: (_, r) => (
        <TwoLine main={`${r.pickupCity} → ${r.destinations?.join(", ") || "—"}`} sub={`${dayjs(r.pickupDate).format("DD MMM")} · ${r.days} day${r.days > 1 ? "s" : ""}`} />
      ),
    },
    { title: "Price", dataIndex: "totalPrice", align: "right", render: (p) => (p ? <span className="mp-price">{etb(p)}</span> : <span className="mp-muted">Not set</span>) },
    { title: "Status", dataIndex: "status", render: (s) => <RequestStatus status={s} /> },
  ];

  const bookingCols = [
    {
      title: "Car",
      render: (_, r) => (
        <ThumbCell
          icon={<CarOutlined />}
          title={`${r?.car?.make?.name || ""} ${r?.car?.model?.name || ""}`.trim() || "—"}
          sub={`${shortDate(r.startDate)} → ${shortDate(r.endDate)}`}
        />
      ),
    },
    { title: "Renter", render: (_, r) => <PersonCell person={r.guest} /> },
    { title: "Owner", render: (_, r) => <PersonCell person={r.host} /> },
    {
      title: "Amount",
      align: "right",
      render: (_, r) => <span className="mp-price">{r.totalPrice || r.totalPrice === 0 ? formatCurrency(r.totalPrice) : "—"}</span>,
    },
    { title: "Status", dataIndex: "status", render: (s) => <StatusPill status={s} /> },
  ];

  const name = u.firstName || "";

  return (
    <Page>
      <PageHeader
        eyebrow={dayjs().format("dddd, D MMMM YYYY")}
        title={`${greeting()}${name ? `, ${name}` : ""}`}
        subtitle="Here's how your rental platform is performing."
        actions={
          <>
            <ReloadBtn onClick={fetchAll} loading={loading} />
            {isHost ? (
              <Btn variant="primary" icon={<ArrowRightOutlined />} onClick={() => navigate("/dash/bookings")}>
                View bookings
              </Btn>
            ) : (
              <Btn variant="primary" icon={<PlusOutlined />} onClick={() => navigate("/dash/requests")}>
                Open requests
              </Btn>
            )}
          </>
        }
      />

      {/* KPIs */}
      <section className="mp-stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}>
            <StatCard {...k} extra={k.spark ? <Spark values={k.spark} color={C.accent} /> : null} />
          </motion.div>
        ))}
      </section>

      {/* Revenue + donut */}
      <div className="mp-grid-2">
        <Card
          title="Revenue overview"
          subtitle={`${compact(yearRevenue)} ETB over the last 12 months · ${compact(thisMonth)} ETB this month`}
          extra={
            <Segmented
              size="small"
              value={chartType}
              onChange={setChartType}
              options={[
                { label: "Trend", value: "area" },
                { label: "Monthly", value: "bar" },
              ]}
            />
          }
          bodyClass="px-3 pt-4 pb-2"
        >
          <Chart key={chartType} options={revenueChart.options} series={revenueChart.series} type={chartType} height={310} />
        </Card>

        <Card
          title={!isHost && reqTotal ? "Request pipeline" : "Booking status"}
          extra={
            <button className="mp-link" onClick={() => navigate(!isHost && reqTotal ? "/dash/requests" : "/dash/bookings")}>
              View all
            </button>
          }
        >
          {donutTotal ? (
            <>
              <Chart options={donut.options} series={donut.series} type="donut" height={210} />
              <div style={{ marginTop: 10 }}>
                {donutParts.map((p) => (
                  <div key={p.label} className="mp-list-item" style={{ padding: "9px 0" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: p.color }} />
                    <span className="flex-1 text-sm" style={{ color: "var(--c-text-2)" }}>{p.label}</span>
                    <span className="text-sm font-semibold tabular-nums">{p.value}</span>
                    <span className="text-xs w-10 text-right tabular-nums" style={{ color: "var(--c-text-3)" }}>
                      {Math.round((p.value / donutTotal) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : loading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : (
            <EmptyState title="No data yet" />
          )}
        </Card>
      </div>

      {/* Attention / pickups / cities */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 20 }}>
        <Card title="Needs your attention" extra={<StatusPill tone="orange">{attentionTotal} open</StatusPill>}>
          {attention.map((a) => (
            <button key={a.title} className="mp-attn" onClick={() => navigate(a.to)}>
              <span className="n" style={{ background: a.bg, color: a.fg }}>{a.count}</span>
              <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <span className="mp-cell-main" style={{ display: "block" }}>{a.title}</span>
                <span className="mp-cell-sub" style={{ display: "block" }}>{a.sub}</span>
              </span>
              <RightOutlined style={{ color: "#94a3b8", fontSize: 12 }} />
            </button>
          ))}
        </Card>

        {!isHost && (
          <Card title="Upcoming pickups" subtitle="Next confirmed and pending trips">
            {upcoming.length ? (
              upcoming.map((r) => (
                <button key={r.id} className="mp-sched" onClick={() => navigate(`/dash/requests/${r.id}`)}>
                  <span className="t">
                    <b>{dayjs(r.pickupDate).format("DD")}</b>
                    <em>{dayjs(r.pickupDate).format("MMM")}</em>
                  </span>
                  <Avatar name={r.contactName} size={34} />
                  <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <span className="mp-cell-main" style={{ display: "block" }}>{r.contactName}</span>
                    <span className="mp-cell-sub truncate" style={{ display: "block" }}>
                      {r.cars?.[0] ? carName(r.cars[0].car) : "Car"} · {r.pickupCity}
                    </span>
                  </span>
                  <RequestStatus status={r.status} />
                </button>
              ))
            ) : (
              <EmptyState title="No upcoming pickups" />
            )}
          </Card>
        )}

        {!isHost && (
          <Card title="Top pickup cities" subtitle="From the latest requests">
            {cities.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {cities.map(([c, n]) => (
                  <div key={c}>
                    <div className="flex justify-between" style={{ fontSize: 13.5, marginBottom: 6 }}>
                      <span style={{ fontWeight: 600 }}>{c}</span>
                      <span style={{ color: "var(--c-text-2)" }}>{n} request{n === 1 ? "" : "s"}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: "var(--c-muted)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 99, background: "#1d4f91", width: `${(n / cityMax) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {pipelineValue > 0 && (
                  <div className="mp-subcard" style={{ marginTop: 6, display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div>
                      <div className="mp-cell-sub" style={{ marginTop: 0 }}>Agreed value</div>
                      <div className="mp-price" style={{ fontSize: 16 }}>{compact(pipelineValue)} ETB</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="mp-cell-sub" style={{ marginTop: 0 }}>Still to collect</div>
                      <div className="mp-price" style={{ fontSize: 16, color: "var(--c-primary-text)" }}>{compact(outstanding)} ETB</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState title="No requests yet" />
            )}
          </Card>
        )}
      </section>

      {/* Latest requests */}
      {!isHost && (
        <Card
          title="Latest booking requests"
          subtitle="The most recent requests from customers"
          extra={
            <button className="mp-link" onClick={() => navigate("/dash/requests")}>
              View all <ArrowRightOutlined />
            </button>
          }
          bodyClass=""
          style={{ marginBottom: 20, overflow: "hidden" }}
        >
          <div className="mp-tcard">
            <CommonTable
              type="nopager"
              rowKey="id"
              columns={requestCols}
              data={requests.slice(0, 6)}
              loadding={loading}
              onRow={(r) => ({ onClick: () => navigate(`/dash/requests/${r.id}`), style: { cursor: "pointer" } })}
            />
          </div>
        </Card>
      )}

      {/* Latest bookings */}
      {(isHost || latest.length > 0) && (
        <Card
          title="Latest bookings"
          subtitle="Most recent reservations"
          extra={
            <button className="mp-link" onClick={() => navigate("/dash/bookings")}>
              View all <ArrowRightOutlined />
            </button>
          }
          bodyClass=""
          style={{ overflow: "hidden" }}
        >
          <div className="mp-tcard">
            <CommonTable
              type="nopager"
              rowKey={(r) => r.id || r._id}
              columns={bookingCols}
              data={latest}
              loadding={loading}
              onRow={(r) => ({ onClick: () => navigate(`/dash/bookings/${r.id || r._id}`), style: { cursor: "pointer" } })}
            />
          </div>
        </Card>
      )}
    </Page>
  );
};

export function isoToDisplay(isoStr) {
  const d = new Date(isoStr);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()} ${hours}:${minutes} ${ampm}`;
}

export default DashboardPage;

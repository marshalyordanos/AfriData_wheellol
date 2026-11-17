import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pagination, Select, Switch, Tooltip, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { MapPin } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CommonTable from "../../components/commons/CommonTable";
import CommonModal from "../../components/commons/CommonModel";
import CommonDeleteModal from "../../components/commons/CommonDeleteModal";
import CommonCardSkeleton from "../../components/commons/CommonSkeleton";
import {
  Page,
  PageHeader,
  Btn,
  ReloadBtn,
  StatsStrip,
  TableCard,
  StatusPill,
  RowMenu,
  actionColumn,
  EmptyState,
} from "../../components/modern/ModernUI";
import LocationService, { LOCATION_TYPES, typeMeta } from "./LocationService";
import LocationForm from "./LocationForm";
import "./locations.css";

const TABS = [
  { key: "", label: "All" },
  { key: "REGION", label: "Regions" },
  { key: "CITY_ADMINISTRATION", label: "City administrations" },
  { key: "CITY", label: "Cities & towns" },
];

const initials = (name = "") =>
  name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const LocationCell = ({ r }) => {
  const t = typeMeta(r.type);
  return (
    <div className="loc-cell">
      <span className="loc-badge" style={{ background: t.bg, color: t.color }}>
        {initials(r.name)}
      </span>
      <div>
        <div className="loc-name">{r.name}</div>
        <div className="loc-sub">
          {r.nameAm ? <span className="loc-am">{r.nameAm}</span> : <span className="loc-muted">No Amharic name</span>}
          {r.region ? ` · in ${r.region}` : ""}
        </div>
      </div>
    </div>
  );
};

const Coords = ({ r }) =>
  typeof r.latitude === "number" && typeof r.longitude === "number" ? (
    <a
      className="loc-coords"
      href={`https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}`}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
    >
      <MapPin size={13} />
      {r.latitude.toFixed(3)}, {r.longitude.toFixed(3)}
    </a>
  ) : (
    <span className="loc-muted">Not set</span>
  );

const LocationList = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page")) || 1;
  const limit = Number(params.get("limit")) || 20;
  const type = params.get("type") || "";
  const active = params.get("active") || "";
  const pickup = params.get("pickup") || "";
  const [search, setSearch] = useState(params.get("search") || "");
  const [query, setQuery] = useState(search);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({});
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState({});
  const timer = useRef();

  const setParam = (patch) => {
    const next = Object.fromEntries(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === "" || v === undefined || v === null) delete next[k];
      else next[k] = String(v);
    });
    setParams(next);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await LocationService.list({ page, pageSize: limit, search: query, type, active, pickup });
      setRows(res?.data || []);
      setTotal(res?.pagination?.total || 0);
      setCounts(res?.counts || {});
    } catch (e) {
      /* toast shown by the API interceptor */
    } finally {
      setLoading(false);
    }
  }, [page, limit, query, type, active, pickup]);

  const loadRegions = useCallback(async () => {
    try {
      const res = await LocationService.list({ pageSize: 200, type: "REGION" });
      setRegions(res?.data || []);
    } catch (e) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadRegions();
  }, [loadRegions]);

  const onSearch = (e) => {
    const v = e.target.value;
    setSearch(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setQuery(v.trim());
      setParam({ search: v.trim(), page: 1 });
    }, 400);
  };

  const toggle = async (r, field) => {
    const value = !r[field];
    setBusy((b) => ({ ...b, [`${r.id}-${field}`]: true }));
    setRows((list) => list.map((x) => (x.id === r.id ? { ...x, [field]: value } : x)));
    try {
      await LocationService.update(r.id, { [field]: value });
      message.success(
        field === "isPickup"
          ? `${r.name} ${value ? "is now" : "is no longer"} a pickup city`
          : `${r.name} is now ${value ? "active" : "hidden from the app"}`
      );
      load();
    } catch (e) {
      setRows((list) => list.map((x) => (x.id === r.id ? { ...x, [field]: !value } : x)));
    } finally {
      setBusy((b) => ({ ...b, [`${r.id}-${field}`]: false }));
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    setLoading(true);
    try {
      await LocationService.remove(deleting.id);
      message.success(`${deleting.name} deleted`);
      setDeleting(null);
      load();
      loadRegions();
    } catch (e) {
      setLoading(false);
    }
  };

  const menu = [
    { key: "edit", icon: <EditOutlined />, label: "Edit location" },
    { key: "requests", icon: <MapPin size={14} />, label: "See requests from here" },
    { type: "divider" },
    { key: "delete", icon: <DeleteOutlined />, label: "Delete", danger: true },
  ];
  const onMenu = ({ key }, r) => {
    if (key === "edit") setEditing(r);
    if (key === "delete") setDeleting(r);
    if (key === "requests") navigate(`/dash/requests?search=${encodeURIComponent(r.name)}`);
  };

  const columns = [
    { title: "Location", dataIndex: "name", render: (_, r) => <LocationCell r={r} /> },
    {
      title: "Type",
      dataIndex: "type",
      render: (t) => {
        const m = typeMeta(t);
        return <StatusPill tone={m.tone}>{m.label}</StatusPill>;
      },
    },
    {
      title: "Pickup city",
      dataIndex: "isPickup",
      render: (v, r) => (
        <Tooltip title={v ? "Customers can be picked up here" : "Not offered as a pickup city"}>
          <Switch size="small" checked={v} loading={busy[`${r.id}-isPickup`]} onChange={() => toggle(r, "isPickup")} />
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (v, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Switch size="small" checked={v} loading={busy[`${r.id}-isActive`]} onChange={() => toggle(r, "isActive")} />
          <span style={{ fontSize: 13, color: v ? "#047857" : "#94a3b8", fontWeight: 600 }}>{v ? "Active" : "Hidden"}</span>
        </div>
      ),
    },
    {
      title: "Requests",
      dataIndex: "requestCount",
      align: "right",
      render: (n) => <span className={n ? "loc-count" : "loc-muted"}>{n || 0}</span>,
    },
    { title: "Map", dataIndex: "latitude", render: (_, r) => <Coords r={r} /> },
    { title: "Order", dataIndex: "sortOrder", align: "right", render: (n) => <span className="loc-order">{n}</span> },
    actionColumn((_, r) => <RowMenu items={menu} record={r} onClick={onMenu} />),
  ];

  const chips = [
    active && { k: "Status", v: active === "true" ? "Active" : "Hidden", onRemove: () => setParam({ active: "", page: 1 }) },
    pickup && { k: "Pickup", v: "Pickup cities only", onRemove: () => setParam({ pickup: "", page: 1 }) },
    query && { k: "Search", v: query, onRemove: () => { setSearch(""); setQuery(""); setParam({ search: "", page: 1 }); } },
  ];

  const nextOrder = useMemo(() => (counts.total || 0) + 1, [counts]);

  return (
    <Page>
      {editing !== undefined && (
        <CommonModal
          width={720}
          isModalOpen
          setIsModalOpen={() => setEditing(undefined)}
          title={editing ? `Edit ${editing.name}` : "New location"}
        >
          <LocationForm
            record={editing}
            regions={regions}
            nextOrder={nextOrder}
            onCancel={() => setEditing(undefined)}
            onDone={() => {
              setEditing(undefined);
              load();
              loadRegions();
            }}
          />
        </CommonModal>
      )}

      {deleting && (
        <CommonDeleteModal
          isModalOpen
          setIsModalOpen={() => setDeleting(null)}
          handleDelete={doDelete}
          loading={loading}
        >
          <b>{deleting.name}</b> will be removed from the app.
          {deleting.requestCount ? ` Its ${deleting.requestCount} past request(s) keep the city name.` : ""} To hide it
          for now instead, switch it to inactive.
        </CommonDeleteModal>
      )}

      <PageHeader
        eyebrow="Catalog"
        title="Locations"
        subtitle="Regions and cities customers can choose as their pickup city in the app."
        actions={
          <>
            <ReloadBtn onClick={() => { load(); loadRegions(); }} loading={loading} />
            <Btn variant="primary" icon={<PlusOutlined />} onClick={() => setEditing(null)}>
              Add location
            </Btn>
          </>
        }
      />

      <StatsStrip
        items={[
          { label: "All locations", value: counts.total || 0, note: "Regions, city administrations and towns", color: "#09234c", onClick: () => setParam({ type: "", active: "", pickup: "", page: 1 }), active: !type && !active && !pickup },
          { label: "Pickup cities", value: counts.pickup || 0, note: "Shown in the app's request form", color: "#fc6b38", onClick: () => setParam({ pickup: pickup ? "" : "true", page: 1 }), active: !!pickup },
          { label: "Active", value: counts.active || 0, note: "Visible to customers", color: "#059669", onClick: () => setParam({ active: active === "true" ? "" : "true", page: 1 }), active: active === "true" },
          { label: "Hidden", value: (counts.total || 0) - (counts.active || 0), note: "Switched off", color: "#94a3b8", onClick: () => setParam({ active: active === "false" ? "" : "false", page: 1 }), active: active === "false" },
        ]}
      />

      <TableCard
        tabs={TABS}
        activeTab={type}
        onTabChange={(k) => setParam({ type: k, page: 1 })}
        search={{ value: search, onChange: onSearch, placeholder: "Search by name, Amharic name or region" }}
        filters={
          <>
            <Select
              style={{ width: 170 }}
              value={active || undefined}
              placeholder="Any status"
              allowClear
              onChange={(v) => setParam({ active: v || "", page: 1 })}
              options={[
                { value: "true", label: "Active" },
                { value: "false", label: "Hidden" },
              ]}
            />
            <Select
              style={{ width: 190 }}
              value={pickup || undefined}
              placeholder="Pickup & non-pickup"
              allowClear
              onChange={(v) => setParam({ pickup: v || "", page: 1 })}
              options={[{ value: "true", label: "Pickup cities only" }]}
            />
          </>
        }
        chips={chips}
        onClearChips={() => {
          setSearch("");
          setQuery("");
          setParam({ active: "", pickup: "", search: "", page: 1 });
        }}
        resultLabel={`${total} location${total === 1 ? "" : "s"}`}
      >
        <div className="hidden md:block">
          <CommonTable
            data={rows}
            columns={columns}
            rowKey="id"
            loading={loading}
            total={total}
            currentPage={page}
            pageSize={limit}
            unit="locations"
            handlePagination={(p, ps) => setParam({ page: p, limit: ps })}
            onRow={(r) => ({ onDoubleClick: () => setEditing(r) })}
          />
        </div>

        <div className="block md:hidden mp-mlist">
          {loading && !rows.length && Array(4).fill(1).map((_, i) => <CommonCardSkeleton key={i} />)}
          {!loading && !rows.length && (
            <EmptyState icon={<MapPin />} title="No locations found" text="Try another search or add a location." />
          )}
          {rows.map((r) => (
            <div key={r.id} className="loc-mcard">
              <div className="loc-mcard-top">
                <div style={{ flex: 1 }}>
                  <LocationCell r={r} />
                </div>
                <RowMenu items={menu} record={r} onClick={onMenu} />
              </div>
              <div className="loc-mcard-row">
                <span>Pickup city</span>
                <Switch size="small" checked={r.isPickup} onChange={() => toggle(r, "isPickup")} />
              </div>
              <div className="loc-mcard-row">
                <span>Active</span>
                <Switch size="small" checked={r.isActive} onChange={() => toggle(r, "isActive")} />
              </div>
              <div className="loc-mcard-row">
                <StatusPill tone={typeMeta(r.type).tone}>{typeMeta(r.type).label}</StatusPill>
                <span>{r.requestCount || 0} requests</span>
              </div>
            </div>
          ))}
          {total > limit && (
            <div className="my-4 flex justify-center">
              <Pagination current={page} pageSize={limit} total={total} size="small" onChange={(p, ps) => setParam({ page: p, limit: ps })} />
            </div>
          )}
        </div>
      </TableCard>
    </Page>
  );
};

export default LocationList;

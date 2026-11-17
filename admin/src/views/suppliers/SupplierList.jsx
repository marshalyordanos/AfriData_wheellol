// Suppliers: car owners who list cars in the app.
// Top: the global Wheellol commission. Each supplier can have their own %.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { InputNumber, Pagination, message } from "antd";
import { EyeOutlined, PercentageOutlined, CarOutlined } from "@ant-design/icons";
import { Users } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CommonTable from "../../components/commons/CommonTable";
import CommonModal from "../../components/commons/CommonModel";
import CommonCardSkeleton from "../../components/commons/CommonSkeleton";
import {
  Page,
  PageHeader,
  Btn,
  ReloadBtn,
  TableCard,
  StatusPill,
  RowMenu,
  actionColumn,
  EmptyState,
  PersonCell,
} from "../../components/modern/ModernUI";
import SupplierService, { supplierName } from "./SupplierService";
import "./suppliers.css";

const pct = (n) => `${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
const money = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

/** Global commission % with a worked example */
export const CommissionSettings = ({ onSaved }) => {
  const [value, setValue] = useState(null);
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    SupplierService.getSettings()
      .then((s) => {
        setValue(s.commissionPercent);
        setSaved(s.commissionPercent);
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      const s = await SupplierService.saveSettings(value);
      setSaved(s.commissionPercent);
      message.success(`Default commission is now ${pct(s.commissionPercent)}`);
      onSaved && onSaved(s.commissionPercent);
    } catch (e) {
      /* toast shown by the API interceptor */
    } finally {
      setBusy(false);
    }
  };

  const example = 200000;
  const cut = value ? (example * value) / 100 : 0;

  return (
    <div className="sp-commission">
      <div className="sp-commission-main">
        <div className="sp-commission-title">Wheellol commission on supplier cars</div>
        <div className="sp-commission-text">
          When a customer rents a supplier's car, Wheellol keeps this % of the agreed price and the supplier gets the
          rest. You can set a different % for a single supplier below. Changing it affects new prices only.
        </div>
      </div>
      <div className="sp-example">
        Customer pays <b>{money(example)}</b> → Wheellol <b>{money(cut)}</b> · supplier <b>{money(example - cut)}</b> ETB
      </div>
      <div className="sp-commission-form">
        <InputNumber
          min={0}
          max={99.99}
          step={0.5}
          value={value}
          onChange={setValue}
          addonAfter="%"
          style={{ width: 130 }}
          aria-label="Default commission percent"
        />
        <Btn variant="primary" onClick={save} disabled={busy || value === null || value === saved}>
          Save
        </Btn>
      </div>
    </div>
  );
};

/** Per-supplier override */
export const CommissionModal = ({ supplier, globalPercent, onClose, onSaved }) => {
  const [value, setValue] = useState(supplier.commission?.override ?? null);
  const [busy, setBusy] = useState(false);

  const save = async (rate) => {
    setBusy(true);
    try {
      await SupplierService.setCommission(supplier.id, rate);
      message.success(
        rate === null
          ? `${supplierName(supplier)} now uses the default ${pct(globalPercent)}`
          : `${supplierName(supplier)} commission set to ${pct(rate)}`
      );
      onSaved();
    } catch (e) {
      /* toast shown by the API interceptor */
    } finally {
      setBusy(false);
    }
  };

  return (
    <CommonModal width={460} isModalOpen setIsModalOpen={onClose} title={`Commission · ${supplierName(supplier)}`}>
      <p style={{ color: "var(--c-text-3)", fontSize: 13, marginBottom: 14 }}>
        Leave empty to use the default ({pct(globalPercent)}). Applies to prices you set from now on.
      </p>
      <InputNumber
        min={0}
        max={99.99}
        step={0.5}
        value={value}
        onChange={setValue}
        addonAfter="%"
        placeholder={`Default ${pct(globalPercent)}`}
        style={{ width: "100%" }}
        autoFocus
      />
      <div className="sp-actions" style={{ marginTop: 18 }}>
        {supplier.commission?.override !== null && supplier.commission?.override !== undefined && (
          <Btn onClick={() => save(null)} disabled={busy}>Use default</Btn>
        )}
        <Btn variant="primary" onClick={() => save(value === undefined ? null : value)} disabled={busy}>
          Save
        </Btn>
      </div>
    </CommonModal>
  );
};

const SupplierList = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page")) || 1;
  const limit = Number(params.get("limit")) || 10;
  const [search, setSearch] = useState(params.get("search") || "");
  const [query, setQuery] = useState(search);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [globalPercent, setGlobalPercent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
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
      const res = await SupplierService.list({ page, pageSize: limit, search: query });
      setRows(res?.data || []);
      setTotal(res?.pagination?.total || 0);
      setGlobalPercent(res?.globalPercent ?? 0);
    } catch (e) {
      /* toast shown by the API interceptor */
    } finally {
      setLoading(false);
    }
  }, [page, limit, query]);

  useEffect(() => {
    load();
  }, [load]);

  const onSearch = (e) => {
    const v = e.target.value;
    setSearch(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setQuery(v.trim());
      setParam({ search: v.trim(), page: 1 });
    }, 400);
  };

  const menu = [
    { key: "open", icon: <EyeOutlined />, label: "Open supplier" },
    // Commission % removed (2026-11-14): the supplier price is set in each booking's agreement
    // { key: "commission", icon: <PercentageOutlined />, label: "Set commission" },
    { key: "cars", icon: <CarOutlined />, label: "Review their cars" },
  ];
  const onMenu = ({ key }, r) => {
    if (key === "open") navigate(`/dash/suppliers/${r.id}`);
    if (key === "commission") setEditing(r);
    if (key === "cars") navigate(`/dash/supplier-cars?status=ALL&search=${encodeURIComponent(r.phone)}`);
  };

  const CommissionCell = ({ r }) => (
    <button className="mp-link" onClick={(e) => { e.stopPropagation(); setEditing(r); }}>
      <span className="sp-num">{pct(r.commission?.effective)}</span>{" "}
      <span className="sp-muted" style={{ fontSize: 12 }}>
        {r.commission?.override !== null && r.commission?.override !== undefined ? "custom" : "default"}
      </span>
    </button>
  );

  const columns = [
    {
      title: "Supplier",
      dataIndex: "firstName",
      render: (_, r) => (
        <PersonCell
          name={supplierName(r)}
          sub={r.hostProfile?.businessName ? `${r.firstName} ${r.lastName} · ${r.phone}` : r.phone}
          src={r.profilePhoto}
        />
      ),
    },
    {
      title: "Cars",
      dataIndex: "cars",
      render: (c) => (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span className="sp-num">{c?.total || 0}</span>
          {c?.APPROVED > 0 && <StatusPill tone="green">{c.APPROVED} live</StatusPill>}
          {c?.PENDING > 0 && <StatusPill tone="amber">{c.PENDING} to review</StatusPill>}
          {c?.REJECTED > 0 && <StatusPill tone="red">{c.REJECTED} rejected</StatusPill>}
        </div>
      ),
    },
    // { title: "Commission", dataIndex: "commission", render: (_, r) => <CommissionCell r={r} /> },
    {
      title: "Account",
      dataIndex: "isVerified",
      render: (v, r) =>
        !r.isActive ? (
          <StatusPill tone="gray">Inactive</StatusPill>
        ) : v ? (
          <StatusPill tone="green">Phone verified</StatusPill>
        ) : (
          <StatusPill tone="amber">Not verified</StatusPill>
        ),
    },
    actionColumn((_, r) => <RowMenu items={menu} record={r} onClick={onMenu} />),
  ];

  return (
    <Page>
      {editing && (
        <CommissionModal
          supplier={editing}
          globalPercent={globalPercent}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      <PageHeader
        eyebrow="Suppliers"
        title="Suppliers"
        subtitle="Car owners who list their cars on Wheellol from the app. All customer contact stays with Wheellol."
        actions={
          <>
            <ReloadBtn onClick={load} loading={loading} />
            <Btn variant="primary" icon={<CarOutlined />} onClick={() => navigate("/dash/supplier-cars")}>
              Review cars
            </Btn>
          </>
        }
      />

      {/* Commission % removed — the supplier price is agreed per booking
      <CommissionSettings onSaved={(p) => { setGlobalPercent(p); load(); }} />
      */}

      <TableCard
        search={{ value: search, onChange: onSearch, placeholder: "Search name, business or phone" }}
        resultLabel={`${total} supplier${total === 1 ? "" : "s"}`}
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
            unit="suppliers"
            handlePagination={(p, ps) => setParam({ page: p, limit: ps })}
            onRow={(r) => ({ onClick: () => navigate(`/dash/suppliers/${r.id}`), style: { cursor: "pointer" } })}
          />
        </div>

        <div className="block md:hidden mp-mlist">
          {loading && !rows.length && Array(4).fill(1).map((_, i) => <CommonCardSkeleton key={i} />)}
          {!loading && !rows.length && (
            <EmptyState icon={<Users />} title="No suppliers yet" text="Suppliers sign up from the mobile app." />
          )}
          {rows.map((r) => (
            <div key={r.id} className="sp-mcard" onClick={() => navigate(`/dash/suppliers/${r.id}`)}>
              <PersonCell name={supplierName(r)} sub={r.phone} src={r.profilePhoto} />
              <div className="sp-mcard-row">
                <span>{r.cars?.total || 0} cars · {r.cars?.PENDING || 0} to review</span>
                {/* <CommissionCell r={r} /> */}
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

export default SupplierList;

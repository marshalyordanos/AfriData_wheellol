// Supplier cars waiting for approval (and the approved / rejected history).
// Customers only see a supplier car after it is approved here.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Input, Pagination, message } from "antd";
import { CheckOutlined, CloseOutlined, EyeOutlined, UserOutlined } from "@ant-design/icons";
import { Car } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import CommonTable from "../../components/commons/CommonTable";
import CommonModal from "../../components/commons/CommonModel";
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
import SupplierService, { APPROVAL, supplierName } from "./SupplierService";
import "./suppliers.css";

// Order of the 6 required supplier photos (same as the app + backend)
const PHOTO_LABELS = ["Front", "Back", "Left side", "Right side", "Inside – front", "Inside – back"];

const carTitle = (c) => [c?.make?.name, c?.model?.name, c?.year].filter(Boolean).join(" ");

const CarCell = ({ c }) => (
  <div className="sp-car">
    {c.photos?.[0] ? (
      <img className="sp-thumb" src={c.photos[0]} alt="" />
    ) : (
      <span className="sp-thumb">
        <Car size={18} />
      </span>
    )}
    <div>
      <div className="sp-name">{carTitle(c)}</div>
      <div className="sp-sub">
        {[c.licensePlate, c.carType?.name, c.seatingCapacity && `${c.seatingCapacity} seats`].filter(Boolean).join(" · ")}
      </div>
    </div>
  </div>
);

/**
 * Full car + approve / reject in a modal.
 * Not used any more — replaced by the detail page (SupplierCarDetails.jsx). Kept for reference.
 */
export const ReviewModal = ({ car, onClose, onDone }) => {
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const decide = async (decision) => {
    if (decision === "REJECTED" && !reason.trim()) {
      message.warning("Write why the car is rejected — the supplier will see it");
      return;
    }
    setBusy(true);
    try {
      await SupplierService.review(car.id, decision, reason.trim() || undefined);
      message.success(decision === "APPROVED" ? `${carTitle(car)} approved — customers can book it now` : `${carTitle(car)} rejected`);
      onDone();
    } catch (e) {
      /* toast shown by the API interceptor */
    } finally {
      setBusy(false);
    }
  };

  const facts = [
    ["Plate", car.licensePlate],
    ["Type", car.carType?.name],
    ["Seats", car.seatingCapacity],
    ["Transmission", car.transmission === "AUTOMATIC" ? "Automatic" : "Manual"],
    ["Colour", car.color],
    ["Mileage", car.mileage ? `${Number(car.mileage).toLocaleString()} km` : "—"],
    ["Location", car.location],
    ["VIN", car.vin || "—"],
    ["Sent", car.submittedAt ? dayjs(car.submittedAt).format("DD MMM YYYY, HH:mm") : "—"],
  ];

  return (
    <CommonModal width={820} isModalOpen setIsModalOpen={onClose} title={carTitle(car)}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <StatusPill tone={APPROVAL[car.approvalStatus]?.tone}>{APPROVAL[car.approvalStatus]?.label}</StatusPill>
        {!car.isActive && <StatusPill tone="gray">Hidden by supplier</StatusPill>}
        {car.host && (
          <button className="mp-link" onClick={() => navigate(`/dash/suppliers/${car.host.id}`)}>
            <UserOutlined /> {supplierName(car.host)} · {car.host.phone}
          </button>
        )}
      </div>

      {car.photos?.length ? (
        <div className="sp-gallery">
          {car.photos.map((p, i) => (
            <a key={p} href={p} target="_blank" rel="noreferrer" title={PHOTO_LABELS[i] || "Extra photo"}>
              <img src={p} alt={PHOTO_LABELS[i] || "Extra photo"} />
              <span className="sp-photo-label">{PHOTO_LABELS[i] || "Extra"}</span>
            </a>
          ))}
        </div>
      ) : (
        <EmptyState icon={<Car />} title="No photos" />
      )}

      <div className="sp-facts">
        {facts.map(([k, v]) => (
          <div key={k}>
            <div className="sp-fact-k">{k}</div>
            <div className="sp-fact-v">{v || "—"}</div>
          </div>
        ))}
      </div>

      {car.features?.length > 0 && (
        <div className="sp-features">
          {car.features.map((f) => (
            <span key={f} className="sp-chip">{f}</span>
          ))}
        </div>
      )}
      {car.description && <p style={{ color: "var(--c-text-2)", fontSize: 13.5, marginBottom: 16 }}>{car.description}</p>}

      {car.approvalStatus === "REJECTED" && car.rejectionReason && (
        <div className="sp-reject-note">
          <b>Rejected:</b> {car.rejectionReason}
        </div>
      )}

      {rejecting && (
        <div style={{ marginBottom: 16 }}>
          <div className="sp-fact-k" style={{ marginBottom: 6 }}>Why is it rejected? The supplier sees this message.</div>
          <Input.TextArea
            autoFocus
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Photos are blurry — please add clear photos of the front, back and inside"
          />
        </div>
      )}

      <div className="sp-actions">
        {rejecting ? (
          <>
            <Btn onClick={() => setRejecting(false)} disabled={busy}>Back</Btn>
            <Btn variant="danger" icon={<CloseOutlined />} onClick={() => decide("REJECTED")} disabled={busy}>
              Reject car
            </Btn>
          </>
        ) : (
          <>
            {car.approvalStatus !== "REJECTED" && (
              <Btn icon={<CloseOutlined />} onClick={() => setRejecting(true)} disabled={busy}>
                {car.approvalStatus === "APPROVED" ? "Unpublish / reject" : "Reject"}
              </Btn>
            )}
            {car.approvalStatus !== "APPROVED" && (
              <Btn variant="primary" icon={<CheckOutlined />} onClick={() => decide("APPROVED")} disabled={busy}>
                Approve — show to customers
              </Btn>
            )}
          </>
        )}
      </div>
    </CommonModal>
  );
};

const TABS = [
  { key: "PENDING", label: "Waiting for review" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "ALL", label: "All" },
];

const SupplierCarsReview = () => {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "PENDING";
  const page = Number(params.get("page")) || 1;
  const limit = Number(params.get("limit")) || 10;
  const openId = params.get("car");
  const [search, setSearch] = useState(params.get("search") || "");
  const [query, setQuery] = useState(search);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(false);
  // const [open, setOpen] = useState(null); // old review modal — now a detail page
  const navigate = useNavigate();
  const setOpen = (c) => c && navigate(`/dash/supplier-cars/${c.id}`);
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
      const res = await SupplierService.cars({
        page,
        pageSize: limit,
        status: status === "ALL" || openId ? undefined : status,
        search: query,
      });
      const list = res?.data || [];
      setRows(list);
      setTotal(res?.pagination?.total || 0);
      setCounts(res?.counts || {});
      // old notification links: /dash/supplier-cars?car=<id> → detail page
      if (openId) {
        navigate(`/dash/supplier-cars/${openId}`, { replace: true });
        return;
      }
    } catch (e) {
      /* toast shown by the API interceptor */
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, query, openId]);

  useEffect(() => {
    if (openId) {
      navigate(`/dash/supplier-cars/${openId}`, { replace: true });
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const all = (counts.PENDING || 0) + (counts.APPROVED || 0) + (counts.REJECTED || 0);
  const tabs = TABS.map((t) => ({ ...t, count: t.key === "ALL" ? all : counts[t.key] || 0 }));

  const menu = [{ key: "open", icon: <EyeOutlined />, label: "Open car" }];

  const columns = [
    { title: "Car", dataIndex: "id", render: (_, c) => <CarCell c={c} /> },
    {
      title: "Supplier",
      dataIndex: "host",
      render: (h) => (
        <div>
          <div className="sp-name">{supplierName(h)}</div>
          <div className="sp-sub">{h?.phone}</div>
        </div>
      ),
    },
    {
      title: "Sent",
      dataIndex: "submittedAt",
      render: (d, c) => (
        <span className="sp-sub">{dayjs(d || c.createdAt).format("DD MMM YYYY, HH:mm")}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "approvalStatus",
      render: (s, c) => (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <StatusPill tone={APPROVAL[s]?.tone}>{APPROVAL[s]?.short}</StatusPill>
          {!c.isActive && <StatusPill tone="gray">Hidden</StatusPill>}
        </div>
      ),
    },
    actionColumn((_, c) => <RowMenu items={menu} record={c} onClick={() => setOpen(c)} />),
  ];

  return (
    <Page>
      {/* old review modal — replaced by the detail page
      {open && (
        <ReviewModal
          car={open}
          onClose={() => setOpen(null)}
          onDone={() => {
            setOpen(null);
            load();
          }}
        />
      )} */}

      <PageHeader
        eyebrow="Suppliers"
        title="Supplier cars"
        subtitle="Cars added by suppliers in the app. Customers only see a car after you approve it."
        actions={<ReloadBtn onClick={load} loading={loading} />}
      />

      <StatsStrip
        items={[
          { label: "Waiting for review", value: counts.PENDING || 0, note: "Hidden from customers", color: "#d97706", onClick: () => setParam({ status: "PENDING", page: 1 }), active: status === "PENDING" },
          { label: "Approved", value: counts.APPROVED || 0, note: "Customers can book them", color: "#059669", onClick: () => setParam({ status: "APPROVED", page: 1 }), active: status === "APPROVED" },
          { label: "Rejected", value: counts.REJECTED || 0, note: "Supplier must fix and resend", color: "#dc2626", onClick: () => setParam({ status: "REJECTED", page: 1 }), active: status === "REJECTED" },
        ]}
      />

      <TableCard
        tabs={tabs}
        activeTab={status}
        onTabChange={(k) => setParam({ status: k, page: 1 })}
        search={{ value: search, onChange: onSearch, placeholder: "Search plate, brand, model or supplier" }}
        resultLabel={`${total} car${total === 1 ? "" : "s"}`}
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
            unit="cars"
            handlePagination={(p, ps) => setParam({ page: p, limit: ps })}
            onRow={(c) => ({ onClick: () => setOpen(c), style: { cursor: "pointer" } })}
          />
        </div>

        <div className="block md:hidden mp-mlist">
          {loading && !rows.length && Array(4).fill(1).map((_, i) => <CommonCardSkeleton key={i} />)}
          {!loading && !rows.length && (
            <EmptyState
              icon={<Car />}
              title={status === "PENDING" ? "Nothing to review" : "No cars here"}
              text={status === "PENDING" ? "New supplier cars will show up here." : "Try another tab or search."}
            />
          )}
          {rows.map((c) => (
            <div key={c.id} className="sp-mcard" onClick={() => setOpen(c)}>
              <CarCell c={c} />
              <div className="sp-mcard-row">
                <span>{supplierName(c.host)}</span>
                <StatusPill tone={APPROVAL[c.approvalStatus]?.tone}>{APPROVAL[c.approvalStatus]?.short}</StatusPill>
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

export default SupplierCarsReview;

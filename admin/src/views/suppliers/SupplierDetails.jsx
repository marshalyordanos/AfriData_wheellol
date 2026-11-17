// One supplier: contact, commission, their cars and every rental with the split.
import React, { useCallback, useEffect, useState } from "react";
import { Spin, Table } from "antd";
import { PercentageOutlined, IdcardOutlined, PhoneOutlined, CarOutlined, PlusOutlined } from "@ant-design/icons";
import { Car } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  Page,
  PageHeader,
  Btn,
  ReloadBtn,
  Card,
  StatsStrip,
  StatusPill,
  InfoGrid,
  Avatar,
  EmptyState,
} from "../../components/modern/ModernUI";
import SupplierService, { APPROVAL, supplierName } from "./SupplierService";
import { CommissionModal } from "./SupplierList";
import { ReviewModal } from "./SupplierCarsReview";
import { STATUS } from "../rental-requests/rentalRequestHelpers";
import "./suppliers.css";

const money = (n) =>
  n === null || n === undefined ? "—" : Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
const pct = (n) => `${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
const carTitle = (c) => [c?.make?.name, c?.model?.name, c?.year].filter(Boolean).join(" ");

const SupplierDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [s, setS] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [openCar, setOpenCar] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setS(await SupplierService.get(id));
    } catch (e) {
      /* toast shown by the API interceptor */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!s) {
    return (
      <Page>
        <div style={{ display: "grid", placeItems: "center", minHeight: 300 }}>
          {loading ? <Spin /> : <EmptyState title="Supplier not found" />}
        </div>
      </Page>
    );
  }

  const name = supplierName(s);
  const custom = s.commission?.override !== null && s.commission?.override !== undefined;

  const carColumns = [
    {
      title: "Car",
      dataIndex: "id",
      render: (_, c) => (
        <div className="sp-car">
          {c.photos?.[0] ? <img className="sp-thumb" src={c.photos[0]} alt="" /> : <span className="sp-thumb"><Car size={18} /></span>}
          <div>
            <div className="sp-name">{carTitle(c)}</div>
            <div className="sp-sub">{[c.licensePlate, c.carType?.name].filter(Boolean).join(" · ")}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "approvalStatus",
      render: (v, c) => (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <StatusPill tone={APPROVAL[v]?.tone}>{APPROVAL[v]?.short}</StatusPill>
          {!c.isActive && <StatusPill tone="gray">Hidden</StatusPill>}
          {c.stats?.onTrip && <StatusPill tone="blue">On a trip</StatusPill>}
        </div>
      ),
    },
    { title: "Rentals", dataIndex: "stats", align: "right", render: (st) => <span className="sp-num">{st?.rentals || 0}</span> },
    { title: "Days", dataIndex: "stats", key: "days", align: "right", render: (st) => <span className="sp-num">{st?.days || 0}</span> },
    { title: "Supplier earned (ETB)", dataIndex: "stats", key: "earned", align: "right", render: (st) => <span className="sp-num">{money(st?.earned)}</span> },
  ];

  const rentalColumns = [
    {
      title: "Request",
      dataIndex: "request",
      render: (r) => (
        <div>
          <div className="sp-name">{r.trackingCode}</div>
          <div className="sp-sub">{r.contactName}</div>
        </div>
      ),
    },
    {
      title: "Car",
      dataIndex: "car",
      render: (c) => (
        <div>
          <div className="sp-name">{carTitle(c)}</div>
          <div className="sp-sub">{c.licensePlate}</div>
        </div>
      ),
    },
    {
      title: "Dates",
      dataIndex: "request",
      key: "dates",
      render: (r) => (
        <div>
          <div className="sp-name" style={{ fontWeight: 500 }}>{dayjs(r.pickupDate).format("DD MMM YYYY")}</div>
          <div className="sp-sub">{r.days} day{r.days > 1 ? "s" : ""}</div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "request",
      key: "status",
      render: (r) => <StatusPill tone={STATUS[r.status]?.tone}>{STATUS[r.status]?.label || r.status}</StatusPill>,
    },
    { title: "Customer price", dataIndex: "price", align: "right", render: (v) => <span className="sp-num">{money(v)}</span> },
    {
      title: "Wheellol keeps",
      dataIndex: "commissionAmount",
      align: "right",
      render: (v) => <span className="sp-num" style={{ color: "#c2410c" }}>{money(v)}</span>,
      /* Old: showed the commission % under the amount
      render: (v, r) => (
        <div>
          <div className="sp-num" style={{ color: "#c2410c" }}>{money(v)}</div>
          {r.commissionRate !== null && r.commissionRate !== undefined && <div className="sp-sub">{pct(r.commissionRate)}</div>}
        </div>
      ),
      */
    },
    { title: "Supplier gets", dataIndex: "supplierAmount", align: "right", render: (v) => <span className="sp-num" style={{ color: "#047857" }}>{money(v)}</span> },
  ];

  return (
    <Page>
      {editing && (
        <CommissionModal
          supplier={s}
          globalPercent={s.commission?.global}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            load();
          }}
        />
      )}
      {openCar && (
        <ReviewModal
          car={{ ...openCar, host: s }}
          onClose={() => setOpenCar(null)}
          onDone={() => {
            setOpenCar(null);
            load();
          }}
        />
      )}

      <PageHeader
        back="/dash/suppliers"
        eyebrow="Supplier"
        title={name}
        subtitle={s.hostProfile?.businessName ? `${s.firstName} ${s.lastName}` : "Car owner"}
        actions={
          <>
            <ReloadBtn onClick={load} loading={loading} />
            <Btn variant="primary" icon={<PlusOutlined />} onClick={() => navigate(`/dash/suppliers/${id}/add-car`)}>
              Add car
            </Btn>
            {/* Commission % removed — supplier price is agreed per booking
            <Btn icon={<PercentageOutlined />} onClick={() => setEditing(true)}>
              Commission {pct(s.commission?.effective)}
            </Btn>
            */}
          </>
        }
      />

      <StatsStrip
        items={[
          { label: "Rentals", value: s.totals?.rentals || 0, note: "Approved, on trip or completed", color: "#09234c" },
          { label: "Customers paid", value: money(s.totals?.customerPaid), note: "ETB, agreed prices", color: "#1d4f91" },
          { label: "Wheellol keeps", value: money(s.totals?.commission), note: "ETB", color: "#fc6b38" },
          { label: "Supplier share", value: money(s.totals?.supplier), note: "ETB", color: "#059669" },
        ]}
      />

      <div className="mp-detail">
        <div className="mp-detail-main" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Cars" extra={<span className="mp-tab-count">{s.cars?.length || 0}</span>} bodyClass="">
            <Table
              rowKey="id"
              dataSource={s.cars}
              columns={carColumns}
              pagination={false}
              scroll={{ x: 640 }}
              onRow={(c) => ({ onClick: () => navigate(`/dash/supplier-cars/${c.id}`), style: { cursor: "pointer" } })}
              locale={{ emptyText: <EmptyState icon={<CarOutlined />} title="No cars yet" /> }}
            />
          </Card>

          <Card title="Rentals" subtitle="Only Wheellol sees the customer price and what Wheellol keeps" bodyClass="">
            <Table
              rowKey="id"
              dataSource={s.rentals}
              columns={rentalColumns}
              pagination={{ pageSize: 10, hideOnSinglePage: true }}
              scroll={{ x: 820 }}
              onRow={(r) => ({ onClick: () => navigate(`/dash/requests/${r.request.id}`), style: { cursor: "pointer" } })}
              locale={{ emptyText: <EmptyState title="No rentals yet" text="Rentals show here once a request with their car is approved." /> }}
            />
          </Card>
        </div>

        <aside className="mp-detail-side" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Contact">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <Avatar name={name} src={s.profilePhoto} size={44} />
              <div>
                <div className="sp-name">{s.firstName} {s.lastName}</div>
                <a className="sp-sub" href={`tel:${s.phone}`}><PhoneOutlined /> {s.phone}</a>
              </div>
            </div>
            <InfoGrid
              cols={1}
              items={[
                { label: "Business name", value: s.hostProfile?.businessName },
                { label: "Email", value: s.email },
                { label: "Joined", value: dayjs(s.createdAt).format("DD MMM YYYY") },
                {
                  label: "Account",
                  value: !s.isActive ? "Inactive" : s.isVerified ? "Phone verified" : "Phone not verified",
                },
                {
                  label: "National ID",
                  value: s.hostProfile?.nationalId ? (
                    <a href={s.hostProfile.nationalId} target="_blank" rel="noreferrer">
                      <IdcardOutlined /> View document
                    </a>
                  ) : (
                    "Not uploaded"
                  ),
                },
              ]}
            />
          </Card>
          {/* Commission % removed (2026-11-14): the supplier price is set in each booking's agreement
          <Card title="Commission">
            <div className="sp-num" style={{ fontSize: 26 }}>{pct(s.commission?.effective)}</div>
            <div className="sp-sub" style={{ marginBottom: 12 }}>
              {custom ? `Custom rate (default is ${pct(s.commission?.global)})` : "Using the default rate"}
            </div>
            <Btn onClick={() => setEditing(true)}>Change</Btn>
          </Card>
          */}
        </aside>
      </div>
    </Page>
  );
};

export default SupplierDetails;

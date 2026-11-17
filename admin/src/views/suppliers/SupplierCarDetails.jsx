// One supplier car: photos, details, approve / reject (approve again after a reject),
// admin edit of any field or photo, rentals and the full history.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AutoComplete, Form, Input, InputNumber, Modal, Select, Spin, Switch, Table, message } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  HistoryOutlined,
  UserOutlined,
  PhoneOutlined,
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { Car } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import CommonModal from "../../components/commons/CommonModel";
import {
  Page,
  PageHeader,
  Btn,
  ReloadBtn,
  Card,
  StatusPill,
  InfoGrid,
  Avatar,
  EmptyState,
} from "../../components/modern/ModernUI";
import SupplierService, { APPROVAL, supplierName } from "./SupplierService";
import carsService from "../cars/CarsService";
import CartypesService from "../cartypes/CartypesService";
import LocationService from "../locations/LocationService";
import { STATUS } from "../rental-requests/rentalRequestHelpers";
import "./suppliers.css";
import {
  CarDocumentsEditor,
  CarPhotosEditor,
  PHOTO_SLOTS,
  appendCarFiles,
  carFilesFromCar,
} from "../../components/carFiles/CarFiles";

// Order of the 6 required supplier photos (same as the app + backend)
const PHOTO_LABELS = ["Front", "Back", "Left side", "Right side", "Inside – front", "Inside – back"];
// const MAX_PHOTOS = 10;
const MAX_PHOTOS = 20;

const carTitle = (c) => [c?.make?.name, c?.model?.name, c?.year].filter(Boolean).join(" ");
const money = (n) =>
  n === null || n === undefined ? "—" : Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
const when = (d) => (d ? dayjs(d).format("DD MMM YYYY, HH:mm") : "—");

const EVENT_META = {
  CREATED: { color: "#1d4f91", label: "Added" },
  UPDATED: { color: "#f59e0b", label: "Edited by supplier" },
  ADMIN_UPDATED: { color: "#7c3aed", label: "Edited by admin" },
  APPROVED: { color: "#059669", label: "Approved" },
  REJECTED: { color: "#dc2626", label: "Rejected" },
  HIDDEN: { color: "#64748b", label: "Hidden" },
  SHOWN: { color: "#0ea5e9", label: "Visible" },
};

const actorName = (a, car) => {
  if (!a) return "System";
  const name = [a.firstName, a.lastName].filter(Boolean).join(" ") || a.phone;
  if (a.id === car.host?.id) return `${supplierName(car.host)} (supplier)`;
  return `${name} (admin)`;
};

/* ------------------------------------------------------------------ reject */

const RejectModal = ({ car, onClose, onDone }) => {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const approved = car.approvalStatus === "APPROVED";

  const submit = async () => {
    if (!reason.trim()) {
      message.warning("Write why the car is rejected — the supplier will see it");
      return;
    }
    setBusy(true);
    try {
      await SupplierService.review(car.id, "REJECTED", reason.trim());
      message.success(`${carTitle(car)} rejected`);
      onDone();
    } catch (e) {
      /* toast shown by the API interceptor */
    } finally {
      setBusy(false);
    }
  };

  return (
    <CommonModal width={520} isModalOpen setIsModalOpen={onClose} title={approved ? "Unpublish and reject" : "Reject car"}>
      {approved && (
        <div className="sp-reject-note">Customers will no longer see this car until you approve it again.</div>
      )}
      <div className="sp-fact-k" style={{ marginBottom: 6 }}>Why is it rejected? The supplier sees this message.</div>
      <Input.TextArea
        autoFocus
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. Photos are blurry — please add clear photos of the front, back and inside"
      />
      <div className="sp-actions" style={{ marginTop: 16 }}>
        <Btn onClick={onClose} disabled={busy}>Cancel</Btn>
        <Btn variant="danger" icon={<CloseOutlined />} onClick={submit} disabled={busy}>
          Reject car
        </Btn>
      </div>
    </CommonModal>
  );
};

/* ------------------------------------------------------------------ edit */

/**
 * Edit a supplier car — or, with `hostId` and no `car.id`, add a new car for
 * that supplier (used by SupplierCarAdd.jsx).
 */
export const EditCar = ({ car, hostId, onCancel, onSaved }) => {
  const isNew = !car?.id;
  const [form] = Form.useForm();
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [types, setTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  // photos: { url } = saved photo, { file, preview } = new upload
  const [photos, setPhotos] = useState(() => (car.photos || []).map((url) => ({ key: url, url }))); // old list (unused)
  // Photo slots + documents — the admin can fill in what the supplier left out
  const [files, setFiles] = useState(() => carFilesFromCar(car));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    carsService.getBrands().then(setBrands).catch(() => {});
    if (car.makeId) carsService.getModels(car.makeId).then(setModels).catch(() => {});
    CartypesService.searchCartype({ page: 1, limit: 1000 })
      .then((r) => setTypes(r?.data || []))
      .catch(() => {});
    LocationService.list({ pageSize: 200, active: "true" })
      .then((r) => setLocations(r?.data || []))
      .catch(() => {});
  }, [car.makeId]);

  useEffect(() => {
    form.setFieldsValue({
      makeId: car.makeId,
      modelId: car.modelId,
      carTypeId: car.carTypeId,
      year: car.year,
      color: car.color,
      licensePlate: car.licensePlate,
      vin: car.vin,
      transmission: car.transmission,
      mileage: car.mileage,
      seatingCapacity: car.seatingCapacity,
      location: car.location,
      features: car.features || [],
      description: car.description,
      isActive: isNew ? true : car.isActive,
    });
  }, [car, form]);

  // free the preview URLs of new photos
  useEffect(() => () => photos.forEach((p) => p.preview && URL.revokeObjectURL(p.preview)), []); // eslint-disable-line

  const onBrand = async (makeId) => {
    form.setFieldsValue({ modelId: undefined });
    setModels([]);
    try {
      setModels(await carsService.getModels(makeId));
    } catch (e) {
      /* ignore */
    }
  };

  const addFiles = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const room = MAX_PHOTOS - photos.length;
    if (files.length > room) message.warning(`Up to ${MAX_PHOTOS} photos — ${room} more can be added`);
    setPhotos((list) => [
      ...list,
      ...files.slice(0, Math.max(0, room)).map((file, i) => ({
        key: `new-${Date.now()}-${i}`,
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
  };

  const move = (i, dir) =>
    setPhotos((list) => {
      const next = [...list];
      const j = i + dir;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const remove = (i) =>
    setPhotos((list) => {
      const p = list[i];
      if (p.preview) URL.revokeObjectURL(p.preview);
      return list.filter((_, k) => k !== i);
    });

  const save = async (values) => {
    /* Photos are optional now
    if (!photos.length) {
      message.warning("Keep at least one photo");
      return;
    }
    */
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (k === "features") fd.append(k, JSON.stringify(v || []));
      else if (k === "isActive") fd.append(k, v ? "true" : "false");
      else if (v !== undefined && v !== null) fd.append(k, String(v));
      else if (k === "vin" || k === "description") fd.append(k, "");
    });
    /* Old: one ordered list (photoOrder)
    let n = 0;
    const order = photos.map((p) => {
      if (p.url) return p.url;
      fd.append("photos", p.file);
      return `new:${n++}`;
    });
    fd.append("photoOrder", JSON.stringify(order));
    */
    appendCarFiles(fd, files);

    setSaving(true);
    try {
      // const updated = await SupplierService.updateCar(car.id, fd);
      const updated = isNew ? await SupplierService.createCar(hostId, fd) : await SupplierService.updateCar(car.id, fd);
      message.success(isNew ? "Car added" : "Car saved");
      onSaved(updated);
    } catch (e) {
      /* toast shown by the API interceptor */
    } finally {
      setSaving(false);
    }
  };

  const year = new Date().getFullYear() + 1;

  return (
    <Form form={form} layout="vertical" requiredMark={false} onFinish={save}>
      <div className="mp-detail">
        <div className="mp-detail-main">
          <Card title="Photos" subtitle="Photos 1–15 of the photo guide, all optional. Click a box or drop a photo on it.">
            <CarPhotosEditor value={files} onChange={setFiles} />
          </Card>

          <Card title="Papers" subtitle="Photos 16–20: Libre, Bolo, insurance, licence front and back. Photo or PDF, all optional.">
            <CarDocumentsEditor value={files} onChange={setFiles} />
          </Card>

          {/* Old photo list editor (one ordered list with arrows)
          <Card title="Photos" subtitle={`The first ${PHOTO_LABELS.length} are: ${PHOTO_LABELS.join(", ")}. Use the arrows to change the order.`}>
            <div className="sp-gallery sp-gallery-edit">
              {photos.map((p, i) => (
                <div key={p.key} className="sp-photo-edit">
                  <img src={p.url || p.preview} alt={PHOTO_LABELS[i] || "Extra photo"} />
                  <span className="sp-photo-label">{PHOTO_LABELS[i] || "Extra"}{p.file ? " · new" : ""}</span>
                  <div className="sp-photo-tools">
                    <button type="button" title="Move left" disabled={i === 0} onClick={() => move(i, -1)}>
                      <ArrowLeftOutlined />
                    </button>
                    <button type="button" title="Move right" disabled={i === photos.length - 1} onClick={() => move(i, 1)}>
                      <ArrowRightOutlined />
                    </button>
                    <button type="button" title="Remove" className="is-danger" onClick={() => remove(i)}>
                      <DeleteOutlined />
                    </button>
                  </div>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="sp-photo-add">
                  <PlusOutlined />
                  <span>Add photos</span>
                  <input type="file" accept="image/*" multiple hidden onChange={addFiles} />
                </label>
              )}
            </div>
          </Card>

          */}

          <Card title="Car details">
            <div className="mp-grid-form">
              <Form.Item label="Brand" name="makeId" rules={[{ required: true, message: "Choose the brand" }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  onChange={onBrand}
                  options={brands.map((b) => ({ value: b.id, label: b.name }))}
                />
              </Form.Item>
              <Form.Item label="Model" name="modelId" rules={[{ required: true, message: "Choose the model" }]}>
                <Select showSearch optionFilterProp="label" options={models.map((m) => ({ value: m.id, label: m.name }))} />
              </Form.Item>
              <Form.Item label="Car type" name="carTypeId" rules={[{ required: true, message: "Choose the type" }]}>
                <Select showSearch optionFilterProp="label" options={types.map((t) => ({ value: t.id, label: t.name }))} />
              </Form.Item>
              <Form.Item label="Year" name="year" rules={[{ required: true, message: "Enter the year" }]}>
                <InputNumber min={1980} max={year} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="Plate number" name="licensePlate" rules={[{ required: true, message: "Enter the plate" }]}>
                <Input />
              </Form.Item>
              <Form.Item label="Colour" name="color" rules={[{ required: true, message: "Enter the colour" }]}>
                <Input />
              </Form.Item>
              <Form.Item label="Transmission" name="transmission" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: "AUTOMATIC", label: "Automatic" },
                    { value: "MANUAL", label: "Manual" },
                  ]}
                />
              </Form.Item>
              <Form.Item label="Seats" name="seatingCapacity" rules={[{ required: true, message: "Enter the seats" }]}>
                <InputNumber min={1} max={80} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="Mileage (km)" name="mileage">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="Location" name="location">
                <AutoComplete
                  options={locations.map((l) => ({ value: l.name }))}
                  filterOption={(input, o) => o.value.toLowerCase().includes(input.toLowerCase())}
                />
              </Form.Item>
              <Form.Item label="VIN (optional)" name="vin">
                <Input />
              </Form.Item>
            </div>
            <Form.Item label="Features" name="features" extra="Type a feature and press Enter">
              <Select mode="tags" tokenSeparators={[","]} open={false} />
            </Form.Item>
            <Form.Item label="Description" name="description">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Card>
        </div>

        <aside className="mp-detail-side">
          <Card title="Visibility">
            <Form.Item name="isActive" valuePropName="checked" style={{ marginBottom: 6 }}>
              <Switch checkedChildren="Visible" unCheckedChildren="Hidden" />
            </Form.Item>
            <div className="sp-sub">
              Hidden cars are not shown to customers, even when approved. Saving does not change the approval.
            </div>
          </Card>
          <Card title={isNew ? "Add car" : "Save changes"}>
            <div className="sp-sub" style={{ marginBottom: 12 }}>
              {isNew
                ? "The car is added to this supplier and approved straight away. The supplier gets a notification."
                : "The supplier gets a notification listing what you changed. Every change is kept in History."}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn type="button" onClick={onCancel} disabled={saving}>Cancel</Btn>
              <Btn type="submit" variant="primary" icon={<CheckOutlined />} disabled={saving}>
                {saving ? "Saving…" : isNew ? "Add car" : "Save car"}
              </Btn>
            </div>
          </Card>
        </aside>
      </div>
    </Form>
  );
};

/* ------------------------------------------------------------------ history */

const ChangeList = ({ changes }) => (
  <ul className="sp-changes">
    {changes.map((c) => (
      <li key={c.field}>
        <b>{c.label}:</b>{" "}
        {c.field === "photos" ? (
          <span className="sp-change-photos">
            {(c.toList || []).map((u) => (
              <a key={u} href={u} target="_blank" rel="noreferrer">
                <img src={u} alt="" className={(c.fromList || []).includes(u) ? "" : "is-new"} />
              </a>
            ))}
            <span className="sp-sub">
              {c.from} → {c.to}
            </span>
          </span>
        ) : c.field === "description" ? (
          <span className="sp-sub">changed</span>
        ) : (
          <>
            <span className="sp-old">{c.from ?? "—"}</span> → <span>{c.to ?? "—"}</span>
          </>
        )}
      </li>
    ))}
  </ul>
);

const History = ({ car }) => (
  <Card title="History" extra={<HistoryOutlined />}>
    {car.events?.length ? (
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {car.events.map((e) => {
          const meta = EVENT_META[e.type] || { color: "#94a3b8", label: e.type };
          return (
            <li key={e.id} style={{ display: "flex", gap: 14, paddingBottom: 18 }}>
              <span
                style={{
                  width: 10, height: 10, borderRadius: 99, background: meta.color,
                  marginTop: 6, flex: "none", boxShadow: `0 0 0 4px ${meta.color}22`,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600 }}>{e.message}</span>
                </div>
                {e.details?.changes?.length > 0 && <ChangeList changes={e.details.changes} />}
                <div className="mp-cell-sub">
                  {meta.label} · {actorName(e.actor, car)} · {when(e.createdAt)}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    ) : (
      <EmptyState
        icon={<HistoryOutlined />}
        title="No history yet"
        text="Reviews and changes made from now on will appear here."
      />
    )}
  </Card>
);

/* ------------------------------------------------------------------ page */

const SupplierCarDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("details");
  const [editing, setEditing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCar(await SupplierService.getCar(id));
    } catch (e) {
      /* toast shown by the API interceptor */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = () => {
    const again = car.approvalStatus === "REJECTED";
    Modal.confirm({
      title: again ? "Approve this car again?" : "Approve this car?",
      content: (
        <div>
          {again && car.rejectionReason && (
            <div className="sp-reject-note" style={{ marginBottom: 10 }}>
              <b>It was rejected for:</b> {car.rejectionReason}
            </div>
          )}
          Customers will be able to see and book <b>{carTitle(car)}</b> ({car.licensePlate}). The supplier gets a
          notification.
        </div>
      ),
      okText: again ? "Yes, approve again" : "Yes, approve",
      cancelText: "Cancel",
      onOk: async () => {
        setBusy(true);
        try {
          await SupplierService.review(car.id, "APPROVED");
          message.success(`${carTitle(car)} approved — customers can book it now`);
          await load();
        } catch (e) {
          /* toast shown by the API interceptor */
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const rentalColumns = useMemo(
    () => [
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
      { title: "Wheellol keeps", dataIndex: "commissionAmount", align: "right", render: (v) => <span className="sp-num" style={{ color: "#c2410c" }}>{money(v)}</span> },
      { title: "Supplier gets", dataIndex: "supplierAmount", align: "right", render: (v) => <span className="sp-num" style={{ color: "#047857" }}>{money(v)}</span> },
    ],
    [],
  );

  if (!car) {
    return (
      <Page>
        <div style={{ display: "grid", placeItems: "center", minHeight: 300 }}>
          {loading ? <Spin /> : <EmptyState icon={<Car />} title="Car not found" />}
        </div>
      </Page>
    );
  }

  const status = car.approvalStatus;
  const facts = [
    ["Plate", car.licensePlate],
    ["Type", car.carType?.name],
    ["Seats", car.seatingCapacity],
    ["Transmission", car.transmission === "AUTOMATIC" ? "Automatic" : "Manual"],
    ["Colour", car.color],
    ["Mileage", car.mileage ? `${Number(car.mileage).toLocaleString()} km` : "—"],
    ["Location", car.location],
    ["VIN", car.vin || "—"],
  ];

  const decisionButtons = !editing && (
    <>
      {status !== "REJECTED" && (
        <Btn icon={<CloseOutlined />} onClick={() => setRejecting(true)} disabled={busy}>
          {status === "APPROVED" ? "Unpublish / reject" : "Reject"}
        </Btn>
      )}
      {status !== "APPROVED" && (
        <Btn variant="primary" icon={<CheckOutlined />} onClick={approve} disabled={busy}>
          {status === "REJECTED" ? "Approve again" : "Approve — show to customers"}
        </Btn>
      )}
    </>
  );

  return (
    <Page>
      {rejecting && (
        <RejectModal
          car={car}
          onClose={() => setRejecting(false)}
          onDone={() => {
            setRejecting(false);
            load();
          }}
        />
      )}

      <PageHeader
        back="/dash/supplier-cars"
        eyebrow="Supplier car"
        title={carTitle(car)}
        subtitle={[car.licensePlate, car.carType?.name].filter(Boolean).join(" · ")}
        actions={
          <>
            <ReloadBtn onClick={load} loading={loading} />
            {!editing && (
              <Btn
                icon={<EditOutlined />}
                onClick={() => {
                  setTab("details");
                  setEditing(true);
                }}
              >
                Edit car
              </Btn>
            )}
            {decisionButtons}
          </>
        }
      />

      <div className="mp-card" style={{ marginBottom: 20, padding: 0 }}>
        <div className="mp-tabs">
          <button className={`mp-tab ${tab === "details" ? "is-active" : ""}`} onClick={() => setTab("details")}>
            {editing ? "Edit car" : "Details"}
          </button>
          <button className={`mp-tab ${tab === "rentals" ? "is-active" : ""}`} onClick={() => setTab("rentals")}>
            Rentals <span className="mp-tab-count">{car.rentals?.length || 0}</span>
          </button>
          <button className={`mp-tab ${tab === "history" ? "is-active" : ""}`} onClick={() => setTab("history")}>
            History <span className="mp-tab-count">{car.events?.length || 0}</span>
          </button>
        </div>
      </div>

      {tab === "history" && <History car={car} />}

      {tab === "rentals" && (
        <Card title="Rentals" subtitle="Every booking request with this car" bodyClass="">
          <Table
            rowKey="id"
            dataSource={car.rentals}
            columns={rentalColumns}
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            scroll={{ x: 720 }}
            onRow={(r) => ({ onClick: () => navigate(`/dash/requests/${r.request.id}`), style: { cursor: "pointer" } })}
            locale={{ emptyText: <EmptyState title="No rentals yet" text="Requests with this car show here." /> }}
          />
        </Card>
      )}

      {tab === "details" && editing && (
        <EditCar
          car={car}
          onCancel={() => setEditing(false)}
          onSaved={(updated) => {
            setCar(updated);
            setEditing(false);
          }}
        />
      )}

      {tab === "details" && !editing && (
        <div className="mp-detail">
          <div className="mp-detail-main">
            <Card title="Photos" extra={<span className="mp-tab-count">{car.photos?.length || 0}</span>}>
              {car.photos?.length ? (
                <div className="sp-gallery" style={{ marginBottom: 0 }}>
                  {car.photos.map((p, i) => {
                    // label from the saved slots (old cars: by position)
                    const slot = car.photoSlots
                      ? PHOTO_SLOTS.find((s) => car.photoSlots[s.key] === p)?.label
                      : PHOTO_LABELS[i];
                    return (
                      <a key={p} href={p} target="_blank" rel="noreferrer" title={slot || "Extra photo"}>
                        <img src={p} alt={slot || "Extra photo"} />
                        <span className="sp-photo-label">{slot || "Extra"}</span>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={<Car />} title="No photos" />
              )}
            </Card>

            <Card
              title="Documents"
              subtitle="Missing documents can be added with Edit"
            >
              <CarDocumentsEditor value={carFilesFromCar(car)} readOnly />
            </Card>

            <Card title="Car details">
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
              {car.description && (
                <p style={{ color: "var(--c-text-2)", fontSize: 13.5, margin: 0 }}>{car.description}</p>
              )}
            </Card>
          </div>

          <aside className="mp-detail-side">
            <Card title="Status">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                <StatusPill tone={APPROVAL[status]?.tone}>{APPROVAL[status]?.label}</StatusPill>
                {!car.isActive && <StatusPill tone="gray">Hidden</StatusPill>}
                {car.stats?.onTrip && <StatusPill tone="blue">On a trip</StatusPill>}
              </div>
              {status === "REJECTED" && car.rejectionReason && (
                <div className="sp-reject-note">
                  <b>Rejected:</b> {car.rejectionReason}
                </div>
              )}
              <InfoGrid
                cols={1}
                items={[
                  { label: "Sent for review", value: when(car.submittedAt || car.createdAt) },
                  { label: "Last review", value: when(car.reviewedAt) },
                  { label: "Rentals", value: `${car.stats?.rentals || 0} · ${car.stats?.days || 0} days` },
                ]}
              />
              {!editing && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>{decisionButtons}</div>
              )}
            </Card>

            {car.host && (
              <Card title="Supplier">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <Avatar name={supplierName(car.host)} src={car.host.profilePhoto} size={44} />
                  <div>
                    <div className="sp-name">{supplierName(car.host)}</div>
                    <a className="sp-sub" href={`tel:${car.host.phone}`}>
                      <PhoneOutlined /> {car.host.phone}
                    </a>
                  </div>
                </div>
                <Btn icon={<UserOutlined />} onClick={() => navigate(`/dash/suppliers/${car.host.id}`)}>
                  Open supplier
                </Btn>
              </Card>
            )}
          </aside>
        </div>
      )}
    </Page>
  );
};

export default SupplierCarDetails;

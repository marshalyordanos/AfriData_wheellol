import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Spin,
  Table,
  message,
} from "antd";
import {
  DeleteOutlined,
  MailOutlined,
  PhoneOutlined,
  CheckOutlined,
  PlusOutlined,
  CarOutlined,
  RightOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import {
  Page,
  PageHeader,
  Card,
  FormSection,
  StatusPill,
  Avatar,
  KeyValueList,
  TwoLine,
  EmptyState,
} from "../../components/modern/ModernUI";
import RecordPaymentModal from "./RecordPaymentModal";
import { RequestStatus } from "./RentalRequestList";
import dayjs from "dayjs";
import RentalRequestService, {
  MILESTONES,
  NEEDS_PRICE,
  PAYMENT_METHODS,
  STATUS,
  STATUS_ORDER,
  carName,
  etb,
  methodLabel,
} from "./rentalRequestHelpers";

const EVENT_META = {
  CREATED: { color: "#1d4f91" },
  STATUS_CHANGED: { color: "#7c3aed" },
  PRICE_CHANGED: { color: "#fc6b38" },
  NOTE_CHANGED: { color: "#94a3b8" },
  DATES_CHANGED: { color: "#f59e0b" },
  PAYMENT_ADDED: { color: "#059669" },
  PAYMENT_REMOVED: { color: "#b42318" },
};

const RentalRequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [tab, setTab] = useState("details");
  const [dealForm] = Form.useForm();
  const [payForm] = Form.useForm();

  const apply = (data) => {
    setReq(data);
    dealForm.setFieldsValue({
      status: data.status,
      totalPrice: data.totalPrice ?? null,
      adminNote: data.adminNote ?? "",
    });
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        apply(await RentalRequestService.get(id));
      } catch {
        // toast handled by api interceptor
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const saveDeal = async (values) => {
    setSaving(true);
    try {
      const data = await RentalRequestService.update(id, {
        status: values.status,
        totalPrice:
          values.totalPrice === null || values.totalPrice === undefined
            ? undefined
            : values.totalPrice,
        adminNote: values.adminNote ?? "",
      });
      apply(data);
      message.success("Saved");
    } catch {
      // toast handled by api interceptor
    } finally {
      setSaving(false);
    }
  };

  const quickStatus = async (status, okText) => {
    setSaving(true);
    try {
      apply(await RentalRequestService.update(id, { status }));
      message.success(okText);
    } catch {
      // toast handled by api interceptor
    } finally {
      setSaving(false);
    }
  };

  const addPayment = async (values) => {
    setPaying(true);
    try {
      const data = await RentalRequestService.addPayment(id, {
        amount: values.amount,
        method: values.method,
        reference: values.reference || undefined,
        note: values.note || undefined,
        paidAt: values.paidAt ? values.paidAt.toISOString() : undefined,
      });
      apply(data);
      payForm.resetFields();
      payForm.setFieldsValue({ method: values.method, paidAt: dayjs() });
      message.success("Payment recorded");
    } catch {
      // toast handled by api interceptor
    } finally {
      setPaying(false);
    }
  };

  const removePayment = async (paymentId) => {
    try {
      apply(await RentalRequestService.deletePayment(id, paymentId));
      message.success("Payment removed");
    } catch {
      // toast handled by api interceptor
    }
  };

  if (loading) {
    return (
      <Page>
        <div className="flex justify-center p-16">
          <Spin size="large" />
        </div>
      </Page>
    );
  }
  if (!req)
    return (
      <Page>
        <EmptyState title="Request not found" text="It may have been removed." />
      </Page>
    );

  const hasPrice = req.totalPrice > 0;
  const nextMilestone = hasPrice ? MILESTONES.find((m) => req.paidPercent < m.percent) : null;
  const toNextMilestone = nextMilestone
    ? Math.max(Math.round(((nextMilestone.percent / 100) * req.totalPrice - req.paidAmount) * 100) / 100, 0)
    : 0;
  const isCancelled = req.status === "CANCELLED";
  const flow = STATUS_ORDER.filter((s) => s !== "CANCELLED");
  const stepIdx = flow.indexOf(req.status);
  const paidPct = Math.min(100, Math.round(req.paidPercent || 0));

  const paymentColumns = [
    {
      title: "Date",
      dataIndex: "paidAt",
      render: (d) => <TwoLine main={dayjs(d).format("DD MMM YYYY")} sub={dayjs(d).format("HH:mm")} />,
    },
    { title: "Amount", dataIndex: "amount", align: "right", render: (v) => <span className="mp-price">{etb(v)}</span> },
    {
      title: "Share",
      render: (_, p) => (hasPrice ? `${Math.round((p.amount / req.totalPrice) * 1000) / 10}%` : "—"),
    },
    { title: "Method", dataIndex: "method", render: (m) => <StatusPill tone="gray">{methodLabel(m)}</StatusPill> },
    {
      title: "Receipt",
      dataIndex: "receiptUrl",
      render: (u) =>
        u ? (
          <a href={u} target="_blank" rel="noreferrer">
            View
          </a>
        ) : (
          <span className="mp-muted">—</span>
        ),
    },
    { title: "Reference", dataIndex: "reference", render: (v) => v || <span className="mp-muted">—</span> },
    {
      title: "Recorded by",
      dataIndex: "recordedBy",
      render: (u) => (u ? `${u.firstName} ${u.lastName}` : <span className="mp-muted">—</span>),
    },
    { title: "Note", dataIndex: "note", render: (v) => v || <span className="mp-muted">—</span> },
    {
      title: "",
      align: "right",
      render: (_, p) => (
        <Popconfirm
          title="Remove this payment?"
          okText="Remove"
          okButtonProps={{ danger: true }}
          onConfirm={() => removePayment(p.id)}
        >
          <button className="mp-iconbtn" aria-label="Remove payment" style={{ color: "#b42318" }}>
            <DeleteOutlined />
          </button>
        </Popconfirm>
      ),
    },
  ];

  const money = (n) => `${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

  return (
    <Page>
      <PageHeader
        back="/dash/requests"
        eyebrow="Booking request"
        title={
          <span className="flex items-center gap-3 flex-wrap">
            {req.trackingCode}
            <RequestStatus status={req.status} />
          </span>
        }
        subtitle={`Requested ${dayjs(req.createdAt).format("dddd, DD MMM YYYY · HH:mm")}`}
        actions={
          <>
            {["PENDING", "UNDER_NEGOTIATION", "APPROVED"].includes(req.status) && (
              <Popconfirm
                title="Start the trip?"
                description={
                  hasPrice ? "The car is handed over and the trip begins." : "Set the agreed price first."
                }
                okText="Start trip"
                disabled={!hasPrice}
                onConfirm={() => quickStatus("ACTIVE", "Trip started")}
              >
                <Button type="primary" loading={saving} disabled={!hasPrice} icon={<CarOutlined />}>
                  Start trip
                </Button>
              </Popconfirm>
            )}
            {req.status === "ACTIVE" && (
              <Popconfirm
                title="Mark as completed?"
                description={
                  req.balance > 0 ? `${etb(req.balance)} is still unpaid.` : "The trip is finished."
                }
                okText="Complete"
                onConfirm={() => quickStatus("COMPLETED", "Request completed")}
              >
                <Button type="primary" loading={saving} icon={<CheckOutlined />}>
                  Mark completed
                </Button>
              </Popconfirm>
            )}
            {req.contactEmail && (
              <a className="mp-btn" href={`mailto:${req.contactEmail}`}>
                <MailOutlined /> Email
              </a>
            )}
            <a className="mp-btn mp-btn-primary" href={`tel:${req.contactPhone}`}>
              <PhoneOutlined /> Call {req.contactName?.split(" ")[0] || "customer"}
            </a>
          </>
        }
      />

      {/* Progress stepper */}
      <div className="mp-card" style={{ marginBottom: 20, overflowX: "auto" }}>
        <ol className="mp-steps">
          {flow.map((s, i) => {
            const state = isCancelled ? "todo" : i < stepIdx ? "done" : i === stepIdx ? "current" : "todo";
            return (
              <li key={s} className={`mp-step is-${state}`}>
                <span className="mp-step-dot">{state === "done" ? <CheckOutlined /> : i + 1}</span>
                <span className="mp-step-label">{STATUS[s].label}</span>
                {i < flow.length - 1 && <span className="mp-step-line" />}
              </li>
            );
          })}
          {isCancelled && (
            <li className="mp-step">
              <StatusPill tone="red">Cancelled</StatusPill>
            </li>
          )}
        </ol>
      </div>

      <div className="mp-card" style={{ marginBottom: 20, padding: 0 }}>
        <div className="mp-tabs">
          <button className={`mp-tab ${tab === "details" ? "is-active" : ""}`} onClick={() => setTab("details")}>
            Details
          </button>
          <button className={`mp-tab ${tab === "history" ? "is-active" : ""}`} onClick={() => setTab("history")}>
            History <span className="mp-tab-count">{req.events?.length || 0}</span>
          </button>
        </div>
      </div>

      {tab === "history" && (
        <Card title="History" extra={<HistoryOutlined />}>
          {req.events?.length ? (
            <ol className="mp-history" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {req.events.map((e) => {
                const meta = EVENT_META[e.type] || { color: "#94a3b8" };
                const who = e.actor ? `${e.actor.firstName} ${e.actor.lastName}` : e.type === "CREATED" ? req.contactName : "System";
                return (
                  <li key={e.id} style={{ display: "flex", gap: 14, paddingBottom: 18 }}>
                    <span
                      style={{
                        width: 10, height: 10, borderRadius: 99, background: meta.color,
                        marginTop: 6, flex: "none", boxShadow: `0 0 0 4px ${meta.color}22`,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{e.message}</div>
                      {e.type === "NOTE_CHANGED" && e.details?.to && (
                        <div className="mp-note" style={{ marginTop: 6 }}>{e.details.to}</div>
                      )}
                      {e.type === "PAYMENT_ADDED" && e.details?.reference && (
                        <div className="mp-cell-sub">Ref: {e.details.reference}</div>
                      )}
                      <div className="mp-cell-sub">
                        {who} · {dayjs(e.createdAt).format("DD MMM YYYY · HH:mm")}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <EmptyState title="No history yet" text="Changes made to this request will appear here." />
          )}
        </Card>
      )}

      <div className="mp-detail" style={{ display: tab === "details" ? undefined : "none" }}>
        {/* ---------- Main: deal + payments ---------- */}
        <div className="mp-detail-main">
          <FormSection num={1} title="Agreement" subtitle="Price and status agreed with the customer and car owner">
            <Form form={dealForm} layout="vertical" onFinish={saveDeal} requiredMark={false}>
              <div className="mp-grid-form">
                <Form.Item
                  label="Agreed total price (ETB)"
                  name="totalPrice"
                  extra={
                    req.paidAmount > 0
                      ? `Cannot be lower than paid: ${etb(req.paidAmount)}`
                      : "Fill after calling the customer and the car owner"
                  }
                >
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    placeholder="e.g. 100000"
                    addonAfter="ETB"
                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(v) => v?.replace(/,/g, "")}
                  />
                </Form.Item>
                <Form.Item
                  label="Status"
                  name="status"
                  dependencies={["totalPrice"]}
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const price = getFieldValue("totalPrice");
                        if (NEEDS_PRICE.includes(value) && !(price > 0)) {
                          return Promise.reject(new Error("Set the agreed price first"));
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <Select options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS[s].label }))} />
                </Form.Item>
              </div>
              <Form.Item label="Internal note (not shown to customer)" name="adminNote">
                <Input.TextArea rows={3} placeholder="Owner rate, driver arrangement, fuel, start time…" />
              </Form.Item>
              <div className="flex justify-end">
                <Button type="primary" htmlType="submit" loading={saving} size="large">
                  Save agreement
                </Button>
              </div>
            </Form>
          </FormSection>

          <FormSection
            num={2}
            title="Payments"
            subtitle="Every payment received for this request"
            extra={hasPrice && req.balance <= 0 ? <StatusPill tone="green">Fully paid</StatusPill> : null}
          >
            {!hasPrice && (
              <Alert
                type="info"
                showIcon
                message="Set the agreed price to see the percentage paid. You can still record payments."
              />
            )}

            <div className="mp-strip" style={{ marginBottom: 0 }}>
              <div className="mp-strip-item">
                <div className="mp-strip-label"><span className="mp-dot" style={{ background: "#09234c" }} />Agreed price</div>
                <div className="mp-strip-value">{hasPrice ? money(req.totalPrice) : "—"}</div>
                <div className="mp-strip-note">ETB</div>
              </div>
              <div className="mp-strip-item">
                <div className="mp-strip-label"><span className="mp-dot" style={{ background: "#059669" }} />Paid</div>
                <div className="mp-strip-value">{money(req.paidAmount)}</div>
                <div className="mp-strip-note">{req.payments?.length || 0} payment{req.payments?.length === 1 ? "" : "s"}</div>
              </div>
              <div className="mp-strip-item">
                <div className="mp-strip-label"><span className="mp-dot" style={{ background: "#fc6b38" }} />Balance</div>
                <div className="mp-strip-value">{hasPrice ? money(req.balance) : "—"}</div>
                <div className="mp-strip-note">Still to collect</div>
              </div>
            </div>

            {hasPrice && (
              <div>
                <div className="flex justify-between" style={{ fontSize: 13, marginBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>{paidPct}% paid</span>
                  {nextMilestone && (
                    <span className="mp-cell-sub" style={{ marginTop: 0 }}>
                      Next: {nextMilestone.label} — {etb(toNextMilestone)} to reach {nextMilestone.percent}%
                    </span>
                  )}
                </div>
                <div className="mp-milestones">
                  <div className="track">
                    <span style={{ width: `${paidPct}%` }} />
                  </div>
                  {MILESTONES.map((m) => (
                    <span
                      key={m.percent}
                      className={`mark ${req.paidPercent >= m.percent ? "is-done" : ""}`}
                      style={{ left: `${m.percent}%` }}
                    >
                      <i />
                      <b>{m.label}</b>
                      <em>{m.percent}%</em>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mp-ctable">
              <div className="mp-table">
                <Table
                  rowKey="id"
                  columns={paymentColumns}
                  dataSource={req.payments}
                  pagination={false}
                  scroll={{ x: "max-content" }}
                  locale={{ emptyText: <div className="mp-empty">No payments recorded yet</div> }}
                />
              </div>
            </div>

            {!isCancelled && !(hasPrice && req.balance <= 0) && (
              <div className="flex justify-end">
                <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setPayOpen(true)}>
                  Record payment
                </Button>
              </div>
            )}
            <RecordPaymentModal request={req} open={payOpen} onClose={() => setPayOpen(false)} onSaved={apply} />
            {/* Old inline payment form (kept, hidden — replaced by the modal above)
            {!isCancelled && !(hasPrice && req.balance <= 0) && (
              <div className="mp-subcard">
                <Form
                  form={payForm}
                  layout="vertical"
                  onFinish={addPayment}
                  initialValues={{ method: "CASH", paidAt: dayjs() }}
                  requiredMark={false}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap" style={{ marginBottom: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Record a payment</div>
                    {hasPrice && (
                      <div className="flex flex-wrap gap-2">
                        {nextMilestone && toNextMilestone > 0 && (
                          <Button size="small" onClick={() => payForm.setFieldsValue({ amount: toNextMilestone })}>
                            To {nextMilestone.percent}% · {etb(toNextMilestone)}
                          </Button>
                        )}
                        <Button size="small" onClick={() => payForm.setFieldsValue({ amount: req.balance })}>
                          Full balance · {etb(req.balance)}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="mp-grid-form" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                    <Form.Item
                      label="Amount (ETB)"
                      name="amount"
                      rules={[{ required: true, message: "Enter the amount" }]}
                      extra={
                        hasPrice ? (
                          <Form.Item noStyle shouldUpdate>
                            {({ getFieldValue }) => {
                              const a = getFieldValue("amount");
                              return a > 0 ? `${Math.round((a / req.totalPrice) * 1000) / 10}% of price` : null;
                            }}
                          </Form.Item>
                        ) : null
                      }
                    >
                      <InputNumber
                        min={0.01}
                        max={hasPrice ? req.balance : undefined}
                        style={{ width: "100%" }}
                        formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        parser={(v) => v?.replace(/,/g, "")}
                      />
                    </Form.Item>
                    <Form.Item label="Method" name="method" rules={[{ required: true }]}>
                      <Select options={PAYMENT_METHODS} />
                    </Form.Item>
                    <Form.Item label="Date" name="paidAt">
                      <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item label="Reference / receipt no." name="reference">
                      <Input placeholder="Optional" />
                    </Form.Item>
                    <Form.Item label="Note" name="note">
                      <Input placeholder="Optional" />
                    </Form.Item>
                  </div>
                  <div className="flex justify-end">
                    <Button type="primary" htmlType="submit" loading={paying} icon={<PlusOutlined />} size="large">
                      Add payment
                    </Button>
                  </div>
                </Form>
              </div>
            )}
            */}
          </FormSection>
        </div>

        {/* ---------- Side: who + what ---------- */}
        <aside className="mp-detail-side">
          <Card title="Customer">
            <div className="mp-cell" style={{ marginBottom: 16 }}>
              <Avatar name={req.contactName} size={44} />
              <div>
                <div className="mp-cell-main" style={{ fontSize: 15 }}>{req.contactName}</div>
                <div style={{ marginTop: 4 }}>
                  {req.customer ? (
                    <StatusPill tone="green">Signed-in customer</StatusPill>
                  ) : (
                    <StatusPill tone="gray">Guest · no account</StatusPill>
                  )}
                </div>
              </div>
            </div>
            <KeyValueList
              rows={[
                { label: "Phone", value: <a href={`tel:${req.contactPhone}`}>{req.contactPhone}</a> },
                {
                  label: "Email",
                  value: req.contactEmail ? <a href={`mailto:${req.contactEmail}`}>{req.contactEmail}</a> : "—",
                },
              ]}
            />
          </Card>

          <Card title="Trip" extra={<StatusPill tone="blue">{req.days} day{req.days > 1 ? "s" : ""}</StatusPill>}>
            <div className="mp-timeline" style={{ marginBottom: 16 }}>
              <div className="mp-timeline-rail">
                <span className="a" />
                <span className="l" />
                <span className="b" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 13.5 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{dayjs(req.pickupDate).format("ddd, DD MMM YYYY")}</div>
                  <div className="mp-cell-sub">Pickup in {req.pickupCity}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{req.destinations?.join(", ") || "—"}</div>
                  <div className="mp-cell-sub">Destination{req.destinations?.length > 1 ? "s" : ""}</div>
                </div>
              </div>
            </div>
            <KeyValueList
              rows={[
                { label: "Purpose", value: req.purpose || "—" },
                { label: "Rural kebeles", value: req.ruralAccess ? "Yes" : "No" },
              ]}
            />
            {req.note && (
              <div className="mp-note">
                <div className="mp-note-k">Customer note</div>
                {req.note}
              </div>
            )}
          </Card>

          <Card title={`Cars requested`} extra={<span className="mp-tab-count">{req.cars?.length || 0}</span>}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {req.cars?.map(({ car }) => (
                <button
                  key={car.id}
                  className="mp-carrow"
                  onClick={() => navigate(`/dash/cars/details/${car.id}`)}
                >
                  {car.photos?.[0] ? (
                    <img src={car.photos[0]} alt="" />
                  ) : (
                    <span className="ph">
                      <CarOutlined />
                    </span>
                  )}
                  <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <span className="mp-cell-main" style={{ display: "block" }}>{carName(car)}</span>
                    <span className="mp-cell-sub" style={{ display: "block" }}>
                      {[car.carType?.name, car.seatingCapacity && `${car.seatingCapacity} seats`, car.licensePlate]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <RightOutlined style={{ color: "#94a3b8" }} />
                </button>
              ))}
              {!req.cars?.length && <span className="mp-muted">No cars attached</span>}
            </div>
          </Card>
        </aside>
      </div>
    </Page>
  );
};

export default RentalRequestDetails;

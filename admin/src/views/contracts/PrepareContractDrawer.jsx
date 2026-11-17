// Prepare, send and track the contract of one booking request.
// Step 1: pick a template (default first). Step 2: fill dates, custom fields,
// vehicles & drivers (Schedule A), optionally edit the wording for this
// booking only, preview live, then send it to the customer for e-signature.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  DatePicker,
  Drawer,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Segmented,
  Switch,
  Select,
  Spin,
  Tooltip,
  message,
} from "antd";
import {
  CheckCircleFilled,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileWordOutlined,
  LinkOutlined,
  MessageOutlined,
  PlusOutlined,
  PrinterOutlined,
  SendOutlined,
  StarFilled,
  StopOutlined,
  UndoOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { StatusPill } from "../../components/modern/ModernUI";
import ContractApi, { CONTRACT_STATUS, contractPublicUrl } from "./contractApi";
import { SCHEDULE_COLUMNS, adminFields, buildContext, fieldLabel, fmtMoney, isCustomerField, isVatIncluded, missingKeys, normalizeValues, uid } from "./contractFields";
import { renderContract } from "./renderContract";
import { downloadWord, printContract } from "./printContract";
import DocumentEditor from "./editor/DocumentEditor";
import { EditorBusProvider } from "./editor/EditorBus";
import "./contracts.css";

const LOCKED = ["SIGNED", "VOID"];

/** 0911 22 33 44 → 251911223344 (for wa.me links) */
const intlPhone = (p) => {
  const d = String(p || "").replace(/\D/g, "");
  if (d.startsWith("251")) return d;
  if (d.startsWith("0")) return `251${d.slice(1)}`;
  if (d.length === 9) return `251${d}`;
  return d;
};

export const shareText = (req, c) =>
  `Hello ${req?.contactName || ""}, please review and sign your contract ${c?.contractNo} for booking ${req?.trackingCode}: ${contractPublicUrl(c?.publicToken)}`;

export const ShareLinks = ({ request, contract }) => {
  const url = contractPublicUrl(contract.publicToken);
  const text = shareText(request, contract);
  return (
    <div className="flex flex-col gap-2">
      <div className="ct-sendlink">
        <LinkOutlined />
        <code title={url}>{url}</code>
        <Button
          size="small"
          icon={<CopyOutlined />}
          onClick={() => navigator.clipboard?.writeText(url).then(() => message.success("Link copied"))}
        >
          Copy
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button icon={<WhatsAppOutlined />} href={`https://wa.me/${intlPhone(request?.contactPhone)}?text=${encodeURIComponent(text)}`} target="_blank">
          WhatsApp
        </Button>
        <Button icon={<MessageOutlined />} href={`sms:${request?.contactPhone}?body=${encodeURIComponent(text)}`}>
          SMS
        </Button>
        <Button icon={<CopyOutlined />} onClick={() => navigator.clipboard?.writeText(text).then(() => message.success("Message copied"))}>
          Copy message
        </Button>
        <Button icon={<EyeOutlined />} href={url} target="_blank">
          Open as customer
        </Button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ template picker */
const TemplatePicker = ({ onPick, busy }) => {
  const [list, setList] = useState(null);
  useEffect(() => {
    ContractApi.listTemplates()
      .then(setList)
      .catch(() => setList([]));
  }, []);
  if (!list) {
    return (
      <div className="flex justify-center p-16">
        <Spin />
      </div>
    );
  }
  return (
    <div>
      <div style={{ padding: "18px 22px 0" }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Which contract should this booking use?</div>
        <div className="ct-muted ct-small">
          The contract is filled from the booking (customer, cars, dates, price). You can change any detail before sending.{" "}
          <a href="/dash/contracts" target="_blank" rel="noreferrer">
            Manage contracts
          </a>
        </div>
      </div>
      <div className="ct-pick">
        {list.map((t) => (
          <article key={t.id} className="ct-card">
            <div className="ct-ribbon">
              {t.isDefault && (
                <StatusPill tone="orange">
                  <StarFilled /> Recommended
                </StatusPill>
              )}
            </div>
            <div className="ct-thumb" onClick={() => !busy && onPick(t)} role="button" tabIndex={0}>
              <div
                className="ct-thumb-page"
                dangerouslySetInnerHTML={{ __html: renderContract({ document: t.document, request: null, contract: { contractNo: "WCR/CRA/001/2026" } }) }}
              />
            </div>
            <div className="ct-card-b">
              <div className="ct-card-t">{t.title}</div>
              {t.description && <div className="ct-card-d">{t.description}</div>}
              <div className="ct-card-meta">
                <span className="ct-tag">{t.stats?.articles || 0} articles</span>
                {t.stats?.fields > 0 && <span className="ct-tag">{t.stats.fields} fields to fill</span>}
              </div>
            </div>
            <div className="ct-card-f">
              <span />
              <Button type="primary" loading={busy === t.id} disabled={!!busy && busy !== t.id} onClick={() => onPick(t)}>
                Use this contract
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ custom field input */
const CustomField = ({ f, value, onChange, disabled, onPicked, ...rest }) => {
  if (f.type === "textarea") return <Input.TextArea {...rest} disabled={disabled} autoSize={{ minRows: 2 }} value={value} onChange={(e) => onChange(e.target.value)} />;
  if (f.type === "number")
    return <InputNumber {...rest} disabled={disabled} style={{ width: "100%" }} value={value === "" ? null : Number(value)} onChange={(v) => onChange(v === null ? "" : String(v))} />;
  if (f.type === "date")
    return (
      <DatePicker
        {...rest}
        disabled={disabled}
        style={{ width: "100%" }}
        format="DD/MM/YYYY"
        value={value ? dayjs(value) : null}
        onChange={(d) => {
          onChange(d ? d.toISOString() : "");
          onPicked?.();
        }}
      />
    );
  if (f.type === "select")
    return (
      <Select
        {...rest}
        disabled={disabled}
        allowClear
        style={{ width: "100%" }}
        value={value || undefined}
        onChange={(v) => {
          onChange(v || "");
          onPicked?.();
        }}
        options={(f.options || []).map((o) => ({ value: o, label: o }))}
      />
    );
  return <Input {...rest} disabled={disabled} value={value} onChange={(e) => onChange(e.target.value)} />;
};

const Req = () => <span style={{ color: "#b42318" }}> *</span>;
const ErrText = ({ show }) => (show ? <div className="ct-err">Required</div> : null);

/* ------------------------------------------------------------------ drawer */
const PrepareContractDrawer = ({ open, onClose, request, contractId, onChanged }) => {
  const [id, setId] = useState(contractId || null);
  const [contract, setContract] = useState(null);
  const [doc, setDoc] = useState(null);
  const [values, setValues] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(null);
  const [busy, setBusy] = useState(null); // "save" | "send" | "void" | "delete"
  const [view, setView] = useState("preview");
  const [dirty, setDirty] = useState(false);
  const [sentOpen, setSentOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [touched, setTouched] = useState({});
  const [saveState, setSaveState] = useState({ state: "idle", at: null }); // idle | saving | saved | error
  const [autosaveReq, setAutosaveReq] = useState(0);
  const seq = useRef(0); // bumps on every edit
  const saving = useRef(false);
  const again = useRef(false);

  useEffect(() => {
    if (!open) return;
    setId(contractId || null);
    setView("preview");
    setDirty(false);
    setShowErrors(false);
    setTouched({});
    setSaveState({ state: "idle", at: null });
    if (!contractId) {
      setContract(null);
      setDoc(null);
    }
  }, [open, contractId]);

  const apply = (c) => {
    setContract(c);
    setDoc(c.document);
    setValues(normalizeValues(c.values, c.document, request));
    setTitle(c.title);
    setDirty(false);
  };

  useEffect(() => {
    if (!open || !id) return;
    setLoading(true);
    ContractApi.get(id)
      .then(apply)
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id]);

  const locked = contract && LOCKED.includes(contract.status);
  const ctxData = useMemo(
    () => (doc && values ? buildContext({ document: doc, request, values, contract: { ...contract, title } }) : null),
    [doc, values, request, contract, title],
  );
  const previewHtml = useMemo(() => {
    if (!doc || !values) return "";
    if (locked) return contract.previewHtml || contract.html || "";
    return renderContract({ document: doc, request, values, contract: { ...contract, title }, mode: "preview" });
  }, [doc, values, request, contract, title, locked]);
  const finalHtml = () =>
    locked ? contract.previewHtml || contract.html : renderContract({ document: doc, request, values, contract: { ...contract, title }, mode: "final" });

  const change = (fn) => {
    setValues((v) => fn(v));
    setDirty(true);
    seq.current += 1;
  };
  const setMeta = (k, v) => change((x) => ({ ...x, meta: { ...x.meta, [k]: v } }));
  const setField = (k, v) => change((x) => ({ ...x, fields: { ...x.fields, [k]: v } }));
  const rows = values?.schedule?.rows || [];
  const setRows = (next) => change((x) => ({ ...x, schedule: { ...x.schedule, rows: next } }));
  const setRow = (rid, patch) => setRows(rows.map((r) => (r.id === rid ? { ...r, ...patch } : r)));
  const setDoc2 = (d) => {
    setDoc(d);
    setDirty(true);
    seq.current += 1;
  };
  const setSettings = (patch) => setDoc2({ ...doc, settings: { ...doc.settings, ...patch } });

  const pick = async (t) => {
    setCreating(t.id);
    try {
      const c = await ContractApi.createForRequest(request.id, t.id);
      setId(c.id);
      apply(c);
      onChanged?.();
    } catch {
      // toast handled by api interceptor
    } finally {
      setCreating(null);
    }
  };

  const save = async (action) => {
    setBusy(action);
    try {
      const c = await ContractApi.save(contract.id, {
        title: title.trim() || contract.title,
        document: doc,
        values: { ...values, unsentChanges: action === "send" ? false : contract.status !== "DRAFT" },
        html: renderContract({ document: doc, request, values, contract: { ...contract, title }, mode: "final" }),
        action,
        ...(action === "send" ? { totalPrice: Math.round(contractTotal * 100) / 100 } : {}),
      });
      apply(c);
      onChanged?.();
      setSaveState({ state: "saved", at: new Date() });
      if (action === "send") setSentOpen(true);
      else message.success("Saved");
    } catch {
      // toast handled by api interceptor
    } finally {
      setBusy(null);
    }
  };

  /* ---------------- autosave: when a field loses focus ---------------- */
  const latest = useRef({});
  latest.current = { contract, doc, values, title, dirty, request };

  const autosave = useCallback(async () => {
    const { contract: c, doc: d, values: v, title: t, dirty: isDirty, request: req } = latest.current;
    if (!c || !d || !v || !isDirty || LOCKED.includes(c.status)) return true;
    if (saving.current) {
      again.current = true;
      return false;
    }
    saving.current = true;
    const at = seq.current;
    setSaveState({ state: "saving", at: null });
    try {
      const saved = await ContractApi.save(c.id, {
        title: t.trim() || c.title,
        document: d,
        values: { ...v, unsentChanges: c.status !== "DRAFT" },
        html: renderContract({ document: d, request: req, values: v, contract: { ...c, title: t }, mode: "final" }),
        action: "save",
      });
      // keep what the admin is typing; only refresh the server-side info
      setContract((prev) => ({ ...prev, ...saved, document: prev.document, values: { ...v, unsentChanges: c.status !== "DRAFT" } }));
      setValues((cur) => (cur ? { ...cur, unsentChanges: c.status !== "DRAFT" } : cur));
      if (seq.current === at) setDirty(false);
      setSaveState({ state: "saved", at: new Date() });
      return true;
    } catch {
      setSaveState({ state: "error", at: null });
      return false;
    } finally {
      saving.current = false;
      if (again.current) {
        again.current = false;
        setAutosaveReq((n) => n + 1);
      }
    }
  }, []);

  // run after React has committed the latest values
  useEffect(() => {
    if (autosaveReq) autosave();
  }, [autosaveReq, autosave]);
  const requestAutosave = () => setAutosaveReq((n) => n + 1);
  const touch = (id) => setTouched((t) => (t[id] ? t : { ...t, [id]: true }));

  const hasSchedule = (doc?.blocks || []).some((b) => b.type === "schedule");
  const scheduleCols = (doc?.blocks || []).find((b) => b.type === "schedule")?.columns || [];
  // Every admin-filled detail is required (customer fields are filled when signing)
  const requiredMissing = adminFields(doc).filter((f) => !String(values?.fields?.[f.key] ?? "").trim());
  const customerFields = (doc?.fields || []).filter(isCustomerField);
  const emptyKeys = ctxData ? missingKeys(doc, ctxData.ctx).filter((k) => !k.startsWith("custom.")) : [];

  const totals = ctxData?.totals;
  const agreed = request?.totalPrice > 0 ? request.totalPrice : null;
  // The price sent with the contract (signing it = accepting this price)
  const scheduleTotal = hasSchedule && totals && totals.sum > 0 ? totals.gross : null;
  // Price comes from the agreement on the booking page (no price input here any more)
  // const contractTotal = scheduleTotal ?? (Number(values?.meta?.totalPrice) || agreed || 0);
  const contractTotal = scheduleTotal ?? (agreed || 0);
  const vatIncluded = isVatIncluded(doc?.settings);
  const alreadyAccepted = ["APPROVED", "ACTIVE", "COMPLETED"].includes(request?.status);
  const priceLocked = alreadyAccepted && agreed && Math.abs(contractTotal - agreed) > 0.5;
  const mismatch = agreed && totals && rows.length && Math.abs(totals.gross - agreed) > 0.5;
  const matchAgreed = () => {
    const r2 = (n) => Math.round(n * 100) / 100;
    // Use each car's customer price from the agreement when they add up to the total
    const carPrice = (carId) => request?.cars?.find((c) => c.car?.id === carId)?.price || 0;
    const perCarSum = rows.reduce((s, r) => s + carPrice(r.carId), 0);
    if (rows.length && rows.every((r) => carPrice(r.carId) > 0) && Math.abs(perCarSum - agreed) < 0.5) {
      setRows(rows.map((r) => ({ ...r, rate: r2(carPrice(r.carId) / (Number(r.days) || 1)) })));
      return;
    }
    // otherwise split the agreed price evenly over all vehicle-days (totals no longer add VAT on top)
    const daysSum = rows.reduce((s, r) => s + (Number(r.days) || 0), 0) || 1;
    const rate = r2(agreed / daysSum);
    setRows(rows.map((r) => ({ ...r, rate })));
  };

  const ROW_TEXT = ["driver", "plate", "carType", "vehicle", "location"].filter((c) => scheduleCols.includes(c));
  const problems = [];
  if (doc && values) {
    if (!title.trim()) problems.push({ id: "title", label: "Title" });
    // if (scheduleTotal === null && !(contractTotal > 0)) problems.push({ id: "price", label: "Price for the customer" });
    if (!agreed) problems.push({ id: "price", label: "Agreed price (set it in the Agreement step)" });
    else if (hasSchedule && mismatch) problems.push({ id: "rows-total", label: "Vehicle prices must add up to the agreed price" });
    [
      ["agreementDate", "Agreement date"],
      ["effectiveDate", "Effective date"],
      ["expiryDate", "Expiry date"],
    ].forEach(([k, label]) => !values.meta?.[k] && problems.push({ id: `meta:${k}`, label }));
    requiredMissing.forEach((f) => problems.push({ id: `field:${f.key}`, label: f.label }));
    if (hasSchedule) {
      if (!rows.length) problems.push({ id: "rows", label: "At least one vehicle" });
      rows.forEach((r, i) => {
        ROW_TEXT.forEach((c) => !String(r[c] ?? "").trim() && problems.push({ id: `row:${r.id}:${c}`, label: `${SCHEDULE_COLUMNS[c].label} (vehicle ${i + 1})` }));
        if (!(Number(r.days) > 0)) problems.push({ id: `row:${r.id}:days`, label: `Days (vehicle ${i + 1})` });
        if (!(Number(r.rate) > 0)) problems.push({ id: `row:${r.id}:rate`, label: `Price per day (vehicle ${i + 1})` });
      });
    }
  }
  const problemIds = new Set(problems.map((p) => p.id));
  const bad = (id) => !locked && (showErrors || touched[id]) && problemIds.has(id);
  // props for a required input: red outline + "Required" after leaving it empty
  const req = (id) => ({ id: `f-${id}`, status: bad(id) ? "error" : undefined, onBlur: () => touch(id) });

  const askSend = () => {
    if (problems.length) {
      setShowErrors(true);
      setTimeout(() => document.getElementById(`f-${problems[0].id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      Modal.warning({
        title: `Fill in ${problems.length} required detail${problems.length > 1 ? "s" : ""} first`,
        content: (
          <ul className="ct-missing-list">
            {problems.slice(0, 10).map((p) => (
              <li key={p.id}>{p.label}</li>
            ))}
            {problems.length > 10 && <li>+ {problems.length - 10} more</li>}
          </ul>
        ),
      });
      return;
    }
    if (!(contractTotal > 0)) {
      Modal.warning({
        title: "Set the price first",
        content: "The contract carries the price from the Agreement step. Set the agreed price on the booking first.",
      });
      return;
    }
    if (priceLocked) {
      Modal.warning({
        title: "The customer already accepted a different price",
        content: `They accepted ${fmtMoney(agreed)} ${doc.settings?.currency || "ETB"}. Send the contract with that price (use "Match price").`,
      });
      return;
    }
    const resend = ["SENT", "VIEWED", "DECLINED"].includes(contract.status);
    const warnings = emptyKeys.map((k) => fieldLabel(k, doc));
    Modal.confirm({
      title: resend ? "Send the updated contract?" : "Send the contract to the customer?",
      width: 520,
      icon: <SendOutlined style={{ color: "var(--c-primary-text)" }} />,
      content: (
        <div>
          <p style={{ margin: "4px 0 10px" }}>
            {request.contactName} gets a secure link to read and sign <b>{contract.contractNo}</b>
            {request.customerId ? " (also in the mobile app)" : ". They have no account, so share the link by SMS or WhatsApp after sending"}.
            {resend && " The previous version can no longer be signed."}
          </p>
          <div className="ct-totals" style={{ marginBottom: 12 }}>
            <div>
              <span>Price sent to the customer</span>
              <span>
                {fmtMoney(contractTotal)} {doc.settings?.currency || "ETB"}
              </span>
            </div>
            <div>
              <span>{alreadyAccepted ? "Already accepted by the customer" : "Signing = accepting this price"}</span>
              <span>{alreadyAccepted ? "✓" : "→ Approved"}</span>
            </div>
          </div>
          {warnings.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message="These details are empty and will print as blank lines"
              description={
                <ul className="ct-missing-list">
                  {warnings.slice(0, 8).map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                  {warnings.length > 8 && <li>+ {warnings.length - 8} more</li>}
                </ul>
              }
            />
          )}
        </div>
      ),
      okText: warnings.length ? "Send anyway" : resend ? "Re-send" : "Send",
      onOk: () => save("send"),
    });
  };

  const voidIt = async () => {
    setBusy("void");
    try {
      apply(await ContractApi.void(contract.id));
      onChanged?.();
      message.success("Contract voided");
    } catch {
      // toast handled by api interceptor
    } finally {
      setBusy(null);
    }
  };
  const deleteDraft = async () => {
    setBusy("delete");
    try {
      await ContractApi.remove(contract.id);
      onChanged?.();
      message.success("Draft deleted");
      onClose();
    } catch {
      // toast handled by api interceptor
    } finally {
      setBusy(null);
    }
  };
  const resetWording = async () => {
    if (!contract.templateId) return;
    try {
      const t = await ContractApi.getTemplate(contract.templateId);
      setDoc2(t.document);
      setValues((v) => normalizeValues(v, t.document, request));
      message.success("Wording reset to the template");
    } catch {
      // toast handled by api interceptor
    }
  };

  const close = async () => {
    if (!dirty || locked) return onClose();
    const ok = await autosave();
    if (ok) return onClose();
    Modal.confirm({
      title: "Your last changes were not saved",
      content: "Close anyway and lose them?",
      okText: "Close",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: onClose,
    });
  };

  const st = contract ? CONTRACT_STATUS[contract.status] : null;

  return (
    <Drawer
      open={open}
      onClose={close}
      width="min(1360px, 100vw)"
      destroyOnHidden
      styles={{ body: { padding: 0, display: "flex", flexDirection: "column" } }}
      title={
        <span className="flex items-center gap-2 flex-wrap">
          {contract ? (
            <>
              <span>{contract.contractNo}</span>
              <StatusPill tone={st.tone}>{st.label}</StatusPill>
            </>
          ) : (
            "Select a contract"
          )}
          <span className="ct-muted" style={{ fontWeight: 400, fontSize: 13 }}>
            · {request?.trackingCode} · {request?.contactName}
          </span>
        </span>
      }
      footer={
        contract && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="ct-muted ct-small" style={{ flex: 1, minWidth: 160 }}>
              {contract.status === "SIGNED"
                ? `Signed by ${contract.signerName} · ${dayjs(contract.signedAt).format("DD MMM YYYY HH:mm")}`
                : contract.sentAt
                  ? `Sent ${dayjs(contract.sentAt).format("DD MMM YYYY HH:mm")}${contract.viewedAt ? ` · opened ${dayjs(contract.viewedAt).format("DD MMM HH:mm")}` : ""}`
                  : `Draft · created ${dayjs(contract.createdAt).format("DD MMM YYYY HH:mm")}`}
              {" · "}
              <span className={`ct-save ct-save-${saveState.state === "idle" && dirty ? "dirty" : saveState.state}`}>
                {saveState.state === "saving"
                  ? "Saving…"
                  : saveState.state === "error"
                    ? "Couldn't save — check your connection"
                    : dirty
                      ? "Unsaved changes"
                      : saveState.at
                        ? `Saved ${dayjs(saveState.at).format("HH:mm")}`
                        : "All changes saved"}
              </span>
            </span>
            {contract.status === "DRAFT" && (
              <Popconfirm title="Delete this draft?" okText="Delete" okButtonProps={{ danger: true }} onConfirm={deleteDraft}>
                <Button danger icon={<DeleteOutlined />} loading={busy === "delete"}>
                  Delete draft
                </Button>
              </Popconfirm>
            )}
            {contract.status !== "DRAFT" && contract.status !== "VOID" && (
              <Popconfirm
                title="Void this contract?"
                description="The customer will no longer be able to sign it."
                okText="Void"
                okButtonProps={{ danger: true }}
                onConfirm={voidIt}
              >
                <Button danger icon={<StopOutlined />} loading={busy === "void"}>
                  Void
                </Button>
              </Popconfirm>
            )}
            {!locked && (
              <Button icon={<EditOutlined />} loading={busy === "save"} disabled={!!busy || !dirty} onClick={() => save("save")}>
                Save
              </Button>
            )}
            {!locked && (
              <Button type="primary" icon={<SendOutlined />} loading={busy === "send"} disabled={!!busy} onClick={askSend}>
                {["SENT", "VIEWED", "DECLINED"].includes(contract.status) ? "Re-send to customer" : "Send to customer"}
              </Button>
            )}
          </div>
        )
      }
    >
      {!id ? (
        <TemplatePicker onPick={pick} busy={creating} />
      ) : loading || !contract || !values ? (
        <div className="flex justify-center p-16">
          <Spin size="large" />
        </div>
      ) : (
        <EditorBusProvider document={doc}>
          <div className="ct-prep" style={{ flex: 1, minHeight: 0 }}>
            {/* ------------ form ------------ */}
            <div className="ct-prep-form" onBlurCapture={() => !locked && requestAutosave()}>
              {!locked && contract.status !== "DRAFT" && values.unsentChanges && (
                <Alert
                  style={{ marginBottom: 18 }}
                  type="warning"
                  showIcon
                  message="Changed after sending"
                  description="Your changes are saved, but the customer still sees the version you sent. Re-send to update it."
                />
              )}
              {!locked && problems.length > 0 && (
                <div className="ct-reqbar">
                  <span>
                    <b>{problems.length}</b> required detail{problems.length > 1 ? "s" : ""} left
                  </span>
                  <Button
                    size="small"
                    type="link"
                    onClick={() => {
                      setShowErrors(true);
                      document.getElementById(`f-${problems[0].id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                  >
                    Show
                  </Button>
                </div>
              )}
              {contract.status === "SIGNED" && (
                <div className="ct-sigbox" style={{ marginTop: 0, marginBottom: 18 }}>
                  <CheckCircleFilled style={{ color: "#059669", fontSize: 22 }} />
                  <div style={{ flex: 1 }}>
                    <b>Signed by {contract.signerName}</b>
                    <div className="ct-muted ct-small">
                      {dayjs(contract.signedAt).format("DD MMM YYYY · HH:mm")}
                      {contract.signerIp ? ` · IP ${contract.signerIp}` : ""}
                    </div>
                  </div>
                  {contract.signatureImage && <img src={contract.signatureImage} alt="Customer signature" />}
                </div>
              )}
              {contract.status === "DECLINED" && (
                <Alert
                  style={{ marginBottom: 18 }}
                  type="error"
                  showIcon
                  message="The customer declined this contract"
                  description={contract.declineReason ? `“${contract.declineReason}”` : "No reason given. Call them, update the contract and re-send it."}
                />
              )}
              {contract.status === "VOID" && <Alert style={{ marginBottom: 18 }} type="info" showIcon message="This contract was voided and can't be edited." />}
              {["SENT", "VIEWED", "SIGNED", "DECLINED"].includes(contract.status) && (
                <div className="ct-sec">
                  <div className="ct-sec-h">
                    <span className="n">
                      <LinkOutlined />
                    </span>
                    <b>Customer link</b>
                  </div>
                  <ShareLinks request={request} contract={contract} />
                </div>
              )}

              <div className="ct-sec">
                <div className="ct-sec-h">
                  <span className="n">1</span>
                  <b>Contract</b>
                </div>
                <label className="ct-label">
                  Title
                  <Req />
                </label>
                <Input
                  {...req("title")}
                  disabled={locked}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setDirty(true);
                    seq.current += 1;
                  }}
                />
                <ErrText show={bad("title")} />
                {/* Old "Price for the customer" input — the price now comes from the Agreement step
                <label className="ct-label">
                  Price for the customer
                  <Req />
                </label>
                {scheduleTotal !== null ? (
                  <div className="ct-sendlink" style={{ justifyContent: "space-between" }}>
                    <b style={{ color: "var(--c-text)" }}>
                      {fmtMoney(scheduleTotal)} {doc.settings?.currency || "ETB"}
                    </b>
                    <span className="ct-muted ct-small">from the vehicle schedule</span>
                  </div>
                ) : (
                  <InputNumber
                    {...req("price")}
                    disabled={locked}
                    min={0}
                    style={{ width: "100%" }}
                    addonAfter={doc.settings?.currency || "ETB"}
                    placeholder="Agreed total price"
                    value={values.meta.totalPrice ?? agreed ?? null}
                    onChange={(v) => setMeta("totalPrice", v ?? null)}
                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(v) => v?.replace(/,/g, "")}
                  />
                )}
                <div className="ct-muted ct-small" style={{ marginTop: 4 }}>
                  {bad("price")
                    ? <span className="ct-err" style={{ display: "inline" }}>Required</span>
                    : alreadyAccepted
                    ? "The customer already accepted the price."
                    : "Sent with the contract. When the customer signs, they accept this price and you can record payments."}
                </div>
                */}
                <label className="ct-label">Agreed price</label>
                <div id="f-price" className="ct-sendlink" style={{ justifyContent: "space-between" }}>
                  <b style={{ color: "var(--c-text)" }}>
                    {agreed ? `${fmtMoney(agreed)} ${doc.settings?.currency || "ETB"}` : "Not set"}
                  </b>
                  <span className="ct-muted ct-small">
                    {agreed ? `from the agreement · ${vatIncluded ? "VAT included" : "VAT exclusive"}` : "set it in the Agreement step"}
                  </span>
                </div>
                <div className="ct-muted ct-small" style={{ marginTop: 4 }}>
                  {bad("price") ? (
                    <span className="ct-err" style={{ display: "inline" }}>Set the agreement first</span>
                  ) : alreadyAccepted ? (
                    "The customer already accepted the price."
                  ) : (
                    "Sent with the contract. When the customer signs, they accept this price and you can record payments. To change it, use Change on the Agreement."
                  )}
                </div>
                <div className="ct-vat">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b>Price includes VAT</b>
                    <div className="ct-muted ct-small">
                      {vatIncluded
                        ? `The contract shows the ${doc.settings?.vatRate ?? 15}% VAT inside the total.`
                        : "Off: the contract clearly says all prices are VAT exclusive."}
                    </div>
                  </div>
                  <Switch
                    disabled={locked}
                    checked={vatIncluded}
                    checkedChildren="Incl. VAT"
                    unCheckedChildren="VAT excl."
                    onChange={(v) => {
                      setSettings({ pricesIncludeVat: v });
                      requestAutosave();
                    }}
                  />
                </div>
                {vatIncluded && (
                  <div style={{ maxWidth: 200 }}>
                    <label className="ct-label">VAT %</label>
                    <InputNumber disabled={locked} min={0} max={100} style={{ width: "100%" }} value={doc.settings?.vatRate} onChange={(v) => setSettings({ vatRate: v ?? 0 })} />
                  </div>
                )}
                {priceLocked && !locked && (
                  <Alert style={{ marginTop: 8 }} type="error" showIcon message={`The customer already accepted ${fmtMoney(agreed)}. Use the same price.`} />
                )}
                <div className="ct-grid2">
                  <div>
                    <label className="ct-label">Contract no.</label>
                    <Input value={contract.contractNo} disabled />
                  </div>
                  <div>
                    <label className="ct-label">
                      Agreement date
                      <Req />
                    </label>
                    <DatePicker
                      {...req("meta:agreementDate")}
                      disabled={locked}
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      value={values.meta.agreementDate ? dayjs(values.meta.agreementDate) : null}
                      onChange={(d) => {
                        setMeta("agreementDate", d ? d.toISOString() : "");
                        requestAutosave();
                      }}
                    />
                    <ErrText show={bad("meta:agreementDate")} />
                  </div>
                  <div>
                    <label className="ct-label">
                      Effective date
                      <Req />
                    </label>
                    <DatePicker
                      {...req("meta:effectiveDate")}
                      disabled={locked}
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      value={values.meta.effectiveDate ? dayjs(values.meta.effectiveDate) : null}
                      onChange={(d) => {
                        setMeta("effectiveDate", d ? d.toISOString() : "");
                        requestAutosave();
                      }}
                    />
                    <ErrText show={bad("meta:effectiveDate")} />
                  </div>
                  <div>
                    <label className="ct-label">
                      Expiry date
                      <Req />
                    </label>
                    <DatePicker
                      {...req("meta:expiryDate")}
                      disabled={locked}
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      value={values.meta.expiryDate ? dayjs(values.meta.expiryDate) : null}
                      onChange={(d) => {
                        setMeta("expiryDate", d ? d.toISOString() : "");
                        requestAutosave();
                      }}
                    />
                    <ErrText show={bad("meta:expiryDate")} />
                  </div>
                </div>
              </div>

              {(adminFields(doc).length > 0 || customerFields.length > 0) && (
                <div className="ct-sec">
                  <div className="ct-sec-h">
                    <span className="n">2</span>
                    <b>Details to fill</b>
                    <span className="grow" />
                    {!locked && requiredMissing.length > 0 && <StatusPill tone="amber">{requiredMissing.length} left</StatusPill>}
                  </div>
                  {adminFields(doc).map((f) => (
                    <div key={f.key}>
                      <label className="ct-label">
                        {f.label}
                        <Req />
                      </label>
                      <CustomField
                        {...req(`field:${f.key}`)}
                        f={f}
                        disabled={locked}
                        value={values.fields[f.key] ?? ""}
                        onChange={(v) => setField(f.key, v)}
                        onPicked={requestAutosave}
                      />
                      <ErrText show={bad(`field:${f.key}`)} />
                      {f.help && <div className="ct-muted ct-small" style={{ marginTop: 3 }}>{f.help}</div>}
                    </div>
                  ))}
                  {customerFields.length > 0 && (
                    <div className="ct-sendlink" style={{ marginTop: 12, alignItems: "flex-start" }}>
                      <span className="ct-tag ct-tag-cust">Customer</span>
                      <div className="ct-small" style={{ flex: 1 }}>
                        {contract.status === "SIGNED" ? (
                          customerFields.map((f) => (
                            <div key={f.key}>
                              {f.label}: <b>{f.source === "signer" ? contract.signerName : contract.customerValues?.[f.key] || "—"}</b>
                            </div>
                          ))
                        ) : (
                          <>
                            Filled by the customer when signing: <b>{customerFields.map((f) => f.label).join(", ")}</b>.
                            {customerFields.some((f) => f.source === "signer") && " The name is pre-filled with the customer's name; they can change it."}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {hasSchedule && (
                <div className="ct-sec">
                  <div className="ct-sec-h">
                    <span className="n">3</span>
                    <b>Vehicles & drivers</b>
                    <span className="grow" />
                    {!locked && (
                      <Button
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          requestAutosave();
                          setRows([
                            ...rows,
                            { id: uid("row"), carId: null, vehicle: "", driver: "", plate: "", carType: "", location: (request?.destinations || []).join(", "), days: request?.days || 1, rate: rows[0]?.rate || 0 },
                          ]);
                        }}
                      >
                        Row
                      </Button>
                    )}
                  </div>
                  {rows.map((r, i) => (
                    <div key={r.id} className="ct-row">
                      <div className="ct-row-h">
                        <span className="ct-tag">{i + 1}</span>
                        <span className="grow">{r.vehicle || r.carType || "Vehicle"}</span>
                        {!locked && (
                          <Tooltip title="Remove row">
                            <button
                              type="button"
                              className="ct-ib is-danger"
                              onClick={() => {
                                setRows(rows.filter((x) => x.id !== r.id));
                                requestAutosave();
                              }}
                            >
                              <DeleteOutlined />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                      <div className="ct-row-grid">
                        {[
                          { k: "driver", label: "Driver name", full: true, ph: "Assigned driver" },
                          { k: "plate", label: "Plate no." },
                          { k: "carType", label: "Car type" },
                          { k: "vehicle", label: "Vehicle", full: true },
                          { k: "location", label: "Assigned location", full: true },
                        ].map((c) => {
                          const must = ROW_TEXT.includes(c.k);
                          const id = `row:${r.id}:${c.k}`;
                          return (
                            <div key={c.k} className={c.full ? "full" : undefined}>
                              <label>
                                {c.label}
                                {must && <Req />}
                              </label>
                              <Input
                                {...(must ? req(id) : {})}
                                disabled={locked}
                                value={r[c.k]}
                                placeholder={c.ph}
                                onChange={(e) => setRow(r.id, { [c.k]: e.target.value })}
                              />
                              <ErrText show={must && bad(id)} />
                            </div>
                          );
                        })}
                        <div>
                          <label>
                            Days
                            <Req />
                          </label>
                          <InputNumber {...req(`row:${r.id}:days`)} disabled={locked} min={0} style={{ width: "100%" }} value={r.days} onChange={(v) => setRow(r.id, { days: v ?? 0 })} />
                          <ErrText show={bad(`row:${r.id}:days`)} />
                        </div>
                        <div>
                          <label>
                            Price per day
                            <Req />
                          </label>
                          <InputNumber
                            {...req(`row:${r.id}:rate`)}
                            disabled={locked}
                            min={0}
                            style={{ width: "100%" }}
                            value={r.rate}
                            onChange={(v) => setRow(r.id, { rate: v ?? 0 })}
                            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                            parser={(v) => v?.replace(/,/g, "")}
                          />
                          <ErrText show={bad(`row:${r.id}:rate`)} />
                        </div>
                      </div>
                      <div className="ct-row-amt">
                        <span>Amount</span>
                        <b>
                          {fmtMoney((Number(r.days) || 0) * (Number(r.rate) || 0))} {doc.settings?.currency || "ETB"}
                        </b>
                      </div>
                    </div>
                  ))}
                  <div className="ct-grid2" style={{ marginBottom: 10 }}>
                    {/* VAT % moved next to the "Price includes VAT" switch above
                    <div>
                      <label className="ct-label">VAT %</label>
                      <InputNumber disabled={locked} min={0} max={100} style={{ width: "100%" }} value={doc.settings?.vatRate} onChange={(v) => setSettings({ vatRate: v ?? 0 })} />
                    </div>
                    */}
                    <div>
                      <label className="ct-label">Withholding %</label>
                      <InputNumber disabled={locked} min={0} max={100} style={{ width: "100%" }} value={doc.settings?.withholdingRate} onChange={(v) => setSettings({ withholdingRate: v ?? 0 })} />
                    </div>
                  </div>
                  {totals && (
                    <div className="ct-totals">
                      {!totals.vatIncluded && (
                        <div className="ct-vat-tag">VAT EXCLUSIVE — prices do not include VAT</div>
                      )}
                      {totals.vatIncluded && totals.vatRate > 0 && (
                        <div>
                          <span>Amount before VAT</span>
                          <span>{fmtMoney(totals.beforeVat)}</span>
                        </div>
                      )}
                      {totals.vatRate > 0 && (
                        <div>
                          <span>VAT {totals.vatRate}%</span>
                          <span>{fmtMoney(totals.vat)}</span>
                        </div>
                      )}
                      {totals.whRate > 0 && (
                        <div>
                          <span>Withholding {totals.whRate}%</span>
                          <span>{fmtMoney(totals.withholding)}</span>
                        </div>
                      )}
                      <div>
                        <span>{totals.whRate > 0 ? "Net payable" : totals.vatIncluded ? "Total incl. VAT" : "Total (VAT exclusive)"}</span>
                        <span>
                          {fmtMoney(totals.whRate > 0 ? totals.net : totals.gross)} {doc.settings?.currency || "ETB"}
                        </span>
                      </div>
                    </div>
                  )}
                  {mismatch && !locked && (
                    <Alert
                      id="f-rows-total"
                      style={{ marginTop: 10 }}
                      type="warning"
                      showIcon
                      message={`Vehicle prices add up to ${fmtMoney(totals.gross)}, but the agreed price is ${fmtMoney(agreed)}`}
                      action={
                        <Button
                          size="small"
                          onClick={() => {
                            matchAgreed();
                            requestAutosave();
                          }}
                        >
                          Match price
                        </Button>
                      }
                    />
                  )}
                  {!agreed && (
                    <Alert style={{ marginTop: 10 }} type="info" showIcon message="No agreed price yet. Set the agreement on the booking page first." />
                  )}
                </div>
              )}

              {!locked && (
                <div className="ct-sec">
                  <div className="ct-sec-h">
                    <span className="n">{hasSchedule ? 4 : 3}</span>
                    <b>Wording</b>
                  </div>
                  <p className="ct-muted ct-small" style={{ marginTop: 0 }}>
                    Need a special clause for this customer? Edit the articles for this booking only. The template stays unchanged.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button icon={<EditOutlined />} onClick={() => setView("wording")}>
                      Edit articles
                    </Button>
                    {contract.templateId && (
                      <Popconfirm title="Use the template wording again?" description="Your wording changes for this booking will be lost." onConfirm={resetWording}>
                        <Button icon={<UndoOutlined />}>Reset to template</Button>
                      </Popconfirm>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ------------ preview / wording ------------ */}
            <div className="ct-prep-preview">
              <div className="ct-toolbar" style={{ maxWidth: 820, margin: "0 auto 14px" }}>
                {!locked && (
                  <Segmented
                    value={view}
                    onChange={setView}
                    options={[
                      { value: "preview", icon: <EyeOutlined />, label: "Preview" },
                      { value: "wording", icon: <EditOutlined />, label: "Edit wording" },
                    ]}
                  />
                )}
                <span className="grow" />
                <Tooltip title="Print or save as PDF">
                  <Button icon={<PrinterOutlined />} onClick={() => printContract(finalHtml(), `${contract.contractNo} ${request?.contactName || ""}`)}>
                    PDF
                  </Button>
                </Tooltip>
                <Tooltip title="Download Word">
                  <Button icon={<FileWordOutlined />} onClick={() => downloadWord(finalHtml(), `${contract.contractNo} ${request?.contactName || ""}`)} aria-label="Download Word" />
                </Tooltip>
              </div>
              {view === "wording" && !locked ? (
                <div style={{ "--pa": doc.settings?.accent || "#09234c" }} onBlurCapture={requestAutosave}>
                  <DocumentEditor document={doc} onChange={setDoc2} />
                </div>
              ) : (
                <div className="ct-paper ct-preview-paper" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              )}
            </div>
          </div>
        </EditorBusProvider>
      )}

      <Modal
        open={sentOpen}
        onCancel={() => setSentOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <CheckCircleFilled style={{ color: "#059669" }} /> Contract sent
          </span>
        }
        footer={
          <Button type="primary" onClick={() => setSentOpen(false)}>
            Done
          </Button>
        }
      >
        <p style={{ marginTop: 0 }}>
          {request?.customerId
            ? `${request.contactName} got a notification in the app. You can also send the link directly:`
            : `${request?.contactName} has no account. Send them the link by WhatsApp or SMS:`}
        </p>
        {contract && <ShareLinks request={request} contract={contract} />}
      </Modal>
    </Drawer>
  );
};

export default PrepareContractDrawer;

// Side panels of the contract builder: Outline, Fields, Settings.
import React, { useState } from "react";
import {
  Button,
  ColorPicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Switch,
  Upload,
  message,
} from "antd";
import { DeleteOutlined, EditOutlined, HolderOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { FieldList } from "./FieldPicker";
import { useEditorBus } from "./EditorBus";
import { articleNumbers, blockTitle } from "./DocumentEditor";
import { FIELD_SOURCES, isCustomerField, slugKey } from "../contractFields";
import ContractApi from "../contractApi";

/* ------------------------------------------------------------------ outline */
export const Outline = ({ document, onChange }) => {
  const blocks = document?.blocks || [];
  const numbers = articleNumbers(blocks);
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(null);

  const drop = (to) => {
    if (drag === null || drag === to) return;
    const next = blocks.slice();
    const [it] = next.splice(drag, 1);
    next.splice(to > drag ? to - 1 : to, 0, it);
    onChange({ ...document, blocks: next });
  };

  return (
    <nav className="ct-outline" aria-label="Contract outline">
      {blocks.map((b, i) => (
        <div
          key={b.id}
          className={`ct-outline-item ${over === i ? "is-over" : ""} ${drag === i ? "is-drag" : ""} is-${b.type}`}
          draggable
          onDragStart={(e) => {
            setDrag(i);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(i);
          }}
          onDragLeave={() => setOver((o) => (o === i ? null : o))}
          onDrop={(e) => {
            e.preventDefault();
            drop(i);
            setDrag(null);
            setOver(null);
          }}
          onDragEnd={() => {
            setDrag(null);
            setOver(null);
          }}
          onClick={() => window.document.getElementById(`blk-${b.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
          title="Drag to reorder · click to jump"
        >
          <HolderOutlined className="ct-outline-grip" />
          <span className="ct-outline-text">{blockTitle(b, numbers[b.id])}</span>
          {b.type === "article" && <span className="ct-outline-count">{b.clauses?.length || 0}</span>}
        </div>
      ))}
      <div
        className={`ct-outline-end ${over === blocks.length ? "is-over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(blocks.length);
        }}
        onDrop={(e) => {
          e.preventDefault();
          drop(blocks.length);
          setDrag(null);
          setOver(null);
        }}
      />
    </nav>
  );
};

/* ------------------------------------------------------------------ fields */
const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Choice list" },
];

const CustomFieldModal = ({ open, field, existingKeys, onClose, onSave }) => {
  const [form] = Form.useForm();
  const type = Form.useWatch("type", form);
  const source = Form.useWatch("source", form);
  return (
    <Modal
      open={open}
      title={field ? "Edit custom field" : "New custom field"}
      okText={field ? "Save field" : "Add field"}
      onCancel={onClose}
      destroyOnHidden
      onOk={async () => {
        const v = await form.validateFields();
        const key = field?.key || slugKey(v.key || v.label);
        onSave({
          key,
          label: v.label.trim(),
          type: v.source === "signer" ? "text" : v.type,
          source: v.source || "admin",
          default: v.default ?? "",
          // admin fields and the signing name are always required
          required: v.source === "customer" ? !!v.required : true,
          options: v.type === "select" ? (v.options || []).map((o) => String(o).trim()).filter(Boolean) : undefined,
          help: v.help?.trim() || undefined,
        });
      }}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={field ? { source: "admin", ...field } : { type: "text", required: false, source: "admin" }}
        onValuesChange={(ch) => {
          if (!field && ch.label !== undefined) form.setFieldsValue({ key: slugKey(ch.label) });
        }}
      >
        <Form.Item label="Label (shown to the admin)" name="label" rules={[{ required: true, message: "Enter a label" }]}>
          <Input placeholder="e.g. Lessee TIN" autoFocus />
        </Form.Item>
        <Form.Item
          label="Key"
          name="key"
          extra={field ? "The key cannot change because it is used in the text." : "Used in the text as {{custom.key}}"}
          rules={[
            {
              validator: (_, v) => {
                if (field) return Promise.resolve();
                const k = slugKey(v || form.getFieldValue("label"));
                return existingKeys.includes(k) ? Promise.reject(new Error("A field with this key already exists")) : Promise.resolve();
              },
            },
          ]}
        >
          <Input disabled={!!field} prefix="custom." />
        </Form.Item>
        <Form.Item
          label="Who fills it"
          name="source"
          extra={
            source === "signer"
              ? "The name the customer signs with in the app. Pre-filled with the customer's name; they can change it. Tip: default {{customer.name}}."
              : source === "customer"
                ? "The customer types it in the app (or on the signing page) before signing."
                : "Filled by the admin when preparing the contract for a booking."
          }
        >
          <Select options={FIELD_SOURCES} />
        </Form.Item>
        <div className="ct-grid2">
          <Form.Item label="Type" name="type">
            <Select options={FIELD_TYPES} />
          </Form.Item>
          {source === "customer" ? (
            <Form.Item label="Customer must fill it" name="required" valuePropName="checked">
              <Switch />
            </Form.Item>
          ) : (
            <Form.Item label="Required">
              <span className="ct-muted ct-small">{source === "signer" ? "Always (the signing name)" : "Always, before sending"}</span>
            </Form.Item>
          )}
        </div>
        {type === "select" && (
          <Form.Item label="Choices" name="options" rules={[{ required: true, message: "Add at least one choice" }]}>
            <Select mode="tags" placeholder="Type a choice and press Enter" />
          </Form.Item>
        )}
        <Form.Item label="Default value" name="default">
          <Input placeholder="Optional" />
        </Form.Item>
        <Form.Item label="Help text" name="help">
          <Input placeholder="Optional hint shown when filling the contract" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export const FieldsPanel = ({ document, onChange, allowCustom = true }) => {
  const bus = useEditorBus();
  const [edit, setEdit] = useState(null); // null | "new" | field
  const fields = document?.fields || [];
  const setFields = (next) => onChange({ ...document, fields: next });

  const pick = (key) => {
    const token = `{{${key}}}`;
    if (!bus.insert(token)) {
      navigator.clipboard?.writeText(token).catch(() => {});
      message.info(`Copied ${token} — click into a text box first to insert it directly`);
    }
  };

  return (
    <div className="ct-panel">
      {allowCustom && (
        <section className="ct-panel-sec">
          <div className="ct-panel-h">
            <span>Custom fields</span>
            <Button size="small" icon={<PlusOutlined />} onClick={() => setEdit("new")}>
              New
            </Button>
          </div>
          <p className="ct-muted ct-small">Extra details the admin fills for each booking (TIN, address, representative…).</p>
          {fields.map((f) => (
            <div key={f.key} className="ct-cfield">
              <button type="button" className="ct-cfield-main" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(`custom.${f.key}`)} title="Insert">
                <b>{f.label}</b>
                <code>custom.{f.key}</code>
              </button>
              {isCustomerField(f) && <span className="ct-tag ct-tag-cust">{f.source === "signer" ? "Signer" : "Customer"}</span>}
              {f.source === "customer" && f.required && <span className="ct-tag">Required</span>}
              <button type="button" className="ct-ib" onClick={() => setEdit(f)} aria-label="Edit field">
                <EditOutlined />
              </button>
              <Popconfirm title="Remove this field?" description="Text that uses it will show a blank." okText="Remove" okButtonProps={{ danger: true }} onConfirm={() => setFields(fields.filter((x) => x.key !== f.key))}>
                <button type="button" className="ct-ib is-danger" aria-label="Remove field">
                  <DeleteOutlined />
                </button>
              </Popconfirm>
            </div>
          ))}
          {!fields.length && <div className="ct-empty-sm">No custom fields yet</div>}
        </section>
      )}
      <section className="ct-panel-sec">
        <div className="ct-panel-h">
          <span>Fields from the database</span>
        </div>
        <p className="ct-muted ct-small">Click a text box in the contract, then click a field to insert it. It is filled automatically for each booking.</p>
        <FieldList onPick={pick} maxHeight={560} />
      </section>
      <CustomFieldModal
        open={!!edit}
        field={edit && edit !== "new" ? edit : null}
        existingKeys={fields.map((f) => f.key)}
        onClose={() => setEdit(null)}
        onSave={(f) => {
          setFields(edit === "new" ? [...fields, f] : fields.map((x) => (x.key === f.key ? f : x)));
          setEdit(null);
        }}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ settings */
const ACCENTS = ["#09234c", "#1d4f91", "#0f766e", "#7c2d12", "#c2410c", "#4c1d95", "#111827"];

const ImageField = ({ label, value, onChange, hint }) => {
  const [busy, setBusy] = useState(false);
  return (
    <div className="ct-imgfield">
      <div className="ct-label">{label}</div>
      <div className="ct-imgfield-row">
        <div className="ct-imgfield-prev">{value ? <img src={value} alt="" /> : <span className="ct-muted ct-small">None</span>}</div>
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={async (file) => {
            setBusy(true);
            try {
              const url = await ContractApi.uploadImage(file);
              if (url) onChange(url);
            } catch {
              // toast shown by api interceptor
            } finally {
              setBusy(false);
            }
            return false;
          }}
        >
          <Button size="small" icon={<UploadOutlined />} loading={busy}>
            {value ? "Replace" : "Upload"}
          </Button>
        </Upload>
        {value && (
          <Button size="small" type="text" danger onClick={() => onChange("")}>
            Remove
          </Button>
        )}
      </div>
      {hint && <div className="ct-muted ct-small">{hint}</div>}
    </div>
  );
};

export const SettingsPanel = ({ document, onChange }) => {
  const s = document?.settings || {};
  const c = s.company || {};
  const set = (patch) => onChange({ ...document, settings: { ...s, ...patch } });
  const setCo = (patch) => set({ company: { ...c, ...patch } });
  const year = new Date().getFullYear();
  const preview = (s.numberFormat || "WCR/CRA/{seq}/{year}")
    .replace(/\{seq\}/g, "001")
    .replace(/\{year\}/g, String(year))
    .replace(/\{month\}/g, String(new Date().getMonth() + 1).padStart(2, "0"))
    .replace(/\{code\}/g, "WL-2026-ABC123");

  return (
    <div className="ct-panel">
      <section className="ct-panel-sec">
        <div className="ct-panel-h">
          <span>Company (Lessor)</span>
        </div>
        <div className="ct-stack">
          <label className="ct-label">Legal name</label>
          <Input value={c.name} onChange={(e) => setCo({ name: e.target.value })} />
          <label className="ct-label">Short name (used in the text)</label>
          <Input value={c.shortName} onChange={(e) => setCo({ shortName: e.target.value })} placeholder="e.g. WHEELLOL" />
          <label className="ct-label">Address</label>
          <Input.TextArea autoSize={{ minRows: 2 }} value={c.address} onChange={(e) => setCo({ address: e.target.value })} />
          <div className="ct-grid2">
            <div>
              <label className="ct-label">Phone</label>
              <Input value={c.phone} onChange={(e) => setCo({ phone: e.target.value })} />
            </div>
            <div>
              <label className="ct-label">TIN</label>
              <Input value={c.tin} onChange={(e) => setCo({ tin: e.target.value })} />
            </div>
          </div>
          <label className="ct-label">Email</label>
          <Input value={c.email} onChange={(e) => setCo({ email: e.target.value })} />
          <ImageField label="Logo" value={c.logoUrl} onChange={(v) => setCo({ logoUrl: v })} hint="Shown in the title block" />
          <ImageField label="Company signature" value={c.signatureUrl} onChange={(v) => setCo({ signatureUrl: v })} hint="Optional: printed in the lessor box" />
          <ImageField label="Company stamp" value={c.stampUrl} onChange={(v) => setCo({ stampUrl: v })} hint="Optional: printed next to the signature" />
        </div>
      </section>

      <section className="ct-panel-sec">
        <div className="ct-panel-h">
          <span>Numbering & money</span>
        </div>
        <div className="ct-stack">
          <label className="ct-label">Contract number format</label>
          <Input value={s.numberFormat} onChange={(e) => set({ numberFormat: e.target.value })} placeholder="WCR/CRA/{seq}/{year}" />
          <div className="ct-muted ct-small">
            Use {"{seq}"} {"{year}"} {"{month}"} {"{code}"} · Next: <b>{preview}</b>
          </div>
          <div className="ct-grid2">
            <div>
              <label className="ct-label">Currency</label>
              <Input value={s.currency} onChange={(e) => set({ currency: e.target.value })} />
            </div>
            <div>
              <label className="ct-label">VAT %</label>
              <InputNumber min={0} max={100} style={{ width: "100%" }} value={s.vatRate} onChange={(v) => set({ vatRate: v ?? 0 })} />
            </div>
          </div>
          <div className="ct-grid2">
            <div>
              <label className="ct-label">Withholding %</label>
              <InputNumber min={0} max={100} style={{ width: "100%" }} value={s.withholdingRate} onChange={(v) => set({ withholdingRate: v ?? 0 })} />
            </div>
            <div>
              <label className="ct-label">Prices include VAT</label>
              <Switch checked={s.pricesIncludeVat === true} onChange={(v) => set({ pricesIncludeVat: v })} checkedChildren="Incl. VAT" unCheckedChildren="VAT excl." />
            </div>
          </div>
        </div>
      </section>

      <section className="ct-panel-sec">
        <div className="ct-panel-h">
          <span>Look</span>
        </div>
        <div className="ct-stack">
          <label className="ct-label">Font</label>
          <Segmented
            block
            value={s.font || "serif"}
            onChange={(v) => set({ font: v })}
            options={[
              { value: "serif", label: "Classic" },
              { value: "book", label: "Book" },
              { value: "sans", label: "Modern" },
            ]}
          />
          <label className="ct-label">Text size</label>
          <Segmented block value={s.fontSize || 11} onChange={(v) => set({ fontSize: v })} options={[10, 11, 12].map((n) => ({ value: n, label: `${n} pt` }))} />
          <label className="ct-label">Accent colour</label>
          <div className="ct-swatches">
            {ACCENTS.map((a) => (
              <button
                key={a}
                type="button"
                aria-label={`Accent ${a}`}
                className={`ct-swatch ${(s.accent || "#09234c") === a ? "is-on" : ""}`}
                style={{ background: a }}
                onClick={() => set({ accent: a })}
              />
            ))}
            <ColorPicker size="small" value={s.accent || "#09234c"} onChangeComplete={(v) => set({ accent: v.toHexString() })} />
          </div>
        </div>
      </section>
    </div>
  );
};

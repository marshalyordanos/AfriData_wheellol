import React, { useEffect, useMemo, useState } from "react";
import { Form, Input, InputNumber, Select, Switch, message } from "antd";
import { MapPin, Navigation, ExternalLink } from "lucide-react";
import LocationService, { LOCATION_TYPES } from "./LocationService";

/** Add / edit a location. `record` is null for a new one. */
const LocationForm = ({ record, regions = [], nextOrder = 0, onDone, onCancel }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const type = Form.useWatch("type", form) || "REGION";
  const lat = Form.useWatch("latitude", form);
  const lng = Form.useWatch("longitude", form);
  const name = Form.useWatch("name", form);

  useEffect(() => {
    form.setFieldsValue(
      record
        ? { ...record, region: record.region || undefined }
        : { type: "REGION", isPickup: true, isActive: true, sortOrder: nextOrder }
    );
  }, [record]);

  const regionOptions = useMemo(
    () =>
      regions
        .filter((r) => r.name !== record?.name)
        .map((r) => ({ value: r.name, label: r.name })),
    [regions, record]
  );

  const hasCoords = typeof lat === "number" && typeof lng === "number";
  const mapUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : name
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, Ethiopia`)}`
    : null;

  const submit = async (values) => {
    const payload = {
      ...values,
      nameAm: values.nameAm || undefined,
      region: values.type === "CITY" ? values.region || undefined : undefined,
      latitude: values.latitude ?? undefined,
      longitude: values.longitude ?? undefined,
    };
    setSaving(true);
    try {
      if (record?.id) await LocationService.update(record.id, payload);
      else await LocationService.create(payload);
      message.success(record?.id ? "Location updated" : "Location added");
      onDone && onDone();
    } catch (e) {
      /* the API interceptor already shows the server message */
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={submit} requiredMark className="loc-form">
      <div className="loc-section-title">Where is it?</div>
      <div className="mp-grid-form">
        <Form.Item
          name="name"
          label="Name"
          rules={[
            { required: true, whitespace: true, message: "Name is required" },
            { max: 80, message: "Keep the name under 80 characters" },
          ]}
        >
          <Input prefix={<MapPin size={16} />} placeholder="e.g. Afar" autoFocus />
        </Form.Item>
        <Form.Item name="nameAm" label="Amharic name" tooltip="Shown in the app when the language is Amharic">
          <Input placeholder="e.g. አፋር" />
        </Form.Item>
      </div>

      <Form.Item name="type" label="Type" rules={[{ required: true, message: "Choose a type" }]}>
        <TypePicker />
      </Form.Item>

      {type === "CITY" && (
        <Form.Item
          name="region"
          label="Region"
          rules={[{ required: true, message: "Choose the region this city is in" }]}
        >
          <Select showSearch placeholder="Choose region" options={regionOptions} optionFilterProp="label" />
        </Form.Item>
      )}

      <div className="loc-section-title">
        Map position <span>optional · used for distance and the map pin</span>
      </div>
      <div className="mp-grid-form">
        <Form.Item
          name="latitude"
          label="Latitude"
          rules={[{ type: "number", min: -90, max: 90, message: "Latitude must be between -90 and 90" }]}
        >
          <InputNumber style={{ width: "100%" }} step={0.0001} placeholder="11.7559" prefix={<Navigation size={14} />} />
        </Form.Item>
        <Form.Item
          name="longitude"
          label="Longitude"
          rules={[{ type: "number", min: -180, max: 180, message: "Longitude must be between -180 and 180" }]}
        >
          <InputNumber style={{ width: "100%" }} step={0.0001} placeholder="40.9587" prefix={<Navigation size={14} />} />
        </Form.Item>
      </div>
      {mapUrl && (
        <a className="loc-maplink" href={mapUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={14} /> {hasCoords ? "Check this position on Google Maps" : "Find it on Google Maps"}
        </a>
      )}

      <div className="loc-section-title">In the app</div>
      <div className="loc-toggles">
        <ToggleRow
          name="isPickup"
          title="Pickup city"
          text="Customers can choose it as the city where the driver picks them up."
        />
        <ToggleRow name="isActive" title="Active" text="Inactive locations are hidden from the app." />
      </div>
      <Form.Item
        name="sortOrder"
        label="Order in lists"
        tooltip="Lower numbers come first"
        style={{ maxWidth: 220, marginTop: 16 }}
      >
        <InputNumber min={0} style={{ width: "100%" }} />
      </Form.Item>

      <div className="mp-form-actions">
        <button type="button" className="mp-btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="mp-btn mp-btn-primary" disabled={saving}>
          {saving ? "Saving…" : record?.id ? "Save changes" : "Add location"}
        </button>
      </div>
    </Form>
  );
};

const TypePicker = ({ value, onChange }) => (
  <div className="loc-types">
    {LOCATION_TYPES.map((t) => (
      <button
        type="button"
        key={t.value}
        className={`mp-choice ${value === t.value ? "is-on" : ""}`}
        onClick={() => onChange && onChange(t.value)}
      >
        <span className="mp-radio" />
        <span>
          <span className="mp-choice-title">{t.label}</span>
          <span className="mp-choice-sub">{t.sub}</span>
        </span>
      </button>
    ))}
  </div>
);

const ToggleRow = ({ name, title, text }) => (
  <div className="loc-toggle">
    <div>
      <div className="loc-toggle-title">{title}</div>
      <div className="loc-toggle-text">{text}</div>
    </div>
    <Form.Item name={name} valuePropName="checked" noStyle>
      <Switch />
    </Form.Item>
  </div>
);

export default LocationForm;

import React, { useEffect, useState } from "react";
import { Form, Input, Button, message } from "antd";
import {
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  SaveOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { Page, PageHeader, Btn, Card, FormSection } from "../components/modern/ModernUI";
import axios from "axios";
import UserService from "./user/UserService";


const initialValues = {
  phoneOne: "",
  phoneTwo: "",
  email: "",
  website: "",
  facebook: "",
  linkedin: "",
  instagram: "",
  tiktok: "",
  telegram: "",
  whatsapp: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  country: "",
  latitude: "",
  longitude: "",
};

const ProfileContactInfo = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setFetching(true);
      try {
        const res = await axios.get("/api/platform-contact-info");
        if (res.data) {
          form.setFieldsValue({
            ...initialValues,
            ...res.data,
          });
        }
      } catch (err) {
        // ignore if not found
      } finally {
        setFetching(false);
      }
    }
    fetchData();
    // eslint-disable-next-line
  }, []);

  const fetchPlatformContactInfo = async () => {
    const res = await UserService.getPlatformContactInfo();
    console.log("res444444", res);
    if (res) {
      form.setFieldsValue({
        ...initialValues,
        ...res,
      });
    }
  };
  useEffect(() => {
    fetchPlatformContactInfo();
  }, []);
  const onFinish = async (values) => {
    // Log all form data
    console.log("All Form Data:", values);
    setLoading(true);
    try {
        const data = await UserService.createOrUpdatePlatformContactInfo(values);

      message.success("Platform contact information updated successfully.");
    } catch (err) {
      message.error(
        err?.response?.data?.message || "Failed to update contact info."
      );
    } finally {
      setLoading(false);
    }
  };

  const v = Form.useWatch([], form) || {};
  const socials = [
    ["Facebook", v.facebook],
    ["LinkedIn", v.linkedin],
    ["Instagram", v.instagram],
    ["TikTok", v.tiktok],
    ["Telegram", v.telegram],
    ["WhatsApp", v.whatsapp],
  ].filter(([, val]) => val);
  const filled = Object.keys(initialValues).filter((k) => v[k]).length;
  const pct = Math.round((filled / Object.keys(initialValues).length) * 100);

  return (
    <Page>
      <PageHeader
        eyebrow="Access & settings"
        title="Platform contact info"
        subtitle="Shown to guests and hosts in the app, receipts and emails."
        actions={
          <Btn
            variant="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            disabled={fetching || loading}
          >
            {loading ? "Saving…" : "Save changes"}
          </Btn>
        }
      />

      <Form
        id="platform-contact-info-form"
        form={form}
        name="platformContactInfo"
        layout="vertical"
        initialValues={initialValues}
        onFinish={onFinish}
        autoComplete="off"
        disabled={fetching || loading}
        requiredMark={false}
      >
        <div className="mp-detail">
          <div className="mp-detail-main">
            <FormSection num={1} title="Contact" subtitle="How people reach the Wheellol team">
              <div className="mp-grid-form">
                <Form.Item
                  label="Primary phone"
                  name="phoneOne"
                  rules={[{ pattern: /^[0-9+\-\s()]{6,16}$/, message: "Enter a valid phone number." }]}
                >
                  <Input prefix={<PhoneOutlined />} placeholder="+251 911 000 000" allowClear maxLength={20} />
                </Form.Item>
                <Form.Item
                  label="Secondary phone"
                  name="phoneTwo"
                  rules={[{ pattern: /^[0-9+\-\s()]{6,16}$/, message: "Enter a valid phone number." }]}
                >
                  <Input prefix={<PhoneOutlined />} placeholder="+251 922 000 000" allowClear maxLength={20} />
                </Form.Item>
                <Form.Item label="Email" name="email" rules={[{ type: "email", message: "Enter a valid email." }]}>
                  <Input prefix={<MailOutlined />} placeholder="contact@yourcompany.com" allowClear maxLength={40} />
                </Form.Item>
                <Form.Item
                  label="Website"
                  name="website"
                  rules={[{ pattern: /^https?:\/\/[^\s]+$/, message: "Must start with http:// or https://" }]}
                >
                  <Input prefix={<GlobalOutlined />} placeholder="https://www.company.com" allowClear maxLength={64} />
                </Form.Item>
              </div>
            </FormSection>

            <FormSection num={2} title="Social media" subtitle="Usernames or full links — leave blank to hide">
              <div className="mp-grid-form">
                <Form.Item label="Facebook" name="facebook">
                  <Input placeholder="Username or URL" allowClear />
                </Form.Item>
                <Form.Item label="Instagram" name="instagram">
                  <Input placeholder="Username or URL" allowClear />
                </Form.Item>
                <Form.Item label="LinkedIn" name="linkedin">
                  <Input placeholder="Username or URL" allowClear />
                </Form.Item>
                <Form.Item label="TikTok" name="tiktok">
                  <Input placeholder="Username or URL" allowClear />
                </Form.Item>
                <Form.Item label="Telegram" name="telegram">
                  <Input placeholder="Username or URL" allowClear />
                </Form.Item>
                <Form.Item label="WhatsApp" name="whatsapp">
                  <Input placeholder="Number or link" allowClear />
                </Form.Item>
              </div>
            </FormSection>

            <FormSection num={3} title="Address" subtitle="Your office or head-quarters">
              <div className="mp-grid-form">
                <Form.Item label="Address line 1" name="addressLine1">
                  <Input placeholder="Address or building name" allowClear />
                </Form.Item>
                <Form.Item label="Address line 2" name="addressLine2">
                  <Input placeholder="Apartment, floor, etc. (optional)" allowClear />
                </Form.Item>
                <Form.Item label="City" name="city">
                  <Input placeholder="City" allowClear />
                </Form.Item>
                <Form.Item label="Country" name="country" initialValue="Ethiopia">
                  <Input placeholder="Country" allowClear />
                </Form.Item>
              </div>
            </FormSection>

            <FormSection num={4} title="Map location" subtitle="Coordinates used for the map pin">
              <div className="mp-grid-form">
                <Form.Item
                  label="Latitude"
                  name="latitude"
                  rules={[{ pattern: /^-?\d+(\.\d+)?$/, message: "Enter a valid latitude." }]}
                >
                  <Input placeholder="e.g. 8.9806" allowClear />
                </Form.Item>
                <Form.Item
                  label="Longitude"
                  name="longitude"
                  rules={[{ pattern: /^-?\d+(\.\d+)?$/, message: "Enter a valid longitude." }]}
                >
                  <Input placeholder="e.g. 38.7578" allowClear />
                </Form.Item>
              </div>
            </FormSection>
          </div>

          <aside className="mp-detail-side" style={{ position: "sticky", top: 88 }}>
            <Card title="Preview" subtitle="How the contact card appears to users">
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="mp-thumb"><PhoneOutlined /></span>
                  <div>
                    <div className="mp-cell-main">{v.phoneOne || <span className="mp-muted">No phone yet</span>}</div>
                    {v.phoneTwo && <div className="mp-cell-sub">{v.phoneTwo}</div>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="mp-thumb"><MailOutlined /></span>
                  <div className="mp-cell-main" style={{ wordBreak: "break-all" }}>
                    {v.email || <span className="mp-muted">No email yet</span>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="mp-thumb"><EnvironmentOutlined /></span>
                  <div>
                    <div className="mp-cell-main">
                      {[v.addressLine1, v.addressLine2].filter(Boolean).join(", ") || <span className="mp-muted">No address yet</span>}
                    </div>
                    <div className="mp-cell-sub">{[v.city, v.country].filter(Boolean).join(", ")}</div>
                  </div>
                </div>
                {socials.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 4 }}>
                    {socials.map(([k]) => (
                      <span key={k} className="mp-pill mp-pill-gray">{k}</span>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 10 }}>
                <span style={{ fontWeight: 600 }}>Profile completeness</span>
                <span style={{ fontWeight: 700 }}>{pct}%</span>
              </div>
              <div className="mp-stat-bar" style={{ height: 8, "--mp-accent": "#fc6b38" }}>
                <span style={{ width: `${pct}%` }} />
              </div>
              <div className="mp-cell-sub" style={{ marginTop: 10 }}>
                {filled} of {Object.keys(initialValues).length} fields filled
              </div>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                style={{ marginTop: 16, height: 46 }}
                disabled={fetching || loading}
              >
                Save changes
              </Button>
            </Card>
          </aside>
        </div>
      </Form>
    </Page>
  );
};

export default ProfileContactInfo;

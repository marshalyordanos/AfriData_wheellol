import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  message,
  Card,
  Typography,
  Space,
} from "antd";
import {
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import axios from "axios";
import UserService from "./user/UserService";

const { Title } = Typography;

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

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        padding: 0,
        background: "#fafbfc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center", // ensure vertical centering
      }}
    >
      <Title level={3} style={{ fontWeight: 700, margin: "40px 0 32px 0", textAlign: "center" }}>
        Platform Contact Information
      </Title>
      {/* Responsive horizontal wrapper with two white containers (cards) */}
      <Form
        id="platform-contact-info-form"
        form={form}
        name="platformContactInfo"
        layout="vertical"
        initialValues={initialValues}
        onFinish={onFinish}
        autoComplete="off"
        disabled={fetching || loading}
        style={{ width: "100%" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 32,
            width: "100%",
            maxWidth: 1300,
            padding: 0,
            justifyContent: "center",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          {/* First container - Contact + Social */}
          <Card
            bordered={false}
            style={{
              flex: "1 1 410px",
              maxWidth: 520,
              minWidth: 320,
              boxShadow:
                "0 4px 24px 0 rgba(60,72,88,0.12), 0 1.5px 5px 0 rgba(60,72,88,0.06)",
              borderRadius: 16,
              padding: 0,
            }}
            bodyStyle={{ padding: "40px 32px" }}
          >
            {/* Contact Info */}
            <Title level={5} style={{ marginBottom: 16 }}>
              Contact
            </Title>
            <Form.Item
              label="Primary Phone"
              name="phoneOne"
              rules={[
                {
                  pattern: /^[0-9+\-\s()]{6,16}$/,
                  message: "Enter a valid phone number.",
                  required: false,
                },
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="+251 911 000 000"
                allowClear
                maxLength={20}
              />
            </Form.Item>
            <Form.Item
              label="Secondary Phone"
              name="phoneTwo"
              rules={[
                {
                  pattern: /^[0-9+\-\s()]{6,16}$/,
                  message: "Enter a valid phone number.",
                  required: false,
                },
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="+251 922 000 000"
                allowClear
                maxLength={20}
              />
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { type: "email", message: "Enter a valid email." },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="contact@yourcompany.com"
                allowClear
                maxLength={40}
              />
            </Form.Item>
            <Form.Item
              label="Website"
              name="website"
              rules={[
                {
                  pattern: /^https?:\/\/[^\s]+$/,
                  message: "Enter a valid URL (must start with http:// or https://)",
                  required: false,
                },
              ]}
            >
              <Input
                prefix={<GlobalOutlined />}
                placeholder="https://www.company.com"
                allowClear
                maxLength={64}
              />
            </Form.Item>
            {/* Social Media */}
            <Title level={5} style={{ marginTop: 32, marginBottom: 16 }}>
              Social Media
            </Title>
            <Form.Item label="Facebook" name="facebook">
              <Input placeholder="Facebook Username or URL" allowClear />
            </Form.Item>
            <Form.Item label="LinkedIn" name="linkedin">
              <Input placeholder="LinkedIn Username or URL" allowClear />
            </Form.Item>
            <Form.Item label="Instagram" name="instagram">
              <Input placeholder="Instagram Username or URL" allowClear />
            </Form.Item>
            <Form.Item label="TikTok" name="tiktok">
              <Input placeholder="TikTok Username or URL" allowClear />
            </Form.Item>
            <Form.Item label="Telegram" name="telegram">
              <Input placeholder="Telegram Username or URL" allowClear />
            </Form.Item>
            <Form.Item label="WhatsApp" name="whatsapp">
              <Input placeholder="WhatsApp Number or Link" allowClear />
            </Form.Item>
          </Card>
          {/* Second container - Address + Location */}
          <Card
            bordered={false}
            style={{
              flex: "1 1 410px",
              maxWidth: 520,
              minWidth: 320,
              boxShadow:
                "0 4px 24px 0 rgba(60,72,88,0.12), 0 1.5px 5px 0 rgba(60,72,88,0.06)",
              borderRadius: 16,
              padding: 0,
              minHeight: 660,
              display: "flex",
              flexDirection: "column",
            }}
            bodyStyle={{ padding: "40px 32px", height: "100%" }}
          >
            <Title level={5} style={{}}>
              Address
            </Title>
            <Form.Item label="Address Line 1" name="addressLine1">
              <Input placeholder="Address or Building Name" allowClear />
            </Form.Item>
            <Form.Item label="Address Line 2" name="addressLine2">
              <Input placeholder="Apartment, floor, etc. (optional)" allowClear />
            </Form.Item>
            <Form.Item label="City" name="city">
              <Input placeholder="City" allowClear />
            </Form.Item>
            <Form.Item label="Country" name="country" initialValue="Ethiopia">
              <Input placeholder="Country" allowClear />
            </Form.Item>
            <Title level={5} style={{ marginTop: 32 }}>
              Location (Coordinates)
            </Title>
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <Form.Item
                label="Latitude"
                name="latitude"
                rules={[
                  { pattern: /^-?\d+(\.\d+)?$/, message: "Enter a valid latitude." },
                ]}
              >
                <Input placeholder="e.g. 8.9806" allowClear />
              </Form.Item>
              <Form.Item
                label="Longitude"
                name="longitude"
                rules={[
                  { pattern: /^-?\d+(\.\d+)?$/, message: "Enter a valid longitude." },
                ]}
              >
                <Input placeholder="e.g. 38.7578" allowClear />
              </Form.Item>
            </Space>
            <div style={{ flex: 1 }} />
            <Form.Item style={{ marginTop: 42 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                style={{
                  height: 48,
                  fontWeight: 600,
                  fontSize: 18,
                  borderRadius: 8,
                  backgroundColor: "#09244C",
                }}
                disabled={fetching || loading}
              >
                Save Changes
              </Button>
            </Form.Item>
          </Card>
        </div>
      </Form>
    </div>
  );
};

export default ProfileContactInfo;
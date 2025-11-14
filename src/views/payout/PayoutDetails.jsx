import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Descriptions,
  Tag,
  List,
  Button,
  message,
  Spin,
  Typography,
  Space,
  Divider,
} from "antd";
import {
  CreditCardOutlined,
  ArrowLeftOutlined,
  SyncOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import PaymentService from "./PayoutService";

const { Title, Text } = Typography;

const statusColor = (s) => {
  if (!s) return "default";
  const st = String(s).toLowerCase();
  if (st.includes("completed")) return "green";
  if (st.includes("pending")) return "orange";
  if (st.includes("refunded") || st.includes("on hold")) return "blue";
  if (st.includes("failed") || st.includes("declined")) return "red";
  return "default";
};

const PaymentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [vw, setVw] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await PaymentService.getPaymentById(id);
      setPayment(res || null);
    } catch (err) {
      console.error(err);
      message.error("Failed to load payment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e) => setIsMobile(e.matches);
    handler(mq);
    mq.addEventListener?.("change", handler);

    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    onResize();

    return () => {
      mq.removeEventListener?.("change", handler);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  if (loading && !payment)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Spin size="large" tip="Loading payment details..." />
      </div>
    );

  if (!payment)
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Payment not found
        </Text>
      </div>
    );

  return (
    <div
      style={{
        padding: isMobile ? "12px 16px" : "24px 40px",
        background: "#f5f7fa",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <Space>
          <CreditCardOutlined style={{ fontSize: 26, color: "#1677ff" }} />
          <Title level={3} style={{ margin: 0 }}>
            Payment Overview
          </Title>
        </Space>

        <Space>
          <Button
            icon={<SyncOutlined />}
            onClick={() => {
              if (loading) return;
              load();
            }}
            type="default"
            loading={loading}
            style={{ marginRight: 8 }}
          >
            Refresh
          </Button>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            type="primary"
          >
            Back
          </Button>
        </Space>
      </div>

      {/* Summary Card */}
      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Descriptions
          title="Payment Summary"
          column={1}
          bordered
          labelStyle={{ fontWeight: 500, width: "40%" }}
          contentStyle={{ background: "#fafafa" }}
          size={"small"}
        >
          <Descriptions.Item label="Payer">
            {payment.payer ? (
              <Space>
                <UserOutlined />
                <Text>
                  {payment.payer.firstName || ""} {payment.payer.lastName || ""}
                </Text>
              </Space>
            ) : (
              "-"
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Amount">
            <Text strong style={{ color: "#52c41a", fontSize: 16 }}>
              {payment.amount} {payment.currency}
            </Text>
          </Descriptions.Item>

          <Descriptions.Item label="Method">
            {payment.method || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Type">
            {payment.type || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Status">
            <Tag
              color={statusColor(payment.status)}
              style={{
                textTransform: "capitalize",
                fontWeight: 500,
                padding: "4px 10px",
              }}
            >
              {payment.status}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Transaction ID">
            <Text code>{payment.transactionId || "-"}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Created At">
            <Space>
              <ClockCircleOutlined />
              {payment.createdAt
                ? new Date(payment.createdAt).toLocaleString()
                : "-"}
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Transactions */}
      <Card
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap",
            }}
          >
            <CheckCircleOutlined style={{ color: "#1677ff" }} />
            <Text strong style={{ whiteSpace: "nowrap" }}>
              Transactions
            </Text>
            <Tag color="blue" style={{ marginLeft: 6 }}>
              {Array.isArray(payment.transactions)
                ? payment.transactions.length
                : 0}
            </Tag>
          </div>
        }
        bordered={false}
        style={{
          marginTop: 20,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        {payment.transactions?.length ? (
          <List
            itemLayout="horizontal"
            dataSource={payment.transactions}
            renderItem={(t) => (
              <List.Item
                style={{
                  borderBottom: "1px solid #f0f0f0",
                  padding: "14px 0",
                }}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color={statusColor(t.status)}>{t.status}</Tag>
                      <Text strong>{t.type}</Text>
                    </Space>
                  }
                  description={
                    <Text type="secondary">
                      Amount: {t.amount} — Created:{" "}
                      {t.createdAt
                        ? new Date(t.createdAt).toLocaleString()
                        : "-"}
                    </Text>
                  }
                />
                <Text code>{t.transactionId || "-"}</Text>
              </List.Item>
            )}
          />
        ) : (
          <Text type="secondary">No transactions found</Text>
        )}
      </Card>

      <Divider style={{ margin: "40px 0 0" }}>
        <Text type="secondary">End of Payment Details</Text>
      </Divider>
    </div>
  );
};

export default PaymentDetails;

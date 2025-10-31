import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Descriptions,
  Tag,
  Button,
  message,
  Spin,
  Typography,
  Space,
  Modal,
  Form,
  InputNumber,
  Input,
  Popconfirm,
  Avatar,
} from "antd";
import { WarningOutlined, ClockCircleOutlined } from "@ant-design/icons";
import DisputeService from "./DisputeService";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../redux/auth/authSlice";

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

const DisputeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolveForm] = Form.useForm();

  const authUser = useSelector(selectCurrentUser);
  const currentUserId = authUser?.user?.id || authUser?.id || null;

  // Detect small screens
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await DisputeService.getDisputeById(id);
      setDispute(res || null);
    } catch (err) {
      console.error(err);
      message.error("Failed to load dispute");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading && !dispute)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Spin size="large" tip="Loading dispute details..." />
      </div>
    );

  if (!dispute)
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Dispute not found
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
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          gap: isMobile ? 12 : 0,
          marginBottom: 20,
        }}
      >
        <Space>
          <WarningOutlined style={{ fontSize: 26, color: "#1677ff" }} />
          <Title level={3} style={{ margin: 0 }}>
            Dispute Details
          </Title>
        </Space>

        <Space wrap>
          <Popconfirm
            title="Mark dispute as UNDER_REVIEW?"
            onConfirm={async () => {
              try {
                await DisputeService.reviewDispute({}, id);
                message.success("Marked UNDER_REVIEW");
                load();
              } catch {
                message.error("Operation failed");
              }
            }}
          >
            <Button type="default" size={isMobile ? "small" : "middle"}>
              Review
            </Button>
          </Popconfirm>

          <Button
            type="primary"
            size={isMobile ? "small" : "middle"}
            onClick={() => {
              resolveForm.setFieldsValue({
                refundAmount: dispute?.payment?.amount || 0,
                notes: "",
              });
              setResolveModalVisible(true);
            }}
          >
            Resolve
          </Button>

          <Popconfirm
            title="Reject dispute?"
            onConfirm={async () => {
              try {
                await DisputeService.rejectDispute({}, id);
                message.success("Dispute rejected");
                load();
              } catch {
                message.error("Operation failed");
              }
            }}
          >
            <Button danger size={isMobile ? "small" : "middle"}>
              Reject
            </Button>
          </Popconfirm>
        </Space>
      </div>

      {/* Dispute Summary */}
      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Descriptions
          title="Dispute Summary"
          column={isMobile ? 1 : 1}
          bordered
          labelStyle={{ fontWeight: 500, width: "40%" }}
          contentStyle={{ background: "#fafafa" }}
          size="small"
        >
          <Descriptions.Item label="Reason">
            {dispute.reason || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag
              color={statusColor(dispute.status)}
              style={{
                textTransform: "capitalize",
                fontWeight: 500,
                padding: "4px 10px",
              }}
            >
              {dispute.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            <Space>
              <ClockCircleOutlined />
              {dispute.createdAt
                ? new Date(dispute.createdAt).toLocaleString()
                : "-"}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Updated At">
            <Space>
              <ClockCircleOutlined />
              {dispute.updatedAt
                ? new Date(dispute.updatedAt).toLocaleString()
                : "-"}
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* User, Booking, Payment Cards */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          marginTop: 20,
        }}
      >
        <Card style={{ flex: "1 1 300px" }} bordered>
          <Title level={5}>User</Title>
          {dispute.user ? (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Avatar
                size={48}
                src={dispute.user.profilePhoto}
                alt={`${dispute.user.firstName} ${dispute.user.lastName}`}
              >
                {`${(dispute.user.firstName || "").charAt(0)}${(
                  dispute.user.lastName || ""
                ).charAt(0)}`}
              </Avatar>
              <div>
                <div style={{ fontWeight: 700 }}>
                  {dispute.user.firstName} {dispute.user.lastName}
                </div>
                <div style={{ color: "#666" }}>{dispute.user.email}</div>
                <div style={{ color: "#666", marginTop: 4 }}>
                  {dispute.user.phone}
                </div>
              </div>
            </div>
          ) : (
            "-"
          )}
        </Card>

        <Card style={{ flex: "1 1 300px" }} bordered>
          <Title level={5}>Booking</Title>
          {dispute.booking ? (
            <div style={{ color: "#333" }}>
              <div>Booking ID: {dispute.booking.id}</div>
              <div>
                Start:{" "}
                {dispute.booking.startDate
                  ? new Date(dispute.booking.startDate).toLocaleString()
                  : "-"}
              </div>
              <div>
                End:{" "}
                {dispute.booking.endDate
                  ? new Date(dispute.booking.endDate).toLocaleString()
                  : "-"}
              </div>
              <div>Total: {dispute.booking.totalPrice}</div>
              <div>
                Status: <Tag>{dispute.booking.status}</Tag>
              </div>
            </div>
          ) : (
            "-"
          )}
        </Card>

        <Card style={{ flex: "1 1 300px" }} bordered>
          <Title level={5}>Payment</Title>
          {dispute.payment ? (
            <div style={{ color: "#333" }}>
              <div>
                Amount: {dispute.payment.amount} {dispute.payment.currency}
              </div>
              <div>Method: {dispute.payment.method || "-"}</div>
              <div>
                Status:{" "}
                <Tag color={statusColor(dispute.payment.status)}>
                  {dispute.payment.status}
                </Tag>
              </div>
              <div>
                Transaction:{" "}
                <Text code>{dispute.payment.transactionId || "-"}</Text>
              </div>
            </div>
          ) : (
            "-"
          )}
        </Card>
      </div>

      {/* Resolve Modal */}
      <Modal
        title="Resolve Dispute"
        open={resolveModalVisible}
        onCancel={() => setResolveModalVisible(false)}
        onOk={async () => {
          try {
            const values = await resolveForm.validateFields();
            const payload = {
              adminId: currentUserId,
              refundAmount: values.refundAmount || 0,
              notes: values.notes || "",
            };
            await DisputeService.resolveDispute(payload, id);
            message.success("Dispute resolved");
            setResolveModalVisible(false);
            load();
          } catch (err) {
            console.error(err);
            message.error("Operation failed");
          }
        }}
        okText="Resolve"
      >
        <Form form={resolveForm} layout="vertical">
          <Form.Item label="Refund Amount" name="refundAmount">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DisputeDetails;

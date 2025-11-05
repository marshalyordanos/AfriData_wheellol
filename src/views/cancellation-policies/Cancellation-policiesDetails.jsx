import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Descriptions,
  Tag,
  List,
  Button,
  Spin,
  Typography,
  Space,
  Divider,
} from "antd";
import {
  CreditCardOutlined,
  ArrowLeftOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCancellationPolicyById,
  selectCancellationPolicy,
  selectCancellationLoading,
} from "./Cancellation-policiesRedux";

const { Title, Text } = Typography;

const statusColor = (s) => {
  if (!s) return "default";
  const st = String(s).toLowerCase();
  if (st.includes("active") || st.includes("completed")) return "green";
  if (st.includes("pending")) return "orange";
  if (st.includes("inactive") || st.includes("archived")) return "blue";
  if (st.includes("failed") || st.includes("declined")) return "red";
  return "default";
};

const CancellationPolicyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const policy = useSelector(selectCancellationPolicy);
  const loading = useSelector(selectCancellationLoading);

  useEffect(() => {
    if (!id) return;
    dispatch(fetchCancellationPolicyById(id));
  }, [id, dispatch]);

  if (loading && !policy)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Spin size="large" tip="Loading cancellation policy..." />
      </div>
    );

  if (!policy)
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Cancellation policy not found
        </Text>
      </div>
    );

  return (
    <div
      style={{
        padding: "24px 40px",
        background: "#f5f7fa",
        minHeight: "100vh",
      }}
    >
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
            Cancellation Policy
          </Title>
        </Space>

        <Space>
          <Button
            icon={<SyncOutlined />}
            onClick={() => dispatch(fetchCancellationPolicyById(id))}
            type="default"
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

      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
      >
        <Descriptions
          title="Policy Summary"
          column={1}
          bordered
          labelStyle={{ fontWeight: 500, width: "40%" }}
          contentStyle={{ background: "#fafafa" }}
          size={"small"}
        >
          <Descriptions.Item label="User Type">
            {policy.userType || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Days Before Trip">
            {policy.daysBeforeTrip ?? "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Refund Percent">
            {policy.refundPercent ?? "-"}%
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag
              color={statusColor(policy.status)}
              style={{
                textTransform: "capitalize",
                fontWeight: 500,
                padding: "4px 10px",
              }}
            >
              {policy.status || "-"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            <Space>
              <ClockCircleOutlined />
              {policy.createdAt
                ? new Date(policy.createdAt).toLocaleString()
                : "-"}
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>

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
              Rules
            </Text>
            <Tag color="blue" style={{ marginLeft: 6 }}>
              {Array.isArray(policy.rules) ? policy.rules.length : 0}
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
        {policy.rules?.length ? (
          <List
            itemLayout="horizontal"
            dataSource={policy.rules}
            renderItem={(r) => (
              <List.Item
                style={{ borderBottom: "1px solid #f0f0f0", padding: "14px 0" }}
              >
                <List.Item.Meta
                  title={<Text strong>{r.title || "Rule"}</Text>}
                  description={
                    <Text type="secondary">{r.description || ""}</Text>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Text type="secondary">No rules found</Text>
        )}
      </Card>

      <Divider style={{ margin: "40px 0 0" }}>
        <Text type="secondary">End of Policy Details</Text>
      </Divider>
    </div>
  );
};

export default CancellationPolicyDetails;

// Shared "change status" actions for booking requests.
// Used by the three-dot menu on /dash/requests and the action button on /dash/requests/:id.
import React, { useEffect, useState } from "react";
import { Form, InputNumber, Modal, message } from "antd";
import {
  CheckCircleOutlined,
  CarOutlined,
  CheckOutlined,
  MessageOutlined,
  StopOutlined,
  UndoOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import RentalRequestService, { NEEDS_PRICE, STATUS, etb } from "./rentalRequestHelpers";

const ACTIONS = [
  { status: "UNDER_NEGOTIATION", label: "Mark negotiating", icon: <MessageOutlined /> },
  { status: "APPROVED", label: "Accept request", icon: <CheckCircleOutlined /> },
  { status: "ACTIVE", label: "Mark on trip", icon: <CarOutlined /> },
  { status: "COMPLETED", label: "Mark completed", icon: <CheckOutlined /> },
  { status: "CANCELLED", label: "Cancel request", icon: <StopOutlined />, danger: true },
];

// Menu items for antd Dropdown. Keys are "status:<STATUS>" (plus optional "view").
export const statusMenuItems = (req, { withView = false } = {}) => {
  const items = [];
  if (withView) items.push({ key: "view", icon: <EyeOutlined />, label: "View details" });
  if (req?.status === "CANCELLED") {
    items.push({ key: "status:PENDING", icon: <UndoOutlined />, label: "Reopen request" });
    return items;
  }
  if (withView && (req?.status && req.status !== "COMPLETED")) items.push({ type: "divider" });
  // Only the steps that make sense from the current status (no going back)
  // "Approved" is set only by the customer accepting in the mobile app.
  const allowed = {
    PENDING: ["UNDER_NEGOTIATION", "CANCELLED"],
    UNDER_NEGOTIATION: ["CANCELLED"],
    APPROVED: ["ACTIVE", "CANCELLED"],
    ACTIVE: ["COMPLETED"],
    COMPLETED: [],
  }[req?.status] || [];
  if (req?.status === "UNDER_NEGOTIATION") {
    items.push({
      key: "waiting",
      disabled: true,
      icon: <CheckCircleOutlined />,
      label: "Waiting for the customer to sign the contract",
    });
  }
  ACTIONS.filter((a) => allowed.includes(a.status)).forEach((a) =>
    items.push({ key: `status:${a.status}`, icon: a.icon, label: a.label, danger: a.danger }),
  );
  return items;
};

// Confirm modal. If the target status needs an agreed price and none is set,
// it asks for the price and saves both together.
export const StatusChangeModal = ({ request, status, onClose, onSaved }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const open = !!(request && status);
  const hasPrice = request?.totalPrice > 0;
  const needsPrice = open && NEEDS_PRICE.includes(status) && !hasPrice;

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  const submit = async () => {
    const values = needsPrice ? await form.validateFields() : {};
    setSaving(true);
    try {
      const data = await RentalRequestService.update(request.id, {
        status,
        ...(needsPrice ? { totalPrice: values.totalPrice } : {}),
      });
      message.success(`Status changed to ${STATUS[status]?.label || status}`);
      onSaved && onSaved(data);
      onClose();
    } catch {
      // error toast is shown by the api interceptor
    } finally {
      setSaving(false);
    }
  };

  const target = STATUS[status]?.label || status || "";
  const unpaid = status === "COMPLETED" && hasPrice && request?.balance > 0;

  return (
    <Modal
      open={open}
      title={`Change status to "${target}"?`}
      okText={`Mark ${target.toLowerCase()}`}
      okButtonProps={{ danger: status === "CANCELLED", loading: saving }}
      onOk={submit}
      onCancel={onClose}
      destroyOnHidden
    >
      <p style={{ marginBottom: 12 }}>
        Request <b>{request?.trackingCode}</b> · {request?.contactName}
        <br />
        {STATUS[request?.status]?.label || request?.status} → <b>{target}</b>
      </p>
      {unpaid && (
        <p style={{ color: "#b42318", marginBottom: 12 }}>{etb(request.balance)} is still unpaid.</p>
      )}
      {needsPrice && (
        <Form form={form} layout="vertical">
          <Form.Item
            label="Agreed total price (ETB)"
            name="totalPrice"
            extra="A price is required before the request can be accepted, started or completed."
            rules={[{ required: true, message: "Enter the agreed price" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} placeholder="e.g. 25000" autoFocus />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

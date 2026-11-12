import React, { useEffect, useState } from "react";
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, Upload, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import RentalRequestService, { PAYMENT_METHODS, etb } from "./rentalRequestHelpers";

// Record a payment (with optional receipt image/PDF) for a rental request.
// `request` needs: id, trackingCode, totalPrice, balance
const RecordPaymentModal = ({ request, open, onClose, onSaved }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [fileList, setFileList] = useState([]);
  const hasPrice = !!request?.totalPrice;

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ method: "CASH", paidAt: dayjs() });
      setFileList([]);
    }
  }, [open, form]);

  const submit = async (values) => {
    setSaving(true);
    try {
      const data = await RentalRequestService.addPayment(request.id, {
        amount: values.amount,
        method: values.method,
        reference: values.reference,
        note: values.note,
        paidAt: values.paidAt ? values.paidAt.toISOString() : undefined,
        receipt: fileList[0]?.originFileObj,
      });
      message.success("Payment recorded");
      onSaved?.(data);
      onClose();
    } catch {
      // error toast is shown by the api interceptor
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={`Record payment${request ? ` · ${request.trackingCode}` : ""}`}
      footer={null}
      destroyOnClose
    >
      {hasPrice && (
        <div className="flex flex-wrap gap-2" style={{ marginBottom: 12 }}>
          <span className="mp-cell-sub" style={{ marginTop: 0 }}>
            Price {etb(request.totalPrice)} · Balance {etb(request.balance)}
          </span>
          <Button size="small" onClick={() => form.setFieldsValue({ amount: request.balance })}>
            Full balance
          </Button>
        </div>
      )}
      <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
        <Form.Item label="Amount (ETB)" name="amount" rules={[{ required: true, message: "Enter the amount" }]}>
          <InputNumber
            min={0.01}
            max={hasPrice ? request.balance : undefined}
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
        <Form.Item label="Receipt (image or PDF)">
          <Upload.Dragger
            accept="image/*,application/pdf"
            maxCount={1}
            fileList={fileList}
            beforeUpload={() => false}
            onChange={({ fileList: l }) => setFileList(l.slice(-1))}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p>Click or drag a receipt here (max 10MB)</p>
          </Upload.Dragger>
        </Form.Item>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            Record payment
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default RecordPaymentModal;

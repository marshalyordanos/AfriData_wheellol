// src/views/bookings/BookingEditForm.jsx
import React, { useEffect } from "react";
import { Form, DatePicker, Input, Checkbox, Button } from "antd";
import dayjs from "dayjs";

const BookingEditForm = ({ booking, onSave, onCancel }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (booking) {
      form.setFieldsValue({
        start_date: booking.start_date ? dayjs(booking.start_date) : null,
        end_date: booking.end_date ? dayjs(booking.end_date) : null,
        pickup_time: booking.pickup_time || "",
        with_driver: booking.with_driver || false,
      });
    }
  }, [booking, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSave({
        ...values,
        start_date: values.start_date?.toISOString(),
        end_date: values.end_date?.toISOString(),
      });
    } catch (err) {
      console.error("Validation failed:", err);
    }
  };

  return (
    <Form form={form} layout="vertical">
      <Form.Item
        name="start_date"
        label="Start Date"
        rules={[{ required: true }]}
      >
        <DatePicker />
      </Form.Item>

      <Form.Item name="end_date" label="End Date" rules={[{ required: true }]}>
        <DatePicker />
      </Form.Item>

      <Form.Item name="pickup_time" label="Pickup Time">
        <Input />
      </Form.Item>

      <Form.Item name="with_driver" valuePropName="checked">
        <Checkbox>With Driver</Checkbox>
      </Form.Item>

      <div className="flex justify-end gap-2">
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="primary" onClick={handleSubmit}>
          Save
        </Button>
      </div>
    </Form>
  );
};

export default BookingEditForm;

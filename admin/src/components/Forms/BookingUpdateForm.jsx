import React, { useEffect, useState } from "react";
import {
  Form,
  Select,
  DatePicker,
  Button,
  Checkbox,
  Input,
  message,
} from "antd";
import dayjs from "dayjs";
import api from "../../api/api";
import { ETHIOPIAN_TOWNS } from "../../utils/ethiopianTowns";

const { Option } = Select;
const { RangePicker } = DatePicker;

const BookingUpdateForm = ({ booking, onSave, onCancel }) => {
  const [form] = Form.useForm();
  const [extraTowns, setExtraTowns] = useState([]);

  // normalize booking wrapper
  const b = booking?.data || booking || {};

  useEffect(() => {
    if (!b) return;

    const parseLoc = (loc) => {
      if (!loc) return { lat: null, lng: null, name: null };
      const parts = String(loc).split("+*+");
      const lat = parts[0] ? parseFloat(parts[0]) : null;
      const lng = parts[1] ? parseFloat(parts[1]) : null;
      const name = parts.slice(2).join("+*+") || null;
      return { lat, lng, name };
    };

    const pickup = parseLoc(b.pickupLocation || b.pickup_location || "");
    const dropoff = parseLoc(b.dropoffLocation || b.dropoff_location || "");

    const extras = [];
    if (pickup.name && !ETHIOPIAN_TOWNS.find((t) => t.name === pickup.name))
      extras.push(pickup.name);
    if (dropoff.name && !ETHIOPIAN_TOWNS.find((t) => t.name === dropoff.name))
      extras.push(dropoff.name);
    setExtraTowns(extras);

    form.setFieldsValue({
      dates:
        b.startDate && b.endDate
          ? [dayjs(b.startDate), dayjs(b.endDate)]
          : undefined,
      withDriver: !!b.withDriver,
      pickupTown: pickup.name || undefined,
      dropoffTown: dropoff.name || undefined,
    });
  }, [booking]);

  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values) => {
    const { dates, withDriver, pickupTown, dropoffTown } = values;

    const pickup = ETHIOPIAN_TOWNS.find((t) => t.name === pickupTown) || {
      name: pickupTown,
      lat: 0,
      lng: 0,
    };
    const dropoff = ETHIOPIAN_TOWNS.find((t) => t.name === dropoffTown) || {
      name: dropoffTown,
      lat: 0,
      lng: 0,
    };

    const payload = {
      startDate: dates?.[0]?.toISOString(),
      endDate: dates?.[1]?.toISOString(),
      withDriver: !!withDriver,
      pickupLat: pickup.lat || 0,
      pickupLng: pickup.lng || 0,
      pickupName: pickup.name || "",
      dropoffLat: dropoff.lat || 0,
      dropoffLng: dropoff.lng || 0,
      dropoffName: dropoff.name || "",
    };

    try {
      setSubmitting(true);
      const res = onSave(payload);
      if (res && res.then) await res;
      message.success("Booking updated");
    } catch (err) {
      console.error(err);
      message.error("Update booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item label="Host">
        <Input
          value={
            b.host ? `${b.host.firstName || ""} ${b.host.lastName || ""}` : "-"
          }
          disabled
        />
      </Form.Item>

      <Form.Item label="Guest">
        <Input
          value={
            b.guest
              ? `${b.guest.firstName || ""} ${b.guest.lastName || ""}`
              : "-"
          }
          disabled
        />
      </Form.Item>

      <Form.Item label="Car">
        <Input
          value={
            b.car ? `${b.car.make?.name || ""} ${b.car.model?.name || ""}` : "-"
          }
          disabled
        />
      </Form.Item>

      <Form.Item
        name="dates"
        label="Booking Dates"
        rules={[{ required: true }]}
      >
        <RangePicker showTime />
      </Form.Item>

      <Form.Item name="withDriver" valuePropName="checked">
        <Checkbox>With Driver</Checkbox>
      </Form.Item>

      <Form.Item
        name="pickupTown"
        label="Pickup Town"
        rules={[{ required: true }]}
      >
        <Select
          showSearch
          placeholder="Select pickup town"
          optionFilterProp="children"
          filterOption={(input, option) =>
            String(option?.children || "")
              .toLowerCase()
              .includes(input.toLowerCase())
          }
        >
          {ETHIOPIAN_TOWNS.map((t) => (
            <Option key={t.name} value={t.name}>
              {t.name}
            </Option>
          ))}
          {extraTowns.map((name) => (
            <Option key={name} value={name}>
              {name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="dropoffTown"
        label="Dropoff Town"
        rules={[{ required: true }]}
      >
        <Select
          showSearch
          placeholder="Select dropoff town"
          optionFilterProp="children"
          filterOption={(input, option) =>
            String(option?.children || "")
              .toLowerCase()
              .includes(input.toLowerCase())
          }
        >
          {ETHIOPIAN_TOWNS.map((t) => (
            <Option key={t.name} value={t.name}>
              {t.name}
            </Option>
          ))}
          {extraTowns.map((name) => (
            <Option key={name} value={name}>
              {name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <div className="flex gap-2 justify-end">
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          type="primary"
          htmlType="submit"
        >
          Update Booking
        </Button>
      </div>
    </Form>
  );
};

export default BookingUpdateForm;

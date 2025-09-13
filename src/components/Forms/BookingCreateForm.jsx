import React, { useEffect, useState } from "react";
import { Form, Select, DatePicker, Button } from "antd";
import api from "../../api/api"; // your axios instance with token

const { Option } = Select;
const { RangePicker } = DatePicker;

const BookingCreateForm = ({ onSave, onCancel }) => {
  const [form] = Form.useForm();
  const [renters, setRenters] = useState([]);
  const [cars, setCars] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ✅ Fetch renters
        const rentersRes = await api.get("/admin/users?role=renter");
        setRenters(rentersRes.data?.data?.users || []);

        // ✅ Fetch cars
        const carsRes = await api.get("/admin/listcars");
        setCars(carsRes.data?.data || carsRes.data);
      } catch (err) {
        console.error("Error fetching renters/cars:", err);
      }
    };

    fetchData();
  }, []);

  const onFinish = (values) => {
    const { renterId, carId, dates, status } = values;
    onSave({
      renter_id: renterId,
      car_id: carId,
      start_date: dates?.[0]?.toISOString(),
      end_date: dates?.[1]?.toISOString(),
      status,
    });
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      {/* Select renter */}
      <Form.Item name="renterId" label="Renter" rules={[{ required: true }]}>
        <Select placeholder="Select renter">
          {renters.map((r) => (
            <Option key={r._id} value={r._id}>
              {r.first_name} {r.last_name} ({r.email})
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* Select car */}
      <Form.Item name="carId" label="Car" rules={[{ required: true }]}>
        <Select placeholder="Select car">
          {cars.map((c) => (
            <Option key={c._id} value={c._id}>
              {c.brand?.name} {c.model?.name} ({c.plate_number})
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* Date range */}
      <Form.Item
        name="dates"
        label="Booking Dates"
        rules={[{ required: true }]}
      >
        <RangePicker />
      </Form.Item>

      {/* Status */}
      <Form.Item name="status" label="Status" rules={[{ required: true }]}>
        <Select placeholder="Select status">
          <Option value="Pending">Pending</Option>
          <Option value="Confirmed">Confirmed</Option>
        </Select>
      </Form.Item>

      <div className="flex gap-2 justify-end">
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="primary" htmlType="submit">
          Save
        </Button>
      </div>
    </Form>
  );
};

export default BookingCreateForm;

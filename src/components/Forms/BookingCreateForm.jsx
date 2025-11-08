import React, { useEffect, useState, useRef } from "react";
import {
  Form,
  Select,
  DatePicker,
  Button,
  Checkbox,
  Spin,
  message,
} from "antd";
import api from "../../api/api"; // your axios instance with token
import { ETHIOPIAN_TOWNS } from "../../utils/ethiopianTowns";

const { Option } = Select;
const { RangePicker } = DatePicker;

const BookingCreateForm = ({ onSave, onCancel }) => {
  const [form] = Form.useForm();
  const [guests, setGuests] = useState([]);
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [guestsLoading, setGuestsLoading] = useState(false);
  const [carsLoading, setCarsLoading] = useState(false);
  const guestSearchTimer = useRef(null);
  const carSearchTimer = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch guests (renters)
        const rentersRes = await api.get("/users/guests");
        setGuests(rentersRes.data?.data || []);

        // Fetch cars
        const carsRes = await api.get("/cars");
        setCars(carsRes.data?.data || carsRes.data || []);
      } catch (err) {
        console.error("Error fetching guests/cars:", err);
      }
    };

    fetchData();
  }, []);

  const handleGuestSearch = (val) => {
    clearTimeout(guestSearchTimer.current);
    guestSearchTimer.current = setTimeout(async () => {
      try {
        setGuestsLoading(true);
        if (!val || String(val).trim() === "") {
          const res = await api.get("/users/guests");
          setGuests(res.data?.data || []);
        } else {
          const res = await api.get(
            `/users/guests?search=all:${encodeURIComponent(val)}`
          );
          setGuests(res.data?.data || []);
        }
      } catch (err) {
        console.error("Guest search failed:", err);
      } finally {
        setGuestsLoading(false);
      }
    }, 400);
  };

  const handleCarSearch = (val) => {
    clearTimeout(carSearchTimer.current);
    carSearchTimer.current = setTimeout(async () => {
      try {
        setCarsLoading(true);
        if (!val || String(val).trim() === "") {
          const res = await api.get("/cars");
          setCars(res.data?.data || res.data || []);
        } else {
          const res = await api.get(
            `/cars?search=all:${encodeURIComponent(val)}`
          );
          setCars(res.data?.data || res.data || []);
        }
      } catch (err) {
        console.error("Car search failed:", err);
      } finally {
        setCarsLoading(false);
      }
    }, 400);
  };

  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values) => {
    const { guestId, carId, dates, withDriver, pickupTown, dropoffTown } =
      values;
    const car = cars.find((c) => c.id === carId) || selectedCar;
    const hostId = car?.hostId || null;

    const pickup = ETHIOPIAN_TOWNS.find((t) => t.name === pickupTown) || {};
    const dropoff = ETHIOPIAN_TOWNS.find((t) => t.name === dropoffTown) || {};

    const payload = {
      carId: carId,
      guestId: guestId,
      hostId: hostId,
      startDate: dates?.[0]?.toISOString(),
      endDate: dates?.[1]?.toISOString(),
      withDriver: !!withDriver,
      pickupLat: pickup.lat || 0,
      pickupLng: pickup.lng || 0,
      pickupName: pickup.name || values.pickupName || "",
      dropoffLat: dropoff.lat || 0,
      dropoffLng: dropoff.lng || 0,
      dropoffName: dropoff.name || values.dropoffName || "",
    };

    try {
      setSubmitting(true);
      const res = onSave(payload);
      if (res && res.then) await res;
      message.success("Booking created");
    } catch (err) {
      console.error(err);
      message.error("Create booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{ withDriver: false }}
    >
      <Form.Item name="guestId" label="Guest" rules={[{ required: true }]}>
        <Select
          showSearch
          placeholder="Select guest"
          optionFilterProp="label"
          filterOption={false}
          onSearch={handleGuestSearch}
          notFoundContent={guestsLoading ? <Spin size="small" /> : null}
          loading={guestsLoading}
        >
          {guests.map((g) => {
            const id = g.id;
            const label = `${g.firstName || ""} ${g.lastName || ""} (${
              g.email || ""
            })`;
            return (
              <Option key={id} value={id} label={label}>
                {label}
              </Option>
            );
          })}
        </Select>
      </Form.Item>

      <Form.Item name="carId" label="Car" rules={[{ required: true }]}>
        <Select
          showSearch
          placeholder="Select car"
          optionFilterProp="label"
          filterOption={false}
          onSearch={handleCarSearch}
          notFoundContent={carsLoading ? <Spin size="small" /> : null}
          loading={carsLoading}
          onChange={(val) => {
            const car = cars.find((c) => c.id === val);
            setSelectedCar(car || null);
          }}
        >
          {cars.map((c) => {
            const id = c.id;
            const label = `${c.brand?.name || c.make?.name || ""} ${
              c.model?.name || ""
            } (${c.licensePlate || ""})`;
            return (
              <Option key={id} value={id} label={label}>
                {label}
              </Option>
            );
          })}
        </Select>
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
        </Select>
      </Form.Item>

      <div className="flex gap-2 justify-end">
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="primary" style={{
            background: "var(--color-primary)",
            borderColor: "var(--color-primary)",
            color: "#fff",
          }} htmlType="submit" loading={submitting}>
          Create Booking
        </Button>
      </div>
    </Form>
  );
};

export default BookingCreateForm;

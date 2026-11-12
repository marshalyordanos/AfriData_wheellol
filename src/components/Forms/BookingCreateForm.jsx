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
import { SearchOutlined, CarOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { FormSection, StatusPill, KeyValueList, Avatar } from "../modern/ModernUI";
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

  const guestId = Form.useWatch("guestId", form);
  const carId = Form.useWatch("carId", form);
  const dates = Form.useWatch("dates", form);
  const withDriver = Form.useWatch("withDriver", form);
  const pickupTown = Form.useWatch("pickupTown", form);
  const dropoffTown = Form.useWatch("dropoffTown", form);

  const guest = guests.find((g) => g.id === guestId);
  const car = cars.find((c) => c.id === carId) || selectedCar;
  const carLabel = car
    ? `${car.brand?.name || car.make?.name || ""} ${car.model?.name || ""}`.trim()
    : "";
  const days =
    dates && dates[0] && dates[1] ? Math.max(1, Math.ceil(dates[1].diff(dates[0], "hour") / 24)) : null;
  const rate = Number(car?.rentalPricePerDay || car?.dailyRate || 0);
  const estimate = rate && days ? rate * days : null;
  const fmt = (n) => `${Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })} ETB`;
  const townOptions = ETHIOPIAN_TOWNS.map((t) => ({ value: t.name, label: t.name }));

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{ withDriver: false }}
      requiredMark
    >
      <div className="mp-detail" style={{ gap: 18 }}>
        <div className="mp-detail-main" style={{ gap: 16 }}>
          <FormSection num={1} title="Guest" subtitle="Who is renting the car?">
            <Form.Item name="guestId" label="Guest" rules={[{ required: true, message: "Choose a guest" }]} style={{ marginBottom: 0 }}>
              <Select
                showSearch
                placeholder="Search by name or email"
                filterOption={false}
                onSearch={handleGuestSearch}
                notFoundContent={guestsLoading ? <Spin size="small" /> : "No guests found"}
                loading={guestsLoading}
                suffixIcon={<SearchOutlined />}
                options={guests.map((g) => ({
                  value: g.id,
                  label: `${g.firstName || ""} ${g.lastName || ""}`.trim() || g.email,
                  email: g.email,
                  first: g.firstName,
                  last: g.lastName,
                }))}
                optionRender={(o) => (
                  <div className="mp-cell" style={{ padding: "2px 0" }}>
                    <Avatar name={o.data.label} size={28} />
                    <div className="min-w-0">
                      <div style={{ fontWeight: 600 }}>{o.data.label}</div>
                      <div className="mp-cell-sub" style={{ marginTop: 0 }}>{o.data.email}</div>
                    </div>
                  </div>
                )}
              />
            </Form.Item>
          </FormSection>

          <FormSection num={2} title="Vehicle" subtitle="Pick the car for this booking">
            <Form.Item name="carId" label="Car" rules={[{ required: true, message: "Choose a car" }]} style={{ marginBottom: 0 }}>
              <Select
                showSearch
                placeholder="Search make, model or plate"
                filterOption={false}
                onSearch={handleCarSearch}
                notFoundContent={carsLoading ? <Spin size="small" /> : "No cars found"}
                loading={carsLoading}
                suffixIcon={<SearchOutlined />}
                onChange={(val) => setSelectedCar(cars.find((c) => c.id === val) || null)}
                options={cars.map((c) => ({
                  value: c.id,
                  label: `${c.brand?.name || c.make?.name || ""} ${c.model?.name || ""}`.trim() || "Car",
                  plate: c.licensePlate,
                  year: c.year,
                  photo: c.photos?.[0],
                }))}
                optionRender={(o) => (
                  <div className="mp-cell" style={{ padding: "2px 0" }}>
                    {o.data.photo ? (
                      <img src={o.data.photo} alt="" className="mp-thumb is-wide" style={{ width: 44, height: 32 }} />
                    ) : (
                      <span className="mp-thumb is-wide" style={{ width: 44, height: 32 }}>
                        <CarOutlined />
                      </span>
                    )}
                    <div className="min-w-0">
                      <div style={{ fontWeight: 600 }}>{o.data.label}</div>
                      <div className="mp-cell-sub" style={{ marginTop: 0 }}>
                        {[o.data.year, o.data.plate].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </div>
                  </div>
                )}
              />
            </Form.Item>
          </FormSection>

          <FormSection
            num={3}
            title="Trip details"
            subtitle="Dates and where the car is picked up and returned"
            extra={days ? <StatusPill tone="blue">{days} day{days > 1 ? "s" : ""}</StatusPill> : null}
          >
            <Form.Item name="dates" label="Pickup and return" rules={[{ required: true, message: "Choose the dates" }]}>
              <RangePicker
                showTime={{ format: "HH:mm", minuteStep: 15 }}
                format="ddd, DD MMM YYYY · HH:mm"
                style={{ width: "100%" }}
                placeholder={["Pickup date & time", "Return date & time"]}
              />
            </Form.Item>
            <div className="mp-grid-form">
              <Form.Item name="pickupTown" label="Pickup town" rules={[{ required: true, message: "Choose a town" }]}>
                <Select
                  showSearch
                  placeholder="e.g. Addis Ababa"
                  optionFilterProp="label"
                  options={townOptions}
                  suffixIcon={<EnvironmentOutlined />}
                  onChange={(v) => {
                    if (!form.getFieldValue("dropoffTown")) form.setFieldsValue({ dropoffTown: v });
                  }}
                />
              </Form.Item>
              <Form.Item name="dropoffTown" label="Drop-off town" rules={[{ required: true, message: "Choose a town" }]}>
                <Select
                  showSearch
                  placeholder="Same as pickup"
                  optionFilterProp="label"
                  options={townOptions}
                  suffixIcon={<EnvironmentOutlined />}
                />
              </Form.Item>
            </div>

            <Form.Item name="withDriver" label="Driving option" style={{ marginBottom: 0 }}>
              <DriveChoice />
            </Form.Item>
          </FormSection>
        </div>

        <aside className="mp-detail-side" style={{ position: "sticky", top: 0, alignSelf: "flex-start" }}>
          <div className="mp-fsec" style={{ overflow: "hidden" }}>
            <div className="mp-fsec-h">
              <h2>Summary</h2>
            </div>
            <div className="mp-fsec-b" style={{ gap: 14 }}>
              <div className="mp-cell">
                <span className="mp-thumb is-wide" style={{ width: 56, height: 42 }}>
                  <CarOutlined />
                </span>
                <div className="min-w-0">
                  <div className="mp-cell-main">{carLabel || <span className="mp-muted">No car selected</span>}</div>
                  <div className="mp-cell-sub">{car?.licensePlate || ""}</div>
                </div>
              </div>
              <div className="mp-timeline">
                <div className="mp-timeline-rail">
                  <span className="a" />
                  <span className="l" />
                  <span className="b" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
                  <div>
                    <b style={{ fontWeight: 600 }}>{dates?.[0] ? dates[0].format("ddd, DD MMM · HH:mm") : "Pickup date"}</b>
                    <div className="mp-cell-sub">{pickupTown || "Pickup town"}</div>
                  </div>
                  <div>
                    <b style={{ fontWeight: 600 }}>{dates?.[1] ? dates[1].format("ddd, DD MMM · HH:mm") : "Return date"}</b>
                    <div className="mp-cell-sub">{dropoffTown || "Drop-off town"}</div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {guest && <StatusPill tone="gray">{`${guest.firstName || ""} ${guest.lastName || ""}`.trim()}</StatusPill>}
                <StatusPill tone="gray">{withDriver ? "With driver" : "Self-drive"}</StatusPill>
              </div>
              <KeyValueList
                rows={[
                  rate ? { label: `${fmt(rate)} × ${days || 0} day${days === 1 ? "" : "s"}`, value: estimate ? fmt(estimate) : "—" } : null,
                  { label: "Estimated total", value: estimate ? fmt(estimate) : "Calculated by server", strong: true },
                ]}
              />
              <Button type="primary" htmlType="submit" loading={submitting} block size="large" style={{ height: 48 }}>
                Create booking
              </Button>
              <Button onClick={onCancel} block>
                Cancel
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </Form>
  );
};

/* Self-drive / With driver radio cards bound to a boolean form value */
const DriveChoice = ({ value, onChange }) => (
  <div role="radiogroup" className="mp-grid-form" style={{ gap: 12 }}>
    {[
      { v: false, t: "Self-drive", s: "Guest drives the car" },
      { v: true, t: "With driver", s: "Host provides a driver" },
    ].map((o) => (
      <button
        key={o.t}
        type="button"
        role="radio"
        aria-checked={!!value === o.v}
        className={`mp-choice ${!!value === o.v ? "is-on" : ""}`}
        onClick={() => onChange && onChange(o.v)}
      >
        <span className="mp-radio" />
        <span>
          <span className="mp-choice-title">{o.t}</span>
          <span className="mp-choice-sub">{o.s}</span>
        </span>
      </button>
    ))}
  </div>
);

export default BookingCreateForm;

import React from "react";
import { Form, Input, DatePicker, Switch } from "antd";
import dayjs from "dayjs";

const BookingViewForm = ({ booking }) => {
  if (!booking) return null;

  return (
    <Form layout="vertical">
      <Form.Item label="Renter">
        <Input
          value={`${booking.renter_id.first_name} ${booking.renter_id.last_name}`}
          readOnly
        />
      </Form.Item>

      <Form.Item label="Renter Email">
        <Input value={booking.renter_id.email} readOnly />
      </Form.Item>

      <Form.Item label="Car">
        <Input
          value={`${booking.car_id.brand.name} ${booking.car_id.model.name}`}
          readOnly
        />
      </Form.Item>

      <Form.Item label="Car Year">
        <Input value={booking.car_id.year} readOnly />
      </Form.Item>

      <Form.Item label="Price / Day">
        <Input value={`$${booking.car_id.rental_price_per_day}`} readOnly />
      </Form.Item>

      <Form.Item label="Booking Status">
        <Input value={booking.status} readOnly />
      </Form.Item>

      <Form.Item label="Start Date">
        <DatePicker value={dayjs(booking.start_date)} disabled />
      </Form.Item>

      <Form.Item label="End Date">
        <DatePicker value={dayjs(booking.end_date)} disabled />
      </Form.Item>

      <Form.Item label="Pickup Time">
        <DatePicker
          value={booking.pickup_time ? dayjs(booking.pickup_time) : null}
          disabled
        />
      </Form.Item>

      <Form.Item label="With Driver">
        <Switch checked={booking.with_driver} disabled />
      </Form.Item>

      <Form.Item label="Total Amount">
        <Input
          value={booking.total_amount ? `$${booking.total_amount}` : "N/A"}
          readOnly
        />
      </Form.Item>

      <Form.Item label="Payment Status">
        <Input value={booking.payment_status || "N/A"} readOnly />
      </Form.Item>

      <Form.Item label="Created At">
        <Input
          value={dayjs(booking.createdAt).format("YYYY-MM-DD HH:mm")}
          readOnly
        />
      </Form.Item>

      <Form.Item label="Updated At">
        <Input
          value={dayjs(booking.updatedAt).format("YYYY-MM-DD HH:mm")}
          readOnly
        />
      </Form.Item>
    </Form>
  );
};

export default BookingViewForm;

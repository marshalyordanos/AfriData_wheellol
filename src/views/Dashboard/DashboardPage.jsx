"use client";
import React from "react";
import {
  Card,
  Table,
  Select,
  DatePicker,
  Tag,
  Input,
  Dropdown,
  Menu,
  Button,
} from "antd";
import {
  FaUser,
  FaPlane,
  FaDollarSign,
  FaChartLine,
  FaCar,
} from "react-icons/fa";
import Chart from "react-apexcharts";
import { motion } from "framer-motion";

const { RangePicker } = DatePicker;
const { Option } = Select;

const DashboardPage = () => {
  const kpis = [
    { title: "Total Bookings", value: 1200, icon: <FaCar /> },
    { title: "Total Revenue", value: "$230,000", icon: <FaDollarSign /> },
    { title: "Total Users", value: 842, icon: <FaUser /> },
    { title: "Active Owners", value: 34, icon: <FaChartLine /> },
  ];

  const bookingData = [
    {
      id: 1,
      name: "John Doe",
      model: "Corolla",
      date: "2025-08-01",
      status: "Paid",
      owner: "Alice Smith",
    },
    {
      id: 2,
      name: "Emily Johnson",
      model: "Civic",
      date: "2025-08-02",
      status: "Pending",
      owner: "Robert Brown",
    },
    {
      id: 3,
      name: "Michael Lee",
      model: "Model 3",
      date: "2025-08-03",
      status: "Cancelled",
      owner: "Sarah Miller",
    },
    {
      id: 4,
      name: "Sophia Martinez",
      model: "Mustang",
      date: "2025-08-04",
      status: "Paid",
      owner: "James Wilson",
    },
    {
      id: 5,
      name: "Daniel Anderson",
      model: "Camry",
      date: "2025-08-05",
      status: "Pending",
      owner: "Olivia Davis",
    },
    {
      id: 6,
      name: "Isabella Thomas",
      model: "Accord",
      date: "2025-08-06",
      status: "Cancelled",
      owner: "Ethan Moore",
    },
    {
      id: 7,
      name: "William Harris",
      model: "Rav4",
      date: "2025-08-07",
      status: "Paid",
      owner: "Charlotte Taylor",
    },
  ];

  const columns = [
    { title: "Renter", dataIndex: "name" },
    { title: "Car", dataIndex: "name" },
    { title: "Model", dataIndex: "model" },

    { title: "Date", dataIndex: "date" },
    {
      title: "Status",
      dataIndex: "status",
      render: (text) => (
        <Tag
          color={
            text === "Paid" ? "green" : text === "Cancelled" ? "red" : "orange"
          }
        >
          {text}
        </Tag>
      ),
    },
    { title: "Owner", dataIndex: "owner" },
  ];

  const revenueChart = {
    series: [
      {
        name: "Revenue",
        data: [10000, 18000, 24000, 32000, 40000, 46000, 54000],
      },
    ],
    options: {
      chart: {
        type: "area",
        toolbar: { show: false },
      },
      colors: ["#4caf50"], // main green color
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          shadeIntensity: 0.4,
          gradientToColors: ["#81c784"], // lighter green bottom
          opacityFrom: 0.6,
          opacityTo: 0.4,
          stops: [0, 100],
        },
      },
      stroke: {
        curve: "smooth",
        width: 2,
      },
      markers: {
        size: 4,
        colors: ["#4caf50"], // green markers
        strokeColors: "#fff",
        strokeWidth: 3,
      },
      xaxis: {
        categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
      },
      dataLabels: { enabled: false },
    },
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="rounded-2xl shadow p-4 flex items-center space-x-4">
              <div className="text-2xl text-green-500">{kpi.icon}</div>
              <div>
                <div className="text-gray-500 text-sm">{kpi.title}</div>
                <div className="text-xl font-semibold">{kpi.value}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-4">Revenue Over Time</h2>
          <Chart
            options={revenueChart.options}
            series={revenueChart.series}
            type="area"
            height={300}
          />
        </Card>

        <Card className="rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="space-y-4">
            <RangePicker className="w-full" />
            <Select className="w-full" defaultValue="All Statuses">
              <Option value="All">All Statuses</Option>
              <Option value="Paid">Paid</Option>
              <Option value="Cancelled">Cancelled</Option>
              <Option value="Not Paid">Not Paid</Option>
            </Select>
            <Input placeholder="Search by Model or Owner Name" />
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl shadow">
        <h2 className="text-lg font-semibold mb-4">Latest Bookings</h2>
        <Table
          columns={columns}
          dataSource={bookingData}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          scroll={{
            x: 700,
          }}
        />
      </Card>
    </div>
  );
};

export default DashboardPage;

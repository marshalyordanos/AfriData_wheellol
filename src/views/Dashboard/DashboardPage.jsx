"use client";
import React, { useEffect, useState } from "react";
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
  Pagination,
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
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import CommonCard from "../../components/commons/CommonCard";
import {
  formatCurrency,
  formatReadableDate,
} from "../../utils/date_currency_formatter";
const { RangePicker } = DatePicker;
const { Option } = Select;

const DashboardPage = () => {
  const [loading, setLaoding] = useState(null);
  const navigate = useNavigate();

  const [totalSummary, settotalSUmmary] = useState({});
  const [totalSummaryR, settotalSUmmaryR] = useState([
    {
      title: "Total Bookings",
      value: totalSummary?.totalBookings || 0,
      icon: <FaCar />,
    },
    {
      title: "Total Revenue",
      value: totalSummary?.totalRevenue || 0,
      icon: <FaDollarSign />,
    },
    {
      title: "Total Users",
      value: totalSummary?.totalUsers || 0,
      icon: <FaUser />,
    },
    {
      title: "Active Owners",
      value: totalSummary?.activeHosts || 0,
      icon: <FaChartLine />,
    },
  ]);
  useEffect(() => {
    settotalSUmmaryR([
      {
        title: "Total Bookings",
        value: totalSummary?.totalBookings || 0,
        icon: <FaCar />,
      },
      {
        title: "Total Revenue",
        value: formatCurrency(totalSummary?.totalRevenue || 0),
        icon: <FaDollarSign />,
      },
      {
        title: "Total Users",
        value: totalSummary?.totalUsers || 0,
        icon: <FaUser />,
      },
      {
        title: "Active Owners",
        value: totalSummary?.activeHosts || 0,
        icon: <FaChartLine />,
      },
    ]);
  }, [totalSummary]);

  const [lestestBooking, setLetestbooking] = useState([]);
  const [revenueOverTime, setRevenueOverTime] = useState({});

  const fetchSummary = async () => {
    try {
      // setLaoding(true);
      const res = await api.get("users/summary?entity=total");
      settotalSUmmary(res.data.data);

      // setLaoding(false);
    } catch (error) {
      // setLaoding(false);

      console.error("fetchSummary: ", error);
    }
  };
  const fetchBooking = async () => {
    try {
      setLaoding(true);

      const res3 = await api.get("users/summary?entity=latestBookings");

      const list = Array.isArray(res3.data?.data) ? res3.data.data : [];
      const mapped = list.map((b) => ({
        ...b,
        startDateFormatted: b.startDate ? formatReadableDate(b.startDate) : "-",
        endDateFormatted: b.endDate ? formatReadableDate(b.endDate) : "-",
        totalPriceFormatted:
          b.totalPrice || b.totalPrice === 0
            ? formatCurrency(b.totalPrice)
            : "-",
      }));

      setLetestbooking(mapped);
      console.log("fetchSummary: ", res3.data);
      setLaoding(false);
    } catch (error) {
      setLaoding(false);

      console.error("fetchSummary: ", error);
    }
  };

  const fetchGraph = async () => {
    try {
      // setLaoding(true);

      const res3 = await api.get("users/summary?entity=graph");

      setRevenueOverTime(res3.data?.data);
      console.log("fetchSummary: ", res3.data);
      // setLaoding(false);
    } catch (error) {
      // setLaoding(false);

      console.error("fetchSummary: ", error);
    }
  };
  useEffect(() => {
    fetchSummary();
  }, []);
  useEffect(() => {
    fetchBooking();
  }, []);
  useEffect(() => {
    fetchGraph();
  }, []);

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
    {
      title: "Renter",
      dataIndex: "name",
      render: (text, r) => (
        <p>{r?.guest?.firstName + " " + r?.guest?.lastName}</p>
      ),
    },
    {
      title: "Car",
      dataIndex: "name",
      render: (text, r) => <p>{r?.car?.make?.name}</p>,
    },
    {
      title: "Model",
      dataIndex: "model.name",
      render: (text, r) => <p>{r?.car?.model?.name}</p>,
    },

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
    {
      title: "Owner",
      dataIndex: "owner",
      render: (text, r) => (
        <p>{r?.host?.firstName + " " + r?.host?.lastName}</p>
      ),
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      render: (text, r) => (
        <p>{r?.startDate ? formatReadableDate(r.startDate) : "-"}</p>
      ),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      render: (text, r) => (
        <p>{r?.endDate ? formatReadableDate(r.endDate) : "-"}</p>
      ),
    },
  ];

  const revenueChart = {
    series: [
      {
        name: "Revenue",
        data: Object.values(revenueOverTime) || [],
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
        categories: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ],
      },
      dataLabels: { enabled: false },
      tooltip: {
        y: {
          formatter: function (val) {
            try {
              return formatCurrency(val);
            } catch (e) {
              return val;
            }
          },
        },
      },
      yaxis: {
        labels: {
          formatter: function (val) {
            try {
              return formatCurrency(val);
            } catch (e) {
              return val;
            }
          },
        },
      },
    },
  };

  const onRowClick = (record) => {
    if (record && (record.id || record._id)) {
      const bookingId = record.id || record._id;
      navigate(`/dash/bookings/${bookingId}`);
    }
  };

  const handlePagination = (page, pageSize) => {
    searchData();
  };
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1  lg:grid-cols-4 gap-4">
        {totalSummaryR.map((kpi, idx) => (
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

      <div className="grid grid-cols-1  gap-6">
        <Card className="rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-4">Revenue Over Time</h2>
          <Chart
            options={revenueChart.options}
            series={revenueChart.series}
            type="area"
            height={300}
          />
        </Card>

        {/* <Card className="rounded-2xl shadow">
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
            </Card> */}
      </div>

      <div className="hidden md:block">
        <Card className="rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-4">Latest Bookings</h2>
          <Table
            loading={loading}
            columns={columns}
            dataSource={lestestBooking}
            rowKey="id"
            // pagination={{ pageSize: 5 }}
            scroll={{
              x: 700,
            }}
            onRow={(record) => ({
              onClick: () => onRowClick(record),
              style: { cursor: "pointer" },
            })}
            pagination={false}
          />
        </Card>
      </div>
      <div className="block md:hidden">
        {lestestBooking.length > 0 &&
          lestestBooking.map((car) => {
            return (
              <CommonCard
                item={car}
                fieldMap={{
                  "guest.firstName": "Guest",
                  "host.firstName": "Host",
                  "car.make.name": "Make",
                  "car.model.name": "Model",
                  totalPriceFormatted: "Total Price",
                  startDateFormatted: "Start Date",
                  endDateFormatted: "End Date",
                }}
                title={["car.make.name", "car.model.name"]}
                actionItems={[]}
                onActionClick={() => {}}
                onCardClick={(item) => {
                  onRowClick(item);
                }}
              />
            );
          })}
      </div>
    </div>
  );
};

export function isoToDisplay(isoStr) {
  const d = new Date(isoStr);

  // month names
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const yyyy = d.getFullYear();
  const monthName = months[d.getMonth()];
  const dd = String(d.getDate()).padStart(2, "0");

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 → 12

  return `${monthName} ${dd}, ${yyyy} ${hours}:${minutes} ${ampm}`;
}

export default DashboardPage;

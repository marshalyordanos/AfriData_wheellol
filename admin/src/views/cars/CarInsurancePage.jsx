import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Button, message, Space, Spin, Typography } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import CarInsuranceForm from "./CarInsuranceForm";
import carsService from "./CarsService";
import CommonModal from "../../components/commons/CommonModel";
import CommonDeleteModal from "../../components/commons/CommonDeleteModal";
import { formatReadableDate } from "../../utils/date_currency_formatter";

const { Title } = Typography;

const CarInsurancePage = () => {
  const { carId } = useParams();
  const navigate = useNavigate();

  const [insuranceList, setInsuranceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [refreshFlag, setRefreshFlag] = useState(false);

  // Fetch all insurance records for the car
  const loadInsurance = async () => {
    try {
      setLoading(true);
      const data = await carsService.getCarInsurance(carId);
      console.log(data);
      setInsuranceList(data || []);
    } catch (err) {
      message.error("Failed to fetch insurance records");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsurance();
  }, [carId, refreshFlag]);

  // Delete insurance
  const handleDelete = async () => {
    if (!selectedInsurance?.id) return;
    try {
      setLoading(true);
      await carsService.deleteCarInsurance(selectedInsurance.id);
      message.success("Insurance deleted successfully");
      setIsDeleteModalOpen(false);
      setRefreshFlag((prev) => !prev);
    } catch (err) {
      message.error("Failed to delete insurance");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Insurance Company",
      dataIndex: "insuranceCompany",
      key: "insuranceCompany",
    },
    {
      title: "Policy Number",
      dataIndex: "policyNumber",
      key: "policyNumber",
    },
    {
      title: "Type",
      dataIndex: "insuranceType",
      key: "insuranceType",
      render: (type) => type.replace("_", " "), // e.g., THIRD_PARTY → THIRD PARTY
    },
    {
      title: "Expiry Date",
      dataIndex: "expiryDate",
      key: "expiryDate",
      render: (date) => (date ? formatReadableDate(date) : "-"),
    },
    {
      title: "Document",
      dataIndex: "documentFile",
      key: "documentFile",
      render: (file) =>
        file ? (
          <a href={file} target="_blank" rel="noopener noreferrer">
            View
          </a>
        ) : (
          "-"
        ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedInsurance(record);
              setIsModalOpen(true);
            }}
            style={{
              marginBottom: 16,
              background: "var(--color-primary)",
              borderColor: "var(--color-primary)",
              color: "#fff",
            }}
          >
            Edit
          </Button>
          <Button
            type="danger"
            icon={<DeleteOutlined />}
            onClick={() => {
              setSelectedInsurance(record);
              setIsDeleteModalOpen(true);
            }}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/dash/cars")}
        style={{
          marginBottom: 16,
          background: "var(--color-primary)",
          borderColor: "var(--color-primary)",
          color: "#fff",
        }}
      >
        Back to Cars
      </Button>

      <div className="flex justify-between items-center mb-4">
        <Title level={4}>Car Insurance</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setSelectedInsurance(null);
            setIsModalOpen(true);
          }}
        >
          Add Insurance
        </Button>
      </div>

      {loading ? (
        <Spin tip="Loading..." size="large" />
      ) : (
        <Table
          columns={columns}
          dataSource={insuranceList || []} // <- default to empty array
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      )}

      {/* Add/Edit Insurance Modal */}
      {isModalOpen && (
        <CommonModal
          width={900}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
        >
          <CarInsuranceForm
            carId={carId}
            insuranceData={selectedInsurance}
            setIsModalOpen={setIsModalOpen}
            refreshData={() => setRefreshFlag((prev) => !prev)}
          />
        </CommonModal>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <CommonDeleteModal
          setIsModalOpen={setIsDeleteModalOpen}
          handleDelete={handleDelete}
          loading={loading}
          isModalOpen={isDeleteModalOpen}
        >
          <h1 className="text-2xl text-center font-semibold mb-2">
            Are you sure?
          </h1>
          <p className="text-center text-gray-600">
            This will permanently delete this insurance record.
          </p>
        </CommonDeleteModal>
      )}
    </div>
  );
};

export default CarInsurancePage;

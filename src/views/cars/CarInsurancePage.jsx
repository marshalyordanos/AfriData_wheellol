import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, message, Typography, Space, Spin } from "antd";
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

const { Title, Paragraph } = Typography;

const CarInsurancePage = () => {
  const { carId } = useParams();
  const navigate = useNavigate();

  const [insurance, setInsurance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);

  // Fetch insurance for this car
  const loadInsurance = async () => {
    try {
      setLoading(true);
      const data = await carsService.getCarInsurance(carId);
      setInsurance(data || null);
    } catch (err) {
      message.error("Failed to fetch insurance");
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
    if (!insurance?.id) return;
    try {
      setLoading(true);
      await carsService.deleteCarInsurance(insurance.id);
      message.success("Insurance deleted successfully");
      setInsurance(null);
      setIsDeleteModalOpen(false);
    } catch (err) {
      message.error("Failed to delete insurance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/dash/cars")}
        style={{ marginBottom: 16 }}
      >
        Back to Cars
      </Button>

      {loading ? (
        <Spin tip="Loading..." size="large" />
      ) : (
        <Card
          title={<Title level={4}>Car Insurance</Title>}
          extra={
            <Space>
              {insurance ? (
                <>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => setIsModalOpen(true)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="danger"
                    icon={<DeleteOutlined />}
                    onClick={() => setIsDeleteModalOpen(true)}
                  >
                    Delete
                  </Button>
                </>
              ) : (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setIsModalOpen(true);
                    setInsurance(null); // ensure blank for creation
                  }}
                >
                  Add Insurance
                </Button>
              )}
            </Space>
          }
        >
          {insurance ? (
            <div>
              <Paragraph>
                <strong>Provider:</strong> {insurance.provider}
              </Paragraph>
              <Paragraph>
                <strong>Plan:</strong> {insurance.plan}
              </Paragraph>
              <Paragraph>
                <strong>Coverage Details:</strong>
                <br />
                {insurance.coverageDetails}
              </Paragraph>
            </div>
          ) : (
            <Paragraph>No insurance found for this car.</Paragraph>
          )}
        </Card>
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
            insuranceData={insurance}
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

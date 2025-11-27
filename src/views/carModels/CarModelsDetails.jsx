import { Divider, message, Button } from "antd";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import CarModelsService from "./CarModelsService";
import { formatReadableDate } from "../../utils/date_currency_formatter";
import CommonModal from "../../components/commons/CommonModel";
import CommonDeleteModal from "../../components/commons/CommonDeleteModal";
import CarModelsEdit from "./CarModelsEdit";

const CarModelsDetails = () => {
  const { id } = useParams();
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const navigate = useNavigate();

  const fetchModel = async () => {
    try {
      setLoading(true);
      const data = await CarModelsService.getModel(id);
      setModel(data);
    } catch (err) {
      console.error("Failed to fetch model:", err);
      message.error("Failed to load model details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModel();
  }, [id]);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await CarModelsService.deleteModel(id);
      message.success("Model deleted successfully");
      setIsDeleteModalOpen(false);
      navigate(-1);
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 409 || err?.response?.status === 400) {
        message.error("Cannot delete: related records exist.");
      } else {
        message.error("Failed to delete model");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!model) return <p>No model data found.</p>;

  return (
    <DetailContainer>
      <Header>
        <Title>
          {model?.make?.name || "Brand"} - {model?.name || "Model"} Details
        </Title>
        <ActionButtons>
          <Button
            type="primary"
            style={{ backgroundColor: "var(--color-primary)" }}
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit
          </Button>
          <Button
            type="danger"
            style={{ backgroundColor: "red", color: "#fff" }}
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete
          </Button>
        </ActionButtons>
      </Header>
      {/* <Header>
        <h1>Test Buttons</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button type="primary">Edit</Button>
          <Button type="danger">Delete</Button>
        </div>
      </Header> */}

      <Divider style={{ margin: "20px 0" }} />

      <DetailsGrid>
        <DetailItem>
          <p className="detail_key">Model Name:</p>
          <p className="detail_value">{model?.name}</p>
        </DetailItem>

        <DetailItem>
          <p className="detail_key">Brand:</p>
          <p className="detail_value">{model?.make?.name || "N/A"}</p>
        </DetailItem>

        <DetailItem>
          <p className="detail_key">Status:</p>
          <p
            className={`detail_value ${
              model?.isActive ? "active" : "inactive"
            }`}
          >
            {model?.isActive ? "Active" : "Inactive"}
          </p>
        </DetailItem>

        <DetailItem>
          <p className="detail_key">Created At:</p>
          <p className="detail_value">
            {model?.createdAt ? formatReadableDate(model.createdAt) : "N/A"}
          </p>
        </DetailItem>

        <DetailItem>
          <p className="detail_key">Updated At:</p>
          <p className="detail_value">
            {model?.updatedAt ? formatReadableDate(model.updatedAt) : "N/A"}
          </p>
        </DetailItem>
      </DetailsGrid>

      {isEditModalOpen && (
        <CommonModal
          width={600}
          isModalOpen={isEditModalOpen}
          setIsModalOpen={setIsEditModalOpen}
        >
          <CarModelsEdit
            modelId={id}
            closeModal={() => setIsEditModalOpen(false)}
            refreshData={fetchModel}
          />
        </CommonModal>
      )}

      {isDeleteModalOpen && (
        <CommonDeleteModal
          isModalOpen={isDeleteModalOpen}
          setIsModalOpen={setIsDeleteModalOpen}
          handleDelete={handleDelete}
          loading={loading}
        >
          <h2>Are you sure you want to delete this model?</h2>
        </CommonDeleteModal>
      )}
    </DetailContainer>
  );
};

// Styled components
const DetailContainer = styled.div`
  max-width: 800px;
  margin: 40px auto;
  padding: 30px 40px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);

  @media (max-width: 600px) {
    padding: 20px;
    margin: 20px;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 26px;
  font-weight: 600;
  color: #0a3d62;
  margin-bottom: 10px;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const DetailItem = styled.div`
  .detail_key {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    margin-bottom: 5px;
  }

  .detail_value {
    font-size: 18px;
    font-weight: 600;
    color: #106085;

    &.active {
      color: green;
    }

    &.inactive {
      color: red;
    }
  }
`;

export default CarModelsDetails;

import {
  Button,
  Descriptions,
  Divider,
  Image,
  Space,
  Tag,
  message,
} from "antd";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import CarsService from "./CarsService";
import { CheckCircleOutlined, PoweroffOutlined } from "@ant-design/icons";

const CarsDetail = () => {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(state || null);
  const [loading, setLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  const carId = data?._id || data?.id || id;

  const refresh = async (silent = false) => {
    if (!carId) return;
    try {
      setLoading(true);
      const res = silent
        ? await CarsService.getCarSilent(carId)
        : await CarsService.getCar(carId);
      setData(res);
    } catch (e) {
      if (!silent) message.error("Refresh failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!data && id) {
      (async () => {
        try {
          const res = await CarsService.getCar(id);
          setData(res);
        } catch (e) {
          message.error("Failed to load car");
        }
      })();
    }
  }, [id, data]);

  const images = data?.images || [];

  return (
    <DetailStyle>
      <div className="header">
        <h1>{data?.title || "Car Detail"}</h1>
        <Space size="small">
          {data?.is_featured ? (
            <Tag color="green">Featured</Tag>
          ) : (
            <Tag>Standard</Tag>
          )}
          {data?.is_active && <Tag color="blue">Active</Tag>}
          {data?.status && <Tag>{data.status}</Tag>}
        </Space>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          loading={approveLoading}
          onClick={async () => {
            try {
              setApproveLoading(true);
              const updated = await CarsService.adminApproveCar(carId);
              if (updated && typeof updated === "object") {
                setData(updated);
              } else {
                setData((d) => ({ ...d, status: "approved" }));
              }
              message.success("Car approved");
              setTimeout(() => {
                refresh(true).catch(() => {});
              }, 300);
            } catch (e) {
              message.error("Approve failed");
            } finally {
              setApproveLoading(false);
            }
          }}
        >
          Approve
        </Button>

        <Button
          danger
          loading={rejectLoading}
          onClick={async () => {
            try {
              setRejectLoading(true);
              await CarsService.adminRejectCar(carId);
              message.success("Car rejected");
              navigate("/dash/cars");
            } catch (e) {
              message.error("Reject failed");
            } finally {
              setRejectLoading(false);
            }
          }}
        >
          Reject
        </Button>

        <Button
          icon={<PoweroffOutlined />}
          loading={toggleLoading}
          onClick={async () => {
            try {
              setToggleLoading(true);
              const updated = await CarsService.adminToggleCarActiveStatus(
                carId
              );
              if (updated && typeof updated === "object") {
                setData(updated);
              } else {
                setData((d) => ({ ...d, is_active: !d?.is_active }));
              }
              message.success("Toggled active status");
              await refresh(true);
            } catch (e) {
              message.error("Toggle failed");
            } finally {
              setToggleLoading(false);
            }
          }}
        >
          Toggle Active
        </Button>
      </Space>

      {!!images.length && (
        <div className="gallery">
          {images.map((src, idx) => (
            <Image
              key={idx}
              src={src}
              width={200}
              height={140}
              style={{ objectFit: "cover" }}
            />
          ))}
        </div>
      )}

      <Divider />

      <Descriptions bordered column={2} size="middle">
        <Descriptions.Item label="Car Type">
          {data?.vehicle_type?.name || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Year">{data?.year || "-"}</Descriptions.Item>
        <Descriptions.Item label="Brand">
          {data?.brand?.name || data?.brand || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Model">
          {data?.model?.name || data?.model || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Transmission">
          {data?.transmission || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Fuel Type">
          {data?.fuel_type || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Seats">
          {data?.seating_capacity || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Price/Day">
          {data?.rental_price_per_day || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Location">
          {data?.location?.city || data?.location?.address || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Features" span={2}>
          {Array.isArray(data?.features) && data.features.length > 0
            ? data.features.map((f) => f.name).join(", ")
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Insurance Info" span={2}>
          {data?.insurance_info || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Rental Terms" span={2}>
          {data?.rental_terms || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Description" span={2}>
          {data?.description || "-"}
        </Descriptions.Item>
      </Descriptions>
    </DetailStyle>
  );
};

const DetailStyle = styled.div`
  border: 1px solid #f0f0f0;
  margin: 30px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  h1 {
    padding: 0;
    margin: 0 0 4px 0;
  }
  .gallery {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 16px;
  }
`;

export default CarsDetail;

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
  const [originalData, setOriginalData] = useState(state || null); // snapshot of first full car payload
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
          setOriginalData((prev) => prev || res);
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
        <h1>
          {(() => {
            const base = originalData || data;
            if (!base) return "Car Detail";
            const parts = [
              base?.brand?.name || base?.brand || null,
              base?.model?.name || base?.model || null,
              base?.year || null,
            ].filter(Boolean);
            return parts.length ? parts.join(" ") : "Car Detail";
          })()}
        </h1>
        <Space size="small">
          {data?.is_featured ? (
            <Tag color="green">Featured</Tag>
          ) : (
            <Tag>Standard</Tag>
          )}
          {data?.is_active && <Tag color="blue">Active</Tag>}
          {typeof data?.is_approved === "boolean" && (
            <Tag color={data.is_approved ? "green" : "red"}>
              {data.is_approved ? "Approved" : "Not Approved"}
            </Tag>
          )}
        </Space>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          loading={approveLoading}
          disabled={data?.is_approved === true}
          onClick={async () => {
            try {
              setApproveLoading(true);
              const updated = await CarsService.adminApproveCar(carId);
              // Only update the status-related fields; never replace structural data
              setData((prev) => ({
                ...prev,
                is_approved: true,
                rejection_reason: undefined,
              }));
              message.success("Car approved");
            } catch (e) {
              message.error("Approve failed");
            } finally {
              setApproveLoading(false);
            }
          }}
        >
          {data?.is_approved ? "Approved" : "Approve"}
        </Button>

        <Button
          danger
          loading={rejectLoading}
          disabled={data?.is_approved === false}
          onClick={async () => {
            try {
              const reason = window.prompt("Rejection reason (optional)", "");
              setRejectLoading(true);
              const updated = await CarsService.adminRejectCar(
                carId,
                reason || undefined
              );
              setData((d) => ({
                ...d,
                is_approved: false,
                rejection_reason: reason || "No reason provided",
              }));
              message.success("Car rejected");
            } catch (e) {
              message.error("Reject failed");
            } finally {
              setRejectLoading(false);
            }
          }}
        >
          {data?.is_approved === false ? "Rejected" : "Reject"}
        </Button>

        <Button
          icon={<PoweroffOutlined />}
          loading={toggleLoading}
          onClick={async () => {
            if (!data) return;
            const previous = data.is_active;
            const nextStatus = !previous;
            setData((d) => ({ ...d, is_active: nextStatus }));
            try {
              setToggleLoading(true);
              const updated = await CarsService.adminToggleCarActiveStatus(
                carId,
                nextStatus
              );
              if (
                updated &&
                typeof updated === "object" &&
                Object.prototype.hasOwnProperty.call(updated, "is_active")
              ) {
                setData((prev) => ({ ...prev, is_active: updated.is_active }));
              } else {
                // ensure field not lost when response has no car object
                setData((d) => ({ ...d, is_active: nextStatus }));
              }
              message.success(
                `Car ${nextStatus ? "activated" : "deactivated"}`
              );
            } catch (e) {
              // revert on failure
              setData((d) => ({ ...d, is_active: previous }));
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

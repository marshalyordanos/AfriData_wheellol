import { Divider, Spin, message } from "antd";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import StaffService from "./StaffService";
import ActiveStatus from "../../components/commons/ActiveStatus";

const StaffDetail = () => {
  const { id } = useParams();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      setStaff(null);
      setInitialized(true); // fetching started
      StaffService.getStaff(id)
        .then((data) => {
          setStaff(data);
          setLoading(false);
        })
        .catch(() => {
          setStaff(null);
          setLoading(false);
          message.error("Failed to load staff details");
        });
    } else {
      setStaff(null);
      setLoading(false);
      setInitialized(true);
    }
  }, [id]);

  const refreshStaff = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await StaffService.getStaff(id);
      setStaff(data);
    } catch (err) {
      message.error(
        err?.response?.data?.message || "Failed to load staff details"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      let res;
      if (staff?.isActive) {
        res = await StaffService.deactivateStaff(id);
      } else {
        res = await StaffService.activateStaff(id);
      }
      message.success(res?.message || "Staff status updated successfully");
      await refreshStaff();
    } catch (err) {
      message.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to change staff active status"
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (!initialized) {
    return null;
  }

  if (loading && !staff) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!loading && !staff) {
    return (
      <div style={{ margin: 40, color: "red" }}>Staff details not found.</div>
    );
  }

  return (
    <DetailStyle>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          alignItems: "center",
        }}
      >
        <button
          onClick={handleToggleActive}
          disabled={actionLoading}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #3BB66E",
            background: staff?.isActive ? "#f44336" : "#3BB66E",
            color: "#fff",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {staff?.isActive ? "Deactivate" : "Activate"}
          {actionLoading && <Spin size="small" />}
        </button>
      </div>

      <h1>Staff Details</h1>
      <Divider style={{ margin: "15px 0 25px 0" }} />

      <div className="detail_child">
        <p className="detail_key">First Name:</p>
        <p className="detail_value">{staff?.firstName}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">Last Name:</p>
        <p className="detail_value">{staff?.lastName}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">Email:</p>
        <p className="detail_value">{staff?.email}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">Active:</p>
        <p className="detail_value">
          <ActiveStatus isActive={!!staff?.isActive} />
        </p>
      </div>

      <div className="detail_child">
        <p className="detail_key">Role:</p>
        <p className="detail_value">{staff?.role?.name || staff?.role}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">Phone:</p>
        <p className="detail_value">{staff?.phone}</p>
      </div>

      {staff?.profilePhoto && (
        <div className="detail_child">
          <p className="detail_key">Profile Photo:</p>
          <img
            src={
              typeof staff.profilePhoto === "string"
                ? staff.profilePhoto
                : URL.createObjectURL(staff.profilePhoto)
            }
            alt="Profile"
            style={{ maxWidth: 120, borderRadius: 8 }}
          />
        </div>
      )}

      {staff?.driverLicense && (
        <div className="detail_child">
          <p className="detail_key">Driver License:</p>
          <img
            src={
              typeof staff.driverLicense === "string"
                ? staff.driverLicense
                : URL.createObjectURL(staff.driverLicense)
            }
            alt="Driver License"
            style={{ maxWidth: 120, borderRadius: 8 }}
          />
        </div>
      )}

      {staff?.nationalId && (
        <div className="detail_child">
          <p className="detail_key">National ID:</p>
          <img
            src={
              typeof staff.nationalId === "string"
                ? staff.nationalId
                : URL.createObjectURL(staff.nationalId)
            }
            alt="National ID"
            style={{ maxWidth: 120, borderRadius: 8 }}
          />
        </div>
      )}
    </DetailStyle>
  );
};

const DetailStyle = styled.div`
  border: 1px solid #e0e0e0;
  margin: 30px auto;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 12px;
  max-width: 800px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);

  h1 {
    padding: 0;
    margin: 0 0 20px 0;
    font-size: 24px;
    font-weight: bold;
    color: #333333;
    text-align: center;
  }

  .detail_child {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding: 10px;
    border-bottom: 1px solid #f0f0f0;
  }

  .detail_key {
    font-size: 18px;
    font-weight: 600;
    color: #555555;
  }

  .detail_value {
    color: #106085;
    font-size: 18px;
    font-weight: 500;
  }

  img {
    max-width: 150px;
    border-radius: 8px;
    border: 1px solid #ddd;
    padding: 5px;
    background-color: #f9f9f9;
  }
`;

export default StaffDetail;

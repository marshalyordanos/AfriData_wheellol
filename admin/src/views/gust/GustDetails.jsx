import { Divider, Spin, message } from "antd";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import GustService from "./GustService";
import ActiveStatus from "../../components/commons/ActiveStatus";

const GustDetail = () => {
  const { id } = useParams();
  const [gust, setGust] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      setGust(null);
      setInitialized(true); // fetching started
      GustService.getGust(id)
        .then((data) => {
          setGust(data);
          setLoading(false);
        })
        .catch(() => {
          setGust(null);
          setLoading(false);
          message.error("Failed to load Gust details");
        });
    } else {
      setGust(null);
      setLoading(false);
      setInitialized(true);
    }
  }, [id]);

  console.log("GUESSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSST", gust);

  const refreshGust = async () => {
    if (!id) return;
    try {
      const data = await GustService.getGust(id);
      setGust(data);
    } catch (err) {
      message.error(
        err?.response?.data?.message || "Failed to load Gust details"
      );
    }
  };

  if (!initialized) {
    return null;
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!loading && !gust) {
    return (
      <div style={{ margin: 40, color: "red" }}>Gust details not found.</div>
    );
  }

  const handleToggleActive = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      let res;
      if (gust?.isActive) {
        res = await GustService.deactivateGuest(id);
      } else {
        res = await GustService.activateGuest(id);
      }
      message.success(res?.message || "Guest status updated successfully");
      await refreshGust();
    } catch (err) {
      message.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to change guest active status"
      );
    } finally {
      setActionLoading(false);
    }
  };

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
            background: gust?.isActive ? "#f44336" : "#3BB66E",
            color: "#fff",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {gust?.isActive ? "Deactivate" : "Activate"}
          {actionLoading && <Spin size="small" />}
        </button>
      </div>

      <h1>Guest Details</h1>
      <Divider style={{ margin: "15px 0 25px 0" }} />

      <div className="detail_child">
        <p className="detail_key">First Name:</p>
        <p className="detail_value">{gust?.firstName}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">Last Name:</p>
        <p className="detail_value">{gust?.lastName}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">Email:</p>
        <p className="detail_value">{gust?.email}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">Active:</p>
        <p className="detail_value">
          <ActiveStatus isActive={!!gust?.isActive} />
        </p>
      </div>

      <div className="detail_child">
        <p className="detail_key">Role:</p>
        <p className="detail_value">{gust?.role?.name || gust?.role}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">Phone:</p>
        <p className="detail_value">{gust?.phone}</p>
      </div>

      {/* guestProfile extra fields */}
      {gust?.guestProfile?.address && (
        <div className="detail_child">
          <p className="detail_key">Address:</p>
          <p className="detail_value">{gust.guestProfile.address}</p>
        </div>
      )}


      {gust?.profilePhoto && (
        <div className="detail_child">
          <p className="detail_key">Profile Photo:</p>
          <img
            src={
              typeof gust.profilePhoto === "string"
                ? gust.profilePhoto
                : URL.createObjectURL(gust.profilePhoto)
            }
            alt="Profile"
            style={{ maxWidth: 120, borderRadius: 8 }}
          />
        </div>
      )}

      {gust?.guestProfile?.driverLicenseId && (
        <div className="detail_child">
          <p className="detail_key">Driver License:</p>
          <img
            src={
              typeof gust.guestProfile.driverLicenseId === "string"
                ? gust.guestProfile.driverLicenseId
                : URL.createObjectURL(gust.guestProfile.driverLicenseId)
            }
            alt="Driver License"
            style={{ maxWidth: 120, borderRadius: 8 }}
          />
        </div>
      )}
  
      {gust?.guestProfile?.nationalId && (
        <div className="detail_child">
          <p className="detail_key">National ID:</p>
          <img
            src={
              typeof gust.guestProfile.nationalId === "string"
                ? gust.guestProfile.nationalId
                : URL.createObjectURL(gust.guestProfile.nationalId)
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

export default GustDetail;

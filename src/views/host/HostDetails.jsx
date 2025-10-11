import { Divider, Spin, message } from "antd";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import HostService from "./HostService";

const HostDetail = () => {
  const { id } = useParams();
  const [host, setHost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false); 

  useEffect(() => {
    if (id) {
      setLoading(true);
      setHost(null);
      setInitialized(true); //  fetching started
      HostService.getHost(id)
        .then((data) => {
          setHost(data);
          setLoading(false);
        })
        .catch(() => {
          setHost(null);
          setLoading(false);
          message.error("Failed to load host details");
        });
    } else {
      setHost(null);
      setLoading(false);
      setInitialized(true);
    }
  }, [id]);

  //  Show nothing until first fetch starts
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

  if (!loading && !host) {
    return (
      <div style={{ margin: 40, color: "red" }}>Host details not found.</div>
    );
  }

  return (
    <DetailStyle>
      <h1>Host Details</h1>
      <Divider style={{ margin: "15px 0 25px 0" }} />

      <div className="detail_child">
        <p className="detail_key">First Name:</p>
        <p className="detail_value">{host?.firstName}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">Last Name:</p>
        <p className="detail_value">{host?.lastName}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">Email:</p>
        <p className="detail_value">{host?.email}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">Verified:</p>
        <p className="detail_value">{host?.isVerified ? "true" : "false"}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">Role:</p>
        <p className="detail_value">{host?.role?.name || host?.role}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">Phone:</p>
        <p className="detail_value">{host?.phone}</p>
      </div>

      {host?.profilePhoto && (
        <div className="detail_child">
          <p className="detail_key">Profile Photo:</p>
          <img
            src={
              typeof host.profilePhoto === "string"
                ? host.profilePhoto
                : URL.createObjectURL(host.profilePhoto)
            }
            alt="Profile"
            style={{ maxWidth: 120, borderRadius: 8 }}
          />
        </div>
      )}

      {host?.driverLicense && (
        <div className="detail_child">
          <p className="detail_key">Driver License:</p>
          <img
            src={
              typeof host.driverLicense === "string"
                ? host.driverLicense
                : URL.createObjectURL(host.driverLicense)
            }
            alt="Driver License"
            style={{ maxWidth: 120, borderRadius: 8 }}
          />
        </div>
      )}

      {host?.nationalId && (
        <div className="detail_child">
          <p className="detail_key">National ID:</p>
          <img
            src={
              typeof host.nationalId === "string"
                ? host.nationalId
                : URL.createObjectURL(host.nationalId)
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

export default HostDetail;

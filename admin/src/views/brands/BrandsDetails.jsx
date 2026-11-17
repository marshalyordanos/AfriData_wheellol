import { Divider, Spin } from "antd";
import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import styled from "styled-components";
import brandsService from "./BrandsService";

const BrandsDetail = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const [brand, setBrand] = useState(state || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!brand) {
      setLoading(true);
      brandsService
        .getBrand(id)
        .then((data) => setBrand(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading || !brand) return <Spin className="m-6" />;

  return (
    <DetailStyle>
      <h1>Brand Detail</h1>
      <Divider style={{ margin: "15px 0 25px 0" }} />

      <div className="detail_child">
        <p className="detail_key">Name:</p>
        <p className="detail_value">{brand.name}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">Country:</p>
        <p className="detail_value">{brand.country || "N/A"}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">Featured:</p>
        <p className="detail_value">{brand.is_featured ? "Yes" : "No"}</p>
      </div>

      {brand.logo && (
        <div className="detail_child">
          <p className="detail_key">Logo:</p>
          <img src={brand.logo} alt="logo" style={{ maxHeight: "60px" }} />
        </div>
      )}
    </DetailStyle>
  );
};

const DetailStyle = styled.div`
  margin: 30px;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  h1 {
    font-size: 18px;
    font-weight: bold;
  }
  .detail_child {
    margin-bottom: 15px;
  }
  .detail_key {
    font-size: 16px;
    font-weight: bold;
  }
  .detail_value {
    color: #106085;
    font-size: 16px;
  }
`;

export default BrandsDetail;

import { Divider } from "antd";
import React from "react";
import { useLocation } from "react-router-dom";
import styled from "styled-components";

const CarsDetail = () => {
  const { state } = useLocation();
//   console.log("--------------------------", state);
  return (
    <DetailStyle>
      <h1>User Detail</h1>
      <Divider style={{ margin: "15px 0 25px 0" }} />

      <div className="detail_child">
        <p className="detail_key">title:</p>
        <p className="detail_value">{state?.title}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">brand:</p>
        <p className="detail_value">{state?.brand}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">model:</p>
        <p className="detail_value">{state?.model}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">year:</p>
        <p className="detail_value">{state?.year}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">is_featured:</p>
        <p className="detail_value">{state?.is_featured ? "true" : "false"}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">category:</p>
        <p className="detail_value">{state?.category}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">transmission:</p>
        <p className="detail_value">{state?.transmission}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">fuel_type:</p>
        <p className="detail_value">{state?.fuel_type}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">seating_capacity:</p>
        <p className="detail_value">{state?.seating_capacity}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">rental_price_per_day:</p>
        <p className="detail_value">{state?.rental_price_per_day}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">location:</p>
        <p className="detail_value">{state?.location.city}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">description:</p>
        <p className="detail_value">{state?.description}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">images:</p>
        <p className="detail_value">{state?.images}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">insurance_info:</p>
        <p className="detail_value">{state?.insurance_info}</p>
      </div>

      <div className="detail_child">
        <p className="detail_key">rental_terms:</p>
        <p className="detail_value">{state?.rental_terms}</p>
      </div>
    </DetailStyle>
  );
};

const DetailStyle = styled.div`
  border: 1px lightgray;
  margin: 30px;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  h1 {
    padding: 0;
    margin: 0;
    font-size: 16px;
  }
  .detail_child {
    margin-bottom: 15px;
  }
  .detail_key {
    font-size: 20px;
    font-weight: bold;
  }
  .detail_value {
    color: #106085;
    font-size: 20px;
  }
`;

export default CarsDetail;

// Admin adds a car for one supplier: car details, photos 1–15 and papers
// 16–20 (Libre, Bolo, insurance, licence front + back). Files are optional.
// Uses the same form as editing a supplier car (EditCar in SupplierCarDetails).
import React, { useEffect, useState } from "react";
import { Spin } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { Page, PageHeader } from "../../components/modern/ModernUI";
import SupplierService, { supplierName } from "./SupplierService";
import { EditCar } from "./SupplierCarDetails";
import "./suppliers.css";

const SupplierCarAdd = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SupplierService.get(id)
      .then(setSupplier)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", padding: 80 }}>
        <Spin />
      </div>
    );
  }

  return (
    <Page>
      <PageHeader
        back={`/dash/suppliers/${id}`}
        eyebrow="Add a car"
        title={supplier ? `New car for ${supplierName(supplier)}` : "New car"}
        subtitle="Fill in the car details. Photos and papers are optional — add what you have."
      />
      <EditCar
        car={{}}
        hostId={id}
        onCancel={() => navigate(`/dash/suppliers/${id}`)}
        onSaved={(car) => navigate(car?.id ? `/dash/supplier-cars/${car.id}` : `/dash/suppliers/${id}`)}
      />
    </Page>
  );
};

export default SupplierCarAdd;

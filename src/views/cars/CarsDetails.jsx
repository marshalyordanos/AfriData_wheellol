import React, { useEffect, useState } from "react";
import { Card, Descriptions, Image, Tag, Spin, message } from "antd";
import { useParams } from "react-router-dom";
import carsService from "./CarsService";

// Helper to find name by ID from list
const findNameById = (items, id) => {
  if (!items || !id) return "-";
  const found = items.find(
    (item) => item.id === id || item._id === id || item.name === id
  );
  return found ? found.name : "-";
};

const CarDetails = () => {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);

  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [carData, brandsData, modelsData] = await Promise.all([
          carsService.getCar(id),
          carsService.getBrands(),
          carsService.getModels(),
        ]);

        setCar(carData);
        setBrands(brandsData);
        setModels(modelsData);
      } catch (err) {
        console.error(err);
        message.error("Failed to load car details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="text-center text-gray-500">Car details not found.</div>
    );
  }

  const brandName = findNameById(brands, car.makeId);
  const modelName = findNameById(models, car.modelId);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Card
        title={`${brandName} ${modelName}`}
        bordered
        style={{
          width: "100%",
          maxWidth: 800,
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {/* Images horizontal scroll */}
        <div
          className="flex gap-2 overflow-x-auto py-2"
          style={{
            scrollbarWidth: "thin",
            paddingBottom: 5,
          }}
        >
          {(car.photos || []).map((photo, index) => (
            <div
              key={index}
              style={{
                minWidth: 120,
                flexShrink: 0,
                borderRadius: 8,
                overflow: "hidden",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }}
            >
              <img
                src={photo}
                alt={`Car ${index + 1}`}
                style={{
                  width: "100%",
                  height: 80,
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          ))}
        </div>

        {/* Responsive Car Details */}
        <Descriptions
          bordered
          column={{ xs: 1, sm: 1, md: 2 }}
          className="mt-4"
          labelStyle={{ fontWeight: 600 }}
        >
          <Descriptions.Item label="Year">{car.year || "-"}</Descriptions.Item>
          <Descriptions.Item label="Color">
            {car.color || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="License Plate">
            {car.licensePlate || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="VIN">{car.vin || "-"}</Descriptions.Item>
          <Descriptions.Item label="Transmission">
            {car.transmission || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Mileage">
            {car.mileage || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Rental Price / Day">
            {car.rentalPricePerDay || car.dailyRate || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Long Term Discount (%)">
            {car.longTermDiscount || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Seating Capacity">
            {car.seatingCapacity || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Mileage Limit">
            {car.mileageLimit || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Car Type">
            {car?.carType?.name || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Eco Friendly">
            {car.ecoFriendly || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Status" span={2}>
            {car.isActive ? (
              <Tag color="green">Active</Tag>
            ) : (
              <Tag color="red">Inactive</Tag>
            )}
          </Descriptions.Item>
        </Descriptions>

        {/* Description */}
        {car.description && (
          <div className="mt-4">
            <strong>Description:</strong>
            <p style={{ wordWrap: "break-word" }}>{car.description}</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CarDetails;

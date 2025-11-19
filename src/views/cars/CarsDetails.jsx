import React, { useEffect, useState } from "react";
import {
  Card,
  Descriptions,
  Image,
  Tag,
  Spin,
  message,
  Row,
  Col,
  Divider,
} from "antd";
import { useParams } from "react-router-dom";
import carsService from "./CarsService";

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
        title={
          <h2 style={{ margin: 0 }}>
            {brandName} {modelName}
          </h2>
        }
        bordered
        style={{
          width: "100%",
          maxWidth: 900,
          margin: "0 auto",
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        {/* Photos */}
        {car.photos?.length > 0 && (
          <div className="mb-4">
            <Image.PreviewGroup>
              <Row gutter={[8, 8]} wrap={false} style={{ overflowX: "auto" }}>
                {car.photos.map((photo, idx) => (
                  <Col key={idx} style={{ flex: "0 0 auto" }}>
                    <Image
                      src={photo}
                      alt={`Car ${idx + 1}`}
                      width={150}
                      height={100}
                      style={{
                        objectFit: "cover",
                        borderRadius: 8,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      }}
                    />
                  </Col>
                ))}
              </Row>
            </Image.PreviewGroup>
          </div>
        )}

        <Divider />

        {/* Car Info */}
        <Descriptions
          bordered
          column={{ xs: 1, sm: 1, md: 2 }}
          size="middle"
          labelStyle={{ fontWeight: 600, width: 160 }}
          contentStyle={{ color: "#555" }}
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

        {/* GPS Info */}
        {(car.hasGPS || car.gpsDeviceBrand || car.gpsPlatformUrl) && (
          <>
            <Divider>GPS Information</Divider>
            <Descriptions
              bordered
              column={{ xs: 1, sm: 1, md: 2 }}
              size="small"
              labelStyle={{ fontWeight: 600 }}
            >
              <Descriptions.Item label="GPS Device Brand">
                {car.gpsDeviceBrand || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="GPS IMEI Number">
                {car.gpsImeiNumber || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="GPS Platform URL">
                {car.gpsPlatformUrl || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="GPS Username">
                {car.gpsPlatformUsername || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="GPS Password">
                {car.gpsPlatformPassword || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Subscription Expiry">
                {car.gpsSubscriptionExpiryDate
                  ? new Date(car.gpsSubscriptionExpiryDate).toLocaleDateString()
                  : "-"}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
        {/* GPS & Technical Inspection Files */}
        {(car.gpsInstallationReceiptUrl ||
          car.technicalInspectionCertificateUrl) && (
          <>
            <Divider>Documents</Divider>
            <Descriptions
              bordered
              column={{ xs: 1, sm: 1, md: 2 }}
              size="small"
              labelStyle={{ fontWeight: 600 }}
            >
              {car.gpsInstallationReceiptUrl && (
                <Descriptions.Item label="GPS Installation Receipt">
                  <a
                    href={car.gpsInstallationReceiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Receipt
                  </a>
                </Descriptions.Item>
              )}
              {car.technicalInspectionCertificateUrl && (
                <Descriptions.Item label="Technical Inspection Certificate">
                  <a
                    href={car.technicalInspectionCertificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Certificate
                  </a>
                </Descriptions.Item>
              )}
            </Descriptions>
          </>
        )}
        {/* Description */}
        {car.description && (
          <>
            <Divider>Description</Divider>
            <p
              style={{ color: "#555", lineHeight: 1.6, wordWrap: "break-word" }}
            >
              {car.description}
            </p>
          </>
        )}
      </Card>
    </div>
  );
};

export default CarDetails;

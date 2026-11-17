import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  Switch,
  Upload,
  Button,
  DatePicker,
  message,
  Row,
  Col,
  Typography,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import styled from "styled-components";
import carsService from "./CarsService";
import { selectCurrentUser } from "../../redux/auth/authSlice";
import { useSelector } from "react-redux";
import CartypesService from "../cartypes/CartypesService";

const { Option } = Select;
const { Title } = Typography;

const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const CarsEdit = ({ carId = null, setIsModalOpen, refreshData }) => {
  const [form] = Form.useForm();
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [carTypes, setCarTypes] = useState([]);

  const [photoList, setPhotoList] = useState([]);
  const [techCertList, setTechCertList] = useState([]);
  const [gpsReceiptList, setGpsReceiptList] = useState([]);
  const [previewImage, setPreviewImage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [brandLoading, setBrandLoading] = useState(false);
  const [carTypesLoading, setCartypeLoading] = useState(false);

  const [showGPS, setShowGPS] = useState(false);

  const isEdit = !!carId;
  const userData = useSelector(selectCurrentUser);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);

        const brandsList = await carsService.getBrands();
        setBrands(brandsList);

        const typeList = await CartypesService.searchCartype({
          page: 1,
          limit: 1000,
        });
        setCarTypes(typeList?.data);

        if (isEdit) {
          const carData = await carsService.getCar(carId);
          if (carData) {
            setShowGPS(carData.hasGPS);

            form.setFieldsValue({
              makeId: carData.makeId,
              modelId: carData.modelId,
              year: carData.year,
              color: carData.color,
              licensePlate: carData.licensePlate,
              vin: carData.vin,
              transmission: carData.transmission,
              mileage: carData.mileage,
              dailyRate: carData.dailyRate,
              rentalPricePerDay: carData.rentalPricePerDay,
              longTermDiscount: carData.longTermDiscount,
              seatingCapacity: carData.seatingCapacity,
              mileageLimit: carData.mileageLimit,
              carType: carData.carTypeId,
              ecoFriendly: carData.ecoFriendly,
              isActive: carData.isActive,
              description: carData.description || "",
              location: carData.location || "",
              hasGPS: carData.hasGPS,
              gpsDeviceBrand: carData.gpsDeviceBrand,
              gpsImeiNumber: carData.gpsImeiNumber,
              gpsPlatformUrl: carData.gpsPlatformUrl,
              gpsPlatformUsername: carData.gpsPlatformUsername,
              gpsPlatformPassword: carData.gpsPlatformPassword,
              gpsSubscriptionExpiryDate: carData.gpsSubscriptionExpiryDate
                ? new Date(carData.gpsSubscriptionExpiryDate)
                : null,
            });

            // if (carData.photos?.length) {
            //   setPhotoList(
            //     carData.photos.map((url, index) => ({
            //       uid: index,
            //       name: `photo${index + 1}`,
            //       status: "done",
            //       url,
            //     }))
            //   );
            // }

            if (carData.technicalInspectionCertificateUrl) {
              setTechCertList([
                {
                  uid: "techCert",
                  name: "certificate",
                  status: "done",
                  url: carData.technicalInspectionCertificateUrl,
                },
              ]);
            }

            if (carData.gpsInstallationReceiptUrl) {
              setGpsReceiptList([
                {
                  uid: "gpsReceipt",
                  name: "gps receipt",
                  status: "done",
                  url: carData.gpsInstallationReceiptUrl,
                },
              ]);
            }

            if (carData.makeId) {
              const modelsList = await carsService.getModels(carData.makeId);
              setModels(modelsList || []);
            }
          }
        }
      } catch (err) {
        console.error(err);
        message.error("Failed to load car data");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [carId]);

  const handleBrandChange = async (brandId) => {
    form.setFieldsValue({ modelId: null });
    if (!brandId) return setModels([]);
    try {
      const modelsList = await carsService.getModels(brandId);
      setModels(modelsList || []);
    } catch {
      message.error("Failed to load models");
    }
  };

  const handleSearchBrands = async () => {
    try {
      setBrandLoading(true);
      const list = await carsService.getBrands();
      setBrands(list);
    } finally {
      setBrandLoading(false);
    }
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview && file.originFileObj) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  const dummyRequest = ({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0);

  const beforeUpload = (file, pdf = false) => {
    if (file.type.startsWith("image/")) {
      return true;
    }

    if (pdf && file.type === "application/pdf") {
      return true;
    }

    message.error(
      pdf
        ? "You can only upload image or PDF files!"
        : "You can only upload image files!"
    );
    return Upload.LIST_IGNORE;
  };

  const onFinish = async (values) => {
    try {
      setSubmitLoading(true);
      const formData = new FormData();

      formData.append("hostId", userData?.user?.id || userData?.id);

      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            formData.append(key, value.toISOString());
          } else if (typeof value !== "object") {
            formData.append(key, value);
          }
        }
      });

      photoList.forEach((file) => {
        if (file.originFileObj) formData.append("photos", file.originFileObj);
      });

      techCertList.forEach((file) => {
        if (file.originFileObj)
          formData.append("technicalInspectionCertificate", file.originFileObj);
      });

      gpsReceiptList.forEach((file) => {
        if (file.originFileObj)
          formData.append("gpsInstallationReceipt", file.originFileObj);
      });

      if (isEdit) {
        await carsService.updateCar(formData, carId);
        message.success("Car updated successfully");
      } else {
        await carsService.createCar(formData);
        message.success("Car created successfully");
      }

      refreshData?.();
      setIsModalOpen?.(false);
    } catch (err) {
      console.error(err);
      message.error("Failed to save car");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Title level={4}>General Info</Title>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label="Brand"
            name="makeId"
            rules={[{ required: true, message: "Brand is required" }]}
          >
            <Select
              showSearch
              placeholder="Select brand"
              filterOption={false}
              onSearch={handleSearchBrands}
              onChange={handleBrandChange}
              loading={brandLoading}
              options={brands.map((b) => ({ label: b.name, value: b.id }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="Model"
            name="modelId"
            rules={[{ required: true, message: "Model is required" }]}
          >
            <Select
              showSearch
              placeholder="Select model"
              options={models.map((m) => ({ label: m.name, value: m.id }))}
              disabled={!form.getFieldValue("makeId")}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label="Car Type"
            name="carType"
            rules={[{ required: true, message: "Type is required" }]}
          >
            <Select
              showSearch
              placeholder="Select Type"
              loading={carTypesLoading}
              options={carTypes.map((b) => ({ label: b.name, value: b.id }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Year" name="year" rules={[{ required: true }]}>
            <Input type="number" placeholder="Year" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="Color" name="color" rules={[{ required: true }]}>
            <Input placeholder="Color" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="License Plate"
            name="licensePlate"
            rules={[{ required: true }]}
          >
            <Input placeholder="License Plate" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="VIN" name="vin" rules={[{ required: true }]}>
            <Input placeholder="VIN" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="Transmission"
            name="transmission"
            rules={[{ required: true }]}
          >
            <Select placeholder="Transmission">
              <Option value="AUTOMATIC">Automatic</Option>
              <Option value="MANUAL">Manual</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label="Mileage"
            name="mileage"
            rules={[{ required: true }]}
          >
            <Input type="number" placeholder="Mileage" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Location" name="location">
            <Input placeholder="Location" />
          </Form.Item>
        </Col>
      </Row>

      <Title level={4} style={{ marginTop: 24 }}>
        Capacity
      </Title>

      <Row gutter={16}>
        {/* Price is negotiated per booking request — hidden for now
        <Col xs={24} md={12}>
          <Form.Item
            label="Rental Price / Day"
            name="rentalPricePerDay"
            rules={[{ required: true }]}
          >
            <Input type="number" placeholder="Rental Price per Day" />
          </Form.Item>
        </Col> */}
        <Col xs={24} md={12}>
          <Form.Item
            label="Seating Capacity"
            name="seatingCapacity"
            rules={[{ required: true }]}
          >
            <Input type="number" placeholder="Seating Capacity" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="Mileage Limit" name="mileageLimit">
            <Input type="number" placeholder="Mileage Limit" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Eco Friendly" name="ecoFriendly">
            <Select placeholder="Eco Friendly">
              <Option value="HYBRID">Hybrid</Option>
              <Option value="ELECTRIC">Electric</Option>
              <Option value="NONE">Gas</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {isEdit && (
        <Form.Item label="Active" name="isActive" valuePropName="checked">
          <Switch />
        </Form.Item>
      )}

      <Form.Item label="Description" name="description">
        <Input.TextArea rows={3} placeholder="Description" />
      </Form.Item>

      <Form.Item label="Photos">
        <p style={{ marginBottom: 8, color: "#555" }}>
          Please upload 6 photos of your car: Front, Rear, Driver Side,
          Passenger Side, Dashboard, and Interior.
        </p>
        <Upload
          customRequest={dummyRequest}
          listType="picture-card"
          fileList={photoList}
          onPreview={handlePreview}
          multiple
          accept="image/*"
          onChange={({ fileList }) => {
            // allow picking several at once, but keep max 6 photos
            if (fileList.length > 6) {
              message.warning({ key: "photo-limit", content: "Maximum 6 photos — extra files were skipped." });
            }
            setPhotoList(fileList.slice(0, 6));
          }}
          beforeUpload={beforeUpload}
        >
          {photoList.length >= 6 ? null : (
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          )}
        </Upload>
      </Form.Item>

      <Title level={4} style={{ marginTop: 24 }}>
        GPS & Technical Inspection
      </Title>

      <Form.Item label="Has GPS?" name="hasGPS" valuePropName="checked">
        <Switch onChange={(checked) => setShowGPS(checked)} />
      </Form.Item>

      {showGPS && (
        <>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="GPS Device Brand" name="gpsDeviceBrand">
                <Input placeholder="GPS Device Brand" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="GPS IMEI Number" name="gpsImeiNumber">
                <Input placeholder="GPS IMEI Number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="GPS Platform URL" name="gpsPlatformUrl">
                <Input placeholder="GPS Platform URL" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="GPS Platform Username"
                name="gpsPlatformUsername"
              >
                <Input placeholder="Username" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="GPS Platform Password"
                name="gpsPlatformPassword"
              >
                <Input placeholder="Password" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="GPS Subscription Expiry"
                name="gpsSubscriptionExpiryDate"
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="GPS Installation Receipt"
            name="gpsInstallationReceiptFile"
          >
            <Upload
              customRequest={dummyRequest}
              listType="picture"
              maxCount={1}
              fileList={gpsReceiptList}
              onChange={({ fileList }) => setGpsReceiptList(fileList)}
              beforeUpload={(file) => beforeUpload(file, true)}
            >
              <Button icon={<PlusOutlined />}>Upload Receipt</Button>
            </Upload>
          </Form.Item>
        </>
      )}

      <Form.Item
        label="Technical Inspection Certificate"
        name="technicalInspectionCertificateFile"
      >
        <Upload
          customRequest={dummyRequest}
          listType="picture"
          maxCount={1}
          fileList={techCertList}
          onChange={({ fileList }) => setTechCertList(fileList)}
          beforeUpload={(file) => beforeUpload(file, true)}
        >
          <Button icon={<PlusOutlined />}>Upload Certificate</Button>
        </Upload>
      </Form.Item>

      <div className="mp-form-actions">
        <Button onClick={() => setIsModalOpen?.(false)}>Cancel</Button>
        <Button
          loading={submitLoading}
          type="primary"
          htmlType="submit"
        >
          {isEdit ? "Update" : "Create"}
        </Button>
      </div>
    </Form>
  );
};

export default CarsEdit;

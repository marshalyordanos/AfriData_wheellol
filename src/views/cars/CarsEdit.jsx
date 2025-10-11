import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  Switch,
  Upload,
  Image,
  message,
  Spin,
  Button,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import styled from "styled-components";
import carsService from "./CarsService";

const { Option } = Select;

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
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [brandLoading, setBrandLoading] = useState(false);
  const [hostId, setHostId] = useState(null); // ✅ dynamic hostId
  const isEdit = !!carId;

  // Load brands and car data (if editing)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const brandsList = await carsService.getBrands();
        setBrands(brandsList);

        if (isEdit) {
          const carData = await carsService.getCar(carId);
          if (carData) {
            setHostId(carData.hostId); // ✅ set dynamic hostId

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
              carType: carData.carType,
              ecoFriendly: carData.ecoFriendly,
              isActive: carData.isActive,
              description: carData.description || "",
            });

            if (carData.photos?.length) {
              setFileList(
                carData.photos.map((url, index) => ({
                  uid: index,
                  name: `photo${index + 1}`,
                  status: "done",
                  url,
                }))
              );
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
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  const handleChange = ({ fileList: newFileList }) => setFileList(newFileList);

  const dummyRequest = ({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0);

  const beforeUpload = (file) => {
    if (!file.type.startsWith("image/")) {
      message.error("You can only upload image files!");
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const formData = new FormData();

      // Append dynamic hostId if available
      if (hostId) formData.append("hostId", hostId);

      // Append all other form values
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      // Append photos (only new ones)
      if (fileList.length > 0) {
        fileList.forEach((file) => {
          if (file.originFileObj) {
            formData.append("photos", file.originFileObj);
          }
        });
      }

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
      setLoading(false);
    }
  };

  return loading ? (
    <SpinStyle>
      <Spin size="large" />
    </SpinStyle>
  ) : (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      {/* Brand */}
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

      {/* Model */}
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

      {/* Other fields */}
      <Form.Item label="Year" name="year" rules={[{ required: true }]}>
        <Input type="number" placeholder="Year" />
      </Form.Item>

      <Form.Item label="Color" name="color">
        <Input placeholder="Color" />
      </Form.Item>

      <Form.Item label="License Plate" name="licensePlate">
        <Input placeholder="License Plate" />
      </Form.Item>

      <Form.Item label="VIN" name="vin">
        <Input placeholder="VIN" />
      </Form.Item>

      <Form.Item label="Transmission" name="transmission">
        <Select placeholder="Transmission">
          <Option value="AUTOMATIC">Automatic</Option>
          <Option value="MANUAL">Manual</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Mileage" name="mileage">
        <Input type="number" placeholder="Mileage" />
      </Form.Item>

      <Form.Item label="Daily Rate" name="dailyRate">
        <Input type="number" placeholder="Daily Rate" />
      </Form.Item>

      <Form.Item label="Rental Price / Day" name="rentalPricePerDay">
        <Input type="number" placeholder="Rental Price per Day" />
      </Form.Item>

      <Form.Item label="Long Term Discount (%)" name="longTermDiscount">
        <Input type="number" placeholder="Long Term Discount" />
      </Form.Item>

      <Form.Item label="Seating Capacity" name="seatingCapacity">
        <Input type="number" placeholder="Seating Capacity" />
      </Form.Item>

      <Form.Item label="Mileage Limit" name="mileageLimit">
        <Input type="number" placeholder="Mileage Limit" />
      </Form.Item>

      <Form.Item label="Car Type" name="carType">
        <Select placeholder="Car Type">
          <Option value="SEDAN">Sedan</Option>
          <Option value="VAN">Van</Option>
          <Option value="SUV">SUV</Option>
          <Option value="TRUCK">Truck</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Eco Friendly" name="ecoFriendly">
        <Select placeholder="Eco Friendly">
          <Option value="HYBRID">Hybrid</Option>
          <Option value="ELECTRIC">Electric</Option>
          <Option value="GAS">Gas</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Active" name="isActive" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item label="Description" name="description">
        <Input.TextArea rows={3} placeholder="Description" />
      </Form.Item>

      {/* Photos */}
      <Form.Item label="Photos">
        <Upload
          customRequest={dummyRequest}
          listType="picture-card"
          fileList={fileList}
          onPreview={handlePreview}
          onChange={handleChange}
          beforeUpload={beforeUpload}
        >
          {fileList.length >= 5 ? null : (
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          )}
        </Upload>
        {previewImage && (
          <Image
            wrapperStyle={{ display: "none" }}
            preview={{
              visible: previewOpen,
              onVisibleChange: (visible) => setPreviewOpen(visible),
              afterOpenChange: (visible) => !visible && setPreviewImage(""),
            }}
            src={previewImage}
          />
        )}
      </Form.Item>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "10px", marginTop: 20 }}>
        <Button onClick={() => setIsModalOpen?.(false)}>Cancel</Button>
        <Button type="primary" htmlType="submit">
          {isEdit ? "Update" : "Create"}
        </Button>
      </div>
    </Form>
  );
};

const SpinStyle = styled.div`
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  left: 40%;
`;

export default CarsEdit;

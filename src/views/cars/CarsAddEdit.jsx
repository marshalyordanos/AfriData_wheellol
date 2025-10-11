import React, { useEffect, useState } from "react";
import {
  Button,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Spin,
  Switch,
} from "antd";
import styled from "styled-components";
import { ButtonStyle, FormStyle } from "../../components/commons/CommonStyles";
import carsService from "./CarsService";
import CommonModal from "../../components/commons/CommonModel";

const { Option } = Select;

const validateMessages = {
  required: "${label} is required!",
  types: {
    email: "${label} is not a valid email!",
    number: "${label} is not a valid number!",
  },
  number: {
    range: "${label} must be between ${min} and ${max}",
  },
};

const CarsAddEdit = ({ setIsModalOpen, isModalOpen, mode, searchData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const [brands, setBrands] = useState([]);
  const [allModels, setAllModels] = useState([]);
  const [models, setModels] = useState([]);

  // Fetch brands and models
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const brandData = await carsService.getBrands();
        setBrands(brandData || []);

        const modelData = await carsService.getModels();
        setAllModels(modelData || []);
        setModels(modelData || []);
      } catch (err) {
        console.error("Failed to fetch brands/models:", err);
      }
    };

    fetchOptions();
  }, []);

  // Fetch existing car if editing (after brands/models are loaded)
  useEffect(() => {
    if (mode && allModels.length > 0) {
      const fetchCar = async () => {
        try {
          const data = await carsService.getCar(mode);
          form.setFieldsValue({
            ...data,
            is_featured: data.is_featured || false,
          });

          // Filter models based on car brand
          if (data.brand) {
            const filteredModels = allModels.filter(
              (m) => m.brandName === data.brand
            );
            setModels(filteredModels);
          }
        } catch (err) {
          console.error("Failed to fetch car data:", err);
        }
      };
      fetchCar();
    }
  }, [mode, allModels]);

  // Handle form submit
  const onFinish = async (values) => {
    try {
      setLoading(true);
      if (mode) {
        // Edit existing car
        await carsService.updateCar(values, mode);
      } else {
        // Add new car
        await carsService.addCar(values);
      }

      searchData(); // refresh list
      setIsModalOpen(false);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // Handle brand change to filter models
  const handleBrandChange = (brandName) => {
    const filteredModels = allModels.filter((m) => m.brandName === brandName);
    setModels(filteredModels);
    form.setFieldsValue({ model: undefined }); // reset model selection
  };

  return (
    <CommonModal
      width={800}
      isModalOpen={isModalOpen}
      setIsModalOpen={setIsModalOpen}
    >
      {loading && (
        <SpinStyle>
          <Spin size="large" />
        </SpinStyle>
      )}

      <FormStyle
        form={form}
        layout="vertical"
        onFinish={onFinish}
        validateMessages={validateMessages}
      >
        {/* Title */}
        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        {/* Brand */}
        <Form.Item
          name="brand"
          label="Brand"
          rules={[{ required: true, message: "Please select a brand!" }]}
        >
          <Select placeholder="Select a brand" onChange={handleBrandChange}>
            {brands.map((b) => (
              <Option key={b.id} value={b.name}>
                {b.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="model"
          label="Model"
          rules={[{ required: true, message: "Please select a model!" }]}
        >
          <Select placeholder="Select a model">
            {models.map((m) => (
              <Option key={m.id} value={m.name}>
                {m.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Year */}
        <Form.Item name="year" label="Year" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        {/* Is Featured */}
        <Form.Item name="is_featured" label="Featured">
          <Switch />
        </Form.Item>

        {/* Category */}
        <Form.Item
          name="category"
          label="Category"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        {/* Transmission */}
        <Form.Item
          name="transmission"
          label="Transmission"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        {/* Fuel Type */}
        <Form.Item
          name="fuel_type"
          label="Fuel Type"
          rules={[{ required: true }]}
        >
          <Select placeholder="Select fuel type">
            <Option value="petrol">Petrol</Option>
            <Option value="diesel">Diesel</Option>
            <Option value="electric">Electric</Option>
          </Select>
        </Form.Item>

        {/* Seating Capacity */}
        <Form.Item
          name="seating_capacity"
          label="Seating Capacity"
          rules={[{ type: "number", min: 1, max: 20 }]}
        >
          <InputNumber />
        </Form.Item>

        {/* Rental Price per Day */}
        <Form.Item
          name="rental_price_per_day"
          label="Rental Price / Day"
          rules={[{ type: "number", min: 0 }]}
        >
          <InputNumber />
        </Form.Item>

        {/* Location */}
        <Form.Item
          name="location"
          label="Location"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        {/* Description */}
        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true }]}
        >
          <Input.TextArea rows={3} />
        </Form.Item>

        {/* Images */}
        <Form.Item name="images" label="Images" rules={[{ required: true }]}>
          <Input placeholder="Enter image URLs separated by commas" />
        </Form.Item>

        {/* Insurance Info */}
        <Form.Item name="insurance_info" label="Insurance Info">
          <Input />
        </Form.Item>

        {/* Rental Terms */}
        <Form.Item name="rental_terms" label="Rental Terms">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Divider />

        {/* Buttons */}
        <ButtonStyle>
          <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button type="primary" htmlType="submit">
            {mode ? "Update Car" : "Add Car"}
          </Button>
        </ButtonStyle>
      </FormStyle>
    </CommonModal>
  );
};

const SpinStyle = styled.div`
  width: 50px;
  height: 50px;
  background-color: rgba(0, 0, 0, 0.2);
  z-index: 100;
  display: flex;
  border-radius: 120px;
  justify-content: center;
  align-items: center;
  position: absolute;
  left: 40%;
`;

export default CarsAddEdit;

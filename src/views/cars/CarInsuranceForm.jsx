import React, { useEffect } from "react";
import { Form, Input, Button, message, Select } from "antd";
import carsService from "./CarsService";

const { Option } = Select;

const CarInsuranceForm = ({
  carId,
  insuranceData,
  setIsModalOpen,
  refreshData,
}) => {
  const [form] = Form.useForm();

  const planOptions = ["BASIC", "STANDARD", "PREMIUM"];
  useEffect(() => {
    if (insuranceData) {
      form.setFieldsValue({
        provider: insuranceData.provider,
        plan: insuranceData.plan,
        coverageDetails: insuranceData.coverageDetails,
      });
    } else {
      form.resetFields();
    }
  }, [insuranceData]);

  const handleSubmit = async (values) => {
    try {
      if (insuranceData?.id) {
        // Edit existing
        await carsService.updateCarInsurance(insuranceData.id, values);
        message.success("Insurance updated successfully");
      } else {
        // Create new
        await carsService.createCarInsurance({ ...values, carId });
        message.success("Insurance created successfully");
      }
      setIsModalOpen(false);
      refreshData();
    } catch (err) {
      console.error(err);
      message.error("Failed to save insurance");
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{ provider: "", plan: "", coverageDetails: "" }}
    >
      <Form.Item
        label="Provider"
        name="provider"
        rules={[{ required: true, message: "Please enter provider" }]}
      >
        <Input placeholder="Insurance Provider" />
      </Form.Item>

      <Form.Item
        label="Plan"
        name="plan"
        rules={[{ required: true, message: "Please select a plan" }]}
      >
        <Select placeholder="Select a plan">
          {planOptions.map((plan) => (
            <Option key={plan} value={plan}>
              {plan}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="Coverage Details"
        name="coverageDetails"
        rules={[{ required: true, message: "Please enter coverage details" }]}
      >
        <Input.TextArea rows={4} placeholder="Coverage Details" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          {insuranceData?.id ? "Update Insurance" : "Add Insurance"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default CarInsuranceForm;

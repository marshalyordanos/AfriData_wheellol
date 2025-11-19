import React, { useEffect, useState } from "react";
import { Form, Input, Button, message, Select, Upload, DatePicker } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import carsService from "./CarsService";
import dayjs from "dayjs";

const { Option } = Select;

const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const CarInsuranceForm = ({
  carId,
  insuranceData,
  setIsModalOpen,
  refreshData,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const insuranceTypeOptions = [
    { label: "Third Party", value: "THIRD_PARTY" },
    { label: "Comprehensive", value: "COMPREHENSIVE" },
  ];

  useEffect(() => {
    if (insuranceData) {
      form.setFieldsValue({
        insuranceCompany: insuranceData.insuranceCompany,
        insuranceType: insuranceData.insuranceType,
        policyNumber: insuranceData.policyNumber,
        expiryDate: insuranceData.expiryDate
          ? dayjs(insuranceData.expiryDate)
          : null,
      });

      if (insuranceData.documentFile) {
        setFileList([
          {
            uid: "insuranceDoc",
            name: insuranceData.documentFile.split("/").pop(),
            status: "done",
            url: insuranceData.documentFile,
          },
        ]);
      }
    } else {
      form.resetFields();
      setFileList([]);
    }
  }, [insuranceData]);

  const dummyRequest = ({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0);

  const beforeUpload = (file) => {
    const isAllowed =
      file.type.startsWith("image/") || file.type === "application/pdf";
    if (!isAllowed) {
      message.error("You can only upload image or PDF files!");
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const handlePreview = async (file) => {
    if (!file.url && file.originFileObj) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const formData = new FormData();

      // Append all form values
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "expiryDate") {
            formData.append(key, value.toISOString());
          } else {
            formData.append(key, value);
          }
        }
      });

      // Always append carId
      formData.append("carId", carId);

      // Append document if uploaded
      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append("documentFile", file.originFileObj);
        }
      });

      if (insuranceData?.id) {
        await carsService.updateCarInsurance(insuranceData.id, formData);
        message.success("Insurance updated successfully");
      } else {
        await carsService.createCarInsurance(formData);
        message.success("Insurance created successfully");
      }

      setIsModalOpen(false);
      refreshData();
      setLoading(false);
    } catch (err) {
      setLoading(false);

      console.error(err);
      message.error("Failed to save insurance");
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item
        label="Insurance Company"
        name="insuranceCompany"
        rules={[{ required: true, message: "Please enter insurance company" }]}
      >
        <Input placeholder="Insurance Company" />
      </Form.Item>

      <Form.Item
        label="Insurance Type"
        name="insuranceType"
        rules={[{ required: true, message: "Please select insurance type" }]}
      >
        <Select placeholder="Select insurance type">
          {insuranceTypeOptions.map((type) => (
            <Option key={type.value} value={type.value}>
              {type.label}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="Policy Number"
        name="policyNumber"
        rules={[{ required: true, message: "Please enter policy number" }]}
      >
        <Input placeholder="Policy Number" />
      </Form.Item>

      <Form.Item
        label="Expiry Date"
        name="expiryDate"
        rules={[{ required: true, message: "Please select expiry date" }]}
      >
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item label="Insurance Document">
        <Upload
          customRequest={dummyRequest}
          listType="picture"
          fileList={fileList}
          onChange={({ fileList }) => setFileList(fileList)}
          beforeUpload={beforeUpload}
          onPreview={handlePreview}
          maxCount={1}
        >
          <Button icon={<PlusOutlined />}>Upload Document (Image/PDF)</Button>
        </Upload>
      </Form.Item>

      <Form.Item>
        <Button
          loading={loading}
          type="primary"
          htmlType="submit"
          style={{
            background: "var(--color-primary)",
            borderColor: "var(--color-primary)",
            color: "#fff",
          }}
        >
          {insuranceData?.id ? "Update Insurance" : "Add Insurance"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default CarInsuranceForm;

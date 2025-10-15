import React, { useEffect, useState } from "react";
import { Button, Divider, Form, Input, Upload, message } from "antd";
import { ButtonStyle } from "../../components/commons/CommonStyles";
import styled from "styled-components";
import userService from "./HostService";
import dayjs from "dayjs";

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

// small wrapper for visual styling (optional)
const FormWrapper = styled.div`
  /* you can copy styles from your FormStyle here */
`;

// helper to normalize Upload's event to fileList
const normFile = (e) => {
  if (Array.isArray(e)) return e;
  return e && e.fileList;
};

const HostAddEdit = ({
  setIsModalOpen,
  isModelOpen,
  mode,
  setMode,
  userData,
  searchData,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleReset = () => {
    form.resetFields();
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();

      // Only send allowed fields
      const allowedFields = [
        "firstName",
        "lastName",
        "email",
        "phone",
        "profilePhotoFile",
      ];
      Object.entries(values).forEach(([key, value]) => {
        if (!allowedFields.includes(key)) return;
        if (Array.isArray(value) && value.length && value[0]?.originFileObj) {
          formData.append(key, value[0].originFileObj);
        } else if (Array.isArray(value) && value.length && value[0]?.url) {
          formData.append(key, value[0].url);
        } else if (typeof value === "object" && value !== null) {
          formData.append(key, String(value));
        } else if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      await userService.createHost(formData);
      message.success("Host created successfully");
      setIsModalOpen(false);
      searchData && searchData();
    } catch (err) {
      console.error(err);
      message.error("Failed to create host");
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Validation Failed:", errorInfo);
  };

  return (
    <FormWrapper>
      <Form
        form={form}
        layout="vertical"
        name="host-form"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        validateMessages={validateMessages}
      >
        <Form.Item
          name="firstName"
          label="First Name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="lastName"
          label="Last Name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[{ required: true, type: "email" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Phone Number"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="profilePhotoFile"
          label="Profile Photo"
          valuePropName="fileList"
          getValueFromEvent={normFile}
        >
          <Upload
            name="profilePhotoFile"
            listType="picture"
            maxCount={1}
            beforeUpload={() => false}
          >
            <Button>Upload Profile Photo</Button>
          </Upload>
        </Form.Item>

        <Divider />

        <ButtonStyle>
          <button type="button" onClick={() => setIsModalOpen(false)}>
            cancel
          </button>
          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
        </ButtonStyle>
      </Form>
    </FormWrapper>
  );
};

export default HostAddEdit;

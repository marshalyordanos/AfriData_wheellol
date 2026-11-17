import React, { useEffect, useState } from "react";
import { Button, Divider, Form, Input, message } from "antd";
import { ButtonStyle } from "../../components/commons/CommonStyles";
import styled from "styled-components";
import staffService from "./StaffService";
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

const StaffAddEdit = ({
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
      if (values && values.password) delete values.password;
      const res = await staffService.createStaff(values);
      message.success(res?.message || "Staff created successfully");
      setIsModalOpen(false);
      searchData && searchData();
    } catch (err) {
      console.error(err);
      message.error(
        err?.response?.data?.message || err?.message || "Failed to create staff"
      );
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

export default StaffAddEdit;

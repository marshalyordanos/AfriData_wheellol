import React, { useEffect, useState } from "react";
import { Button, Form, Input, Select, Spin, Upload, message } from "antd";
import styled from "styled-components";
import { ButtonStyle, FormStyle } from "../../components/commons/CommonStyles";
import userService from "./HostService";

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

const HostEdit = ({
  setIsModalOpen,
  isModelOpen,
  mode,
  setMode,
  userData,
  searchData,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState("");

  useEffect(() => {
    if (userData && Object.keys(userData).length > 0) {
      form.setFieldsValue({
        use: {
          first_name: userData.firstName || "",
          last_name: userData.lastName || "",
          email: userData.email || "",
          phone_number: userData.phone || "",
          profilePhotoFile: userData.profilePhotoFile || [],
        },
      });
    }
  }, [userData]);

  const handleReset = () => {
    form.resetFields(); // Reset form fields
  };

  const onAdd = async (datas) => {
    try {
      setLoading(true);

      const data = await userService.createUse(datas.use);
      setIsModalOpen(false);
      searchData();

      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const onUpdate = async (datas) => {
    try {
      setLoading(true);

      const payload = {
        firstName: datas.use.first_name,
        lastName: datas.use.last_name,
        email: datas.use.email,
        phone: datas.use.phone_number,
        profilePhotoFile: datas.use.profilePhotoFile,
      };

      const id = userData._id || userData.id;
      await userService.updateHost(payload, id);
      message.success("Host updated successfully");
      searchData();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Update failed", err);
      message.error("Failed to update host");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = (values) => {
    mode == "" ? onAdd(values) : onUpdate(values);
  };

  return (
    <div>
      {loading ? (
        <SpinStyle>
          <Spin style={{ color: "#fff" }} size="large" />
        </SpinStyle>
      ) : (
        ""
      )}
      <FormStyle
        form={form}
        layout="vertical"
        name="nest-messages"
        onFinish={onFinish}
        onError={() => {}}
        validateMessages={validateMessages}
      >
        <Form.Item
          className=" flex-1"
          name={["use", "first_name"]}
          label="First Name"
          rules={[{ required: true }]}
        >
          <Input className="border-gray-400 py-2" />
        </Form.Item>
        <Form.Item
          className=" flex-1"
          name={["use", "last_name"]}
          label="Last Name"
          rules={[{ required: true }]}
        >
          <Input className="border-gray-400 py-2" />
        </Form.Item>
        <Form.Item
          className=" flex-1"
          name={["use", "email"]}
          label="Email"
          rules={[{ required: true }]}
        >
          <Input className="border-gray-400 py-2" />
        </Form.Item>
        <Form.Item
          className=" flex-1"
          name={["use", "phone_number"]}
          label="Phone Number"
          rules={[{ required: true }]}
        >
          <Input className="border-gray-400 py-2" />
        </Form.Item>
        <Form.Item
          className=" flex-1"
          name={["use", "profilePhotoFile"]}
          label="Profile Photo"
          valuePropName="fileList"
          getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
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
      </FormStyle>
      <ButtonStyle>
        <button type="button" onClick={() => setIsModalOpen(false)}>
          Cancel
        </button>
        <button type="submit" form="nest-messages">
          Update
        </button>
      </ButtonStyle>
    </div>
  );
};

const SpinStyle = styled.div`
  /* border: 1px solid; */
  width: 50px;
  height: 50px;

  .ant-spin-dot .ant-spin-dot-spin {
    background-color: red;
  }
`;

export default HostEdit;

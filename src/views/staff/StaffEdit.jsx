import React, { useEffect, useState } from "react";
import { Button, Form, Input, Upload, Spin, message } from "antd";
import styled from "styled-components";
import StaffService from "./StaffService";
import { ButtonStyle, FormStyle } from "../../components/commons/CommonStyles";

const validateMessages = {
  required: "${label} is required!",
  types: {
    email: "${label} is not a valid email!",
  },
};

const StaffEdit = ({
  setIsModalOpen,
  isModelOpen,
  mode,
  setMode,
  userData,
  searchData,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  //  Auto-fill form when editing existing staff
  useEffect(() => {
    if (userData && Object.keys(userData).length > 0) {
      form.resetFields();
      form.setFieldsValue({
        staff: {
          first_name: userData.firstName || "",
          last_name: userData.lastName || "",
          email: userData.email || "",
          phone_number: userData.phone || "",
          role: userData.role?.name || userData.role || "",
          profilePhotoFile: userData.profilePhotoFile || [],
        },
      });
    } else {
      form.resetFields();
    }
  }, [userData]);

  //  Add new staff
  const onAdd = async (values) => {
    try {
      setLoading(true);
      const res = await StaffService.createStaff(values.staff);
      setIsModalOpen(false);
      searchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  //  Update staff
  const onUpdate = async (values) => {
    try {
      setLoading(true);
      const payload = {
        firstName: values.staff.first_name,
        lastName: values.staff.last_name,
        email: values.staff.email,
        phone: values.staff.phone_number,
        role: values.staff.role,
        profilePhotoFile: values.staff.profilePhotoFile,
      };
      const id = userData?._id || userData?.id || mode;
      if (!id) {
        message.error("Missing staff id for update");
        return;
      }

      const res = await StaffService.updateStaff(payload, id);
      message.success(res?.message || "Staff updated successfully");
      await searchData();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setLoading(false);
    }
  };

  // Submit handler
  const onFinish = (values) => {
    if (mode === "") onAdd(values);
    else onUpdate(values);
  };

  return (
    <div>
      {loading && (
        <SpinStyle>
          <Spin size="large" />
        </SpinStyle>
      )}
      <FormStyle
        form={form}
        layout="vertical"
        name="staff-form"
        onFinish={onFinish}
        validateMessages={validateMessages}
      >
        <Form.Item
          name={["staff", "first_name"]}
          label="First Name"
          rules={[{ required: true }]}
        >
          <Input className="border-gray-400 py-2" />
        </Form.Item>

        <Form.Item
          name={["staff", "last_name"]}
          label="Last Name"
          rules={[{ required: true }]}
        >
          <Input className="border-gray-400 py-2" />
        </Form.Item>

        <Form.Item
          name={["staff", "email"]}
          label="Email"
          rules={[{ required: true, type: "email" }]}
        >
          <Input className="border-gray-400 py-2" />
        </Form.Item>

        <Form.Item
          name={["staff", "phone_number"]}
          label="Phone Number"
          rules={[{ required: true }]}
        >
          <Input className="border-gray-400 py-2" />
        </Form.Item>

        <Form.Item name={["staff", "role"]} label="Role">
          <Input className="border-gray-400 py-2" />
        </Form.Item>

        <Form.Item
          name={["staff", "profilePhotoFile"]}
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
        <button type="submit" form="staff-form">
          {mode === "" ? "Add" : "Update"}
        </button>
      </ButtonStyle>
    </div>
  );
};

const SpinStyle = styled.div`
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export default StaffEdit;

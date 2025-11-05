import React, { useState } from "react";
import { Button, Form, Input, message } from "antd";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

const ChangePassword = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      if (values.newPassword !== values.confirmPassword) {
        message.error("New passwords do not match!");
        return;
      }

      const res = await api.post("/auth/change-password", {
        oldPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      if (res) {
        message.success("Password changed successfully!");
        navigate("/dash");
      }
    } catch (err) {
      message.error(
        err?.response?.data?.message || "Failed to change password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex justify-center items-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">Change Password</h1>

        <Form
          name="changePassword"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Current Password"
            name="currentPassword"
            rules={[
              {
                required: true,
                message: "Please input your current password!",
              },
            ]}
          >
            <Input.Password className="h-10" />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              {
                required: true,
                message: "Please input your new password!",
              },
              {
                min: 6,
                message: "Password must be at least 6 characters long",
              },
            ]}
          >
            <Input.Password className="h-10" />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
            name="confirmPassword"
            rules={[
              {
                required: true,
                message: "Please confirm your new password!",
              },
            ]}
          >
            <Input.Password className="h-10" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              // loading={loading}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700"
            >
              Change Password
            </Button>
          </Form.Item>

          <Button type="link" className="w-full" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default ChangePassword;

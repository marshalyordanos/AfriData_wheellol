import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button, Form, Input, message } from "antd";
import authService from "../../api/auth.service";

const RegistrationPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: String(values.phone),
        password: values.password,
      };

      payload.role = "HOST";

      const res = await authService.register(payload);

      if (res?.status === 200 || res?.status === 201 || res?.data?.success) {
        message.success("Registration successful! Please login.");
        navigate("/login");
      } else {
        message.info(
          "Registration completed. Please check your email and login."
        );
        navigate("/login");
      }
    } catch (err) {
      console.error("Registration failed:", err);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Registration failed. Try again.";
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[100vw] h-[100vh] bg-[#628DBA] flex flex-col lg:flex-row justify-between">
      <div className="bg-white h-full flex-1 flex items-center justify-center">
        <div className="min-w-[270px]">
          <div>
            <p className="my-7 text-xl">Register</p>
          </div>

          <Form
            name="registerForm"
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            form={form}
          >
            <div className="flex flex-col items-center">
              <Form.Item
                label="First Name"
                name="firstName"
                className="flex-1 w-full"
                rules={[
                  { required: true, message: "Please input your first name!" },
                ]}
              >
                <Input placeholder="Enter your first name" />
              </Form.Item>

              <Form.Item
                label="Last Name"
                name="lastName"
                className="flex-1 w-full"
                rules={[
                  { required: true, message: "Please input your last name!" },
                ]}
              >
                <Input placeholder="Enter your last name" />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                className="flex-1 w-full"
                rules={[
                  { required: true, message: "Please input your email!" },
                  { type: "email", message: "Please enter a valid email!" },
                ]}
              >
                <Input placeholder="Enter your email address" />
              </Form.Item>

              <Form.Item
                label="Phone"
                name="phone"
                className="flex-1 w-full"
                rules={[
                  {
                    required: true,
                    message: "Please input your phone number!",
                  },
                ]}
              >
                <Input placeholder="Enter your phone number" />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                className="flex-1 w-full"
                rules={[
                  { required: true, message: "Please input your password!" },
                  {
                    min: 6,
                    message: "Password must be at least 6 characters long!",
                  },
                ]}
              >
                <Input.Password placeholder="Enter a strong password" />
              </Form.Item>

              <Form.Item>
                <Button
                  className="bg-[var(--color-primary)] text-white"
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                >
                  Register
                </Button>
              </Form.Item>

              <div
                className="text-center mt-3 text-sm"
                style={{ color: "#333" }}
              >
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-[#628DBA] font-semibold hover:text-[#3B6A92] hover:underline cursor-pointer"
                >
                  Login
                </Link>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import api from "../../api/api";
import { login } from "../../redux/auth/authSlice";
import { useNavigate } from "react-router-dom";
import { Button, Checkbox, Form, Input, message, Modal } from "antd";

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    console.log("Success:", values);
    try {
      const actionResult = await dispatch(login(values));
      navigate("/dash");

      if (login.fulfilled.match(actionResult)) {
      message.success("Login Successful!");
    } else {
      const errorMessage = actionResult.payload?.message || "Login failed. Please check your credentials.";
      message.error(errorMessage);
    }
    } catch (err) {
    console.error("Failed to login:", err);
    message.error("An unexpected error occurred.");
    } finally {
    setLoading(false); 
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsOtpSent(false);
    form.resetFields();
  };

  const handleResetPassword = async (values) => {
    if (!isOtpSent) {
      try {
        const res = await api.post("/auth/send-otp", {
          phoneNumber: values.phoneNumber,
        });
        console.log("res", res);
        // Send OTP logic here
        console.log("Sending OTP to:", values.phoneNumber);
        if (res) {
          setIsOtpSent(true);
        }
      } catch (error) {
        console.log(error);
      }
    } else {
      try {
        const res = await api.post("/auth/reset-password", {
          phoneNumber: values.phoneNumber,
          otp: values.otp,
        });
        console.log("res123", res);
        if (res) {
          // Verify OTP and reset password logic here
          console.log("Resetting password with OTP:", values.otp);
          message.success("Password reset successfully");
          handleCancel();
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  return (
    <div className="w-[100vw] h-[100vh] bg-[#628DBA]  flex flex-col lg:flex-row justify-between ">
      <div className=" bg-white  h-full flex-1 flex  items-start  items-center  justify-center">
        <div className="  min-w-[270px]  ">
          <div>
            <p className=" my-7 text-xl">Login</p>
          </div>
          <Form
            name="basic"
            initialValues={{
              remember: true,
            }}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
          >
            <div className="flex flex-col items-center">
              <Form.Item
                label="Email"
                name="email"
                className="flex-1 w-full"
                rules={[
                  {
                    required: true,
                    message: "Please input your email!",
                  },
                  {
                    type: 'email',
                    message: 'Please enter a valid email address!',
                    }
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                className="flex-1 w-full"
                rules={[
                  {
                    required: true,
                    message: "Please input your password!",
                  },
                ]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item>
                <Button
                  className="bg-black text-white"
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                >
                  Submit
                </Button>
              </Form.Item>
              <Button type="link" onClick={showModal}>
                Reset Password
              </Button>
            </div>
          </Form>

          <Modal
            title="Reset Password"
            visible={isModalVisible}
            onCancel={handleCancel}
            footer={null}
          >
            <Form form={form} onFinish={handleResetPassword} layout="vertical">
              <Form.Item
                name="phoneNumber"
                label="Phone Number"
                rules={[
                  {
                    required: true,
                    message: "Please input your phone number!",
                  },
                ]}
              >
                <Input disabled={isOtpSent} />
              </Form.Item>
              {isOtpSent && (
                <Form.Item
                  name="otp"
                  label="OTP"
                  rules={[{ required: true, message: "Please input the OTP!" }]}
                >
                  <Input />
                </Form.Item>
              )}
              <Form.Item>
                <Button
                  style={{ background: "black", color: "white" }}
                  type="primary"
                  htmlType="submit"
                >
                  {isOtpSent ? "Verify OTP" : "Send OTP"}
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

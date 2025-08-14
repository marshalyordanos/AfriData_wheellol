import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
// import api from "../../api/api";
import { login } from "../../redux/auth/authSlice";
import { useNavigate } from "react-router-dom";
import { Button, Checkbox, Form, Input, message, Modal } from "antd";
import { selectCurrentUser } from "../../redux/auth/authSlice";
// import authService from "../../api/auth.service";

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [isModalVisible, setIsModalVisible] = useState(false);
  // const [isOtpSent, setIsOtpSent] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dash");
    }
  }, [user, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    console.log("Success:", values);
    try {
      const actionResult = await dispatch(login(values));

      if (login.fulfilled.match(actionResult)) {
        message.success("Login Successful!");
      } else {
        const errorMessage =
          actionResult.payload?.message ||
          "Login failed. Please check your credentials.";
        message.error(errorMessage);
      }
    } catch (err) {
      console.error("Failed to login:", err);
      message.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // const onFinishFailed = (errorInfo) => {
  //   console.log("Failed:", errorInfo);
  // };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    // setIsOtpSent(false);
    form.resetFields();
  };

  // Fake FUNCTION
  const handleForgotPassword = async (values) => {
    setModalLoading(true);
    console.log("Requesting password reset for email:", values.email);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (values.email === "notfound@gmail.com") {
      console.log("Email not found");
      message.error("No account found with that email address.");
    } else {
      console.log("Password reset email sent");
      message.success(
        "If an account exists for that email, a reset link has been sent."
      );
      handleCancel();
    }
    setModalLoading(false);

    // --- The REAL function we will use later ---
    /*
  const handleForgotPassword_REAL = async (values) => {
    setModalLoading(true);
    try {
      await authService.forgotPassword(values.email);
      message.success("If an account exists for that email, a password reset link has been sent.");
      handleCancel();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to send reset email.";
      message.error(errorMessage);
    } finally {
      setModalLoading(false);
    }
  };
  */
  };

  return (
    <div className="w-[100vw] h-[100vh] bg-[#628DBA]  flex flex-col lg:flex-row justify-between ">
      <div className=" bg-white  h-full flex-1 flex  items-center justify-center">
        <div className="  min-w-[270px]  ">
          <div>
            <p className=" my-7 text-xl">Login</p>
          </div>
          <Form
            name="basic"
            // initialValues={{
            //   remember: true,
            // }}
            layout="vertical"
            onFinish={onFinish}
            // onFinishFailed={onFinishFailed}
            autoComplete="off"
          >
            <div className="flex flex-col items-center">
              <Form.Item
                label="Phone"
                name="phone_number"
                className="flex-1 w-full"
                rules={[
                  {
                    required: true,
                    message: "Please input your phone number!",
                  },
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
                Forgot Password?
              </Button>
            </div>
          </Form>

          <Modal
            title="Forgot Password"
            open={isModalVisible}
            onCancel={handleCancel}
            footer={null}
            destroyOnHidden
          >
            <p className="mb-4 text-gray-500">
              Enter your email address and we will send you a link to reset your
              password.
            </p>
            <Form form={form} onFinish={handleForgotPassword} layout="vertical">
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  {
                    required: true,
                    message: "Please input your email address!",
                  },
                  { type: "email", message: "Please enter a valid email!" },
                ]}
              >
                <Input placeholder="yourname@gmail.com" />
              </Form.Item>
              {/* {isOtpSent && (
                <Form.Item
                  name="otp"
                  label="OTP"
                  rules={[{ required: true, message: "Please input the OTP!" }]}
                >
                  <Input />
                </Form.Item>
              )} */}
              <Form.Item>
                <Button
                  style={{ background: "black", color: "white" }}
                  type="primary"
                  htmlType="submit"
                  loading={modalLoading}
                  // block
                >
                  {/* {isOtpSent ? "Verify OTP" : "Send OTP"} */}
                  Send Reset Link
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

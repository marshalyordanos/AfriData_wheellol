import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { login, selectCurrentUser } from "../../redux/auth/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { Button, Form, Input, message, Modal } from "antd";
import { motion } from "framer-motion";
import { IoShieldCheckmark } from "react-icons/io5";
import { FaCarSide, FaHeadset } from "react-icons/fa6"; // from react-icons/fa6 for modern Font Awesome 6 icons

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: enter phone, 2: enter otp+newPassword
  const [forgotPhone, setForgotPhone] = useState("");

  useEffect(() => {
    if (user) {
      navigate("/dash");
    }
  }, [user, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    const payload = {
      ...values,
      phone: values.phone_number ? String(values.phone_number) : "",
    };
    delete payload.phone_number;
    try {
      const actionResult = await dispatch(login(payload));
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

  const showModal = () => setIsModalVisible(true);
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleForgotPassword = async (values) => {
    setModalLoading(true);
    try {
      // Step 1: request password reset via phone
      if (forgotStep === 1) {
        const phone = values.phone;
        if (!phone) {
          message.error("Please enter your phone number.");
          setModalLoading(false);
          return;
        }

        // Call backend to request password reset (sends otp to phone)
        const AuthService = (await import("../../api/auth.service.js")).default;
        await AuthService.requestPasswordReset({ phoneNumber: phone });

        setForgotPhone(phone);
        setForgotStep(2);
        message.success("Verification code sent to your phone.");
      } else {
        // Step 2: submit otp and new password
        const phone = values.phone || forgotPhone;
        const newPassword = values.newPassword;
        const otp = values.otp;

        if (!phone || !newPassword || !otp) {
          message.error("Please provide phone, OTP and new password.");
          setModalLoading(false);
          return;
        }

        const AuthService = (await import("../../api/auth.service.js")).default;
        await AuthService.resetPassword({
          phoneNumber: phone,
          newPassword,
          otp,
        });

        message.success("Password reset successful. You may now login.");
        handleCancel();
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      const msg =
        err?.response?.data?.message || err?.message || "Request failed.";
      message.error(msg);
    } finally {
      setModalLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };
  const headingVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0 },
  };
  const serviceVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Video Side */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/login.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/80 to-blue-900/50" />
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="text-center max-w-md">
            <motion.h1
              className="text-5xl font-bold mb-12 mt-10"
              variants={headingVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              wheellol Car Rental
            </motion.h1>

            <motion.div
              className="space-y-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {[
                {
                  text: "Secure & Reliable Service",
                  icon: (
                    <IoShieldCheckmark className="text-green-300 text-2xl" />
                  ),
                },
                {
                  text: "Fast Delivery Network",
                  icon: <FaCarSide className="text-blue-300 text-2xl" />,
                },
                {
                  text: "24/7 Customer Support",
                  icon: <FaHeadset className="text-purple-300 text-2xl" />,
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-xl p-4 shadow-md"
                  variants={serviceVariants}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  whileHover={{
                    scale: 1.03,
                    backgroundColor: "rgba(255,255,255,0.15)",
                    transition: { duration: 0.2 },
                  }}
                >
                  {item.icon}
                  <span className="text-lg">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right - Form Side */}
      <div className="bg-white flex-1 flex items-center justify-center px-6 sm:px-10 md:px-16 lg:px-20">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img
              src={"./logo.png"}
              alt="Logo"
              className="h-20 mx-auto mb-4 drop-shadow-md"
            />
            <p className="text-2xl font-semibold text-gray-800">Login</p>
          </div>

          <Form
            name="basic"
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            className="space-y-3"
          >
            <Form.Item
              label="Phone"
              name="phone_number"
              rules={[
                { required: true, message: "Please input your phone number!" },
              ]}
            >
              <Input
                size="large"
                className="rounded-lg border-gray-300 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Please input your password!" },
              ]}
            >
              <Input.Password
                size="large"
                className="rounded-lg border-gray-300 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
            </Form.Item>

            <div className="flex justify-between items-center">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                className="rounded-lg h-[40px] text-xl font-medium"
                style={{
                  background: "var(--color-primary)",
                  borderColor: "var(--color-primary)",
                }}
              >
                Login
              </Button>
            </div>

            <div className="text-right mt-2">
              <Button type="link" onClick={showModal} className="p-0">
                Forgot Password?
              </Button>
            </div>
          </Form>

          <Modal
            title="Forgot Password"
            open={isModalVisible}
            onCancel={handleCancel}
            footer={null}
            destroyOnClose
          >
            {forgotStep === 1 ? (
              <>
                <p className="mb-4 text-gray-500 text-sm">
                  Enter your phone number and we'll send a verification code
                  (OTP) to your phone.
                </p>
                <Form
                  form={form}
                  onFinish={handleForgotPassword}
                  layout="vertical"
                >
                  <Form.Item
                    name="phone"
                    label="Phone Number"
                    rules={[
                      {
                        required: true,
                        message: "Please input your phone number!",
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="e.g. 251911123456"
                      className="rounded-lg"
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={modalLoading}
                      className="w-full py-3 rounded-lg"
                      style={{
                        background: "var(--color-primary)",
                        color: "white",
                      }}
                    >
                      Send Verification Code
                    </Button>
                  </Form.Item>
                </Form>
              </>
            ) : (
              <>
                <p className="mb-4 text-gray-500 text-sm">
                  Enter the OTP you received and choose a new password. Phone is
                  pre-filled.
                </p>
                <Form
                  form={form}
                  onFinish={handleForgotPassword}
                  layout="vertical"
                  initialValues={{ phone: forgotPhone }}
                >
                  <Form.Item
                    name="phone"
                    label="Phone Number"
                    rules={[{ required: true }]}
                  >
                    <Input size="large" className="rounded-lg" />
                  </Form.Item>

                  <Form.Item
                    name="otp"
                    label="Verification Code (OTP)"
                    rules={[{ required: true }]}
                  >
                    <Input size="large" className="rounded-lg" />
                  </Form.Item>

                  <Form.Item
                    name="newPassword"
                    label="New Password"
                    rules={[{ required: true, min: 6 }]}
                  >
                    <Input.Password size="large" className="rounded-lg" />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={modalLoading}
                      className="w-full py-3 rounded-lg"
                      style={{
                        background: "var(--color-primary)",
                        color: "white",
                      }}
                    >
                      Reset Password
                    </Button>
                  </Form.Item>
                </Form>
              </>
            )}
          </Modal>

          <div className="text-center mt-6 text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="text-[#628DBA] font-semibold hover:underline"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

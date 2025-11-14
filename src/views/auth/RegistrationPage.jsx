import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button, Form, Input, message } from "antd";
import authService from "../../api/auth.service";
import { motion } from "framer-motion";
import { IoShieldCheckmark } from "react-icons/io5";
import { FaCarSide, FaHeadset } from "react-icons/fa6";

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
        role: "HOST",
      };

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
      {/* Left Side - Video Background */}
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

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/80 to-blue-900/50" />

        {/* Content */}
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
                  text: "Secure & Reliable Platform",
                  icon: (
                    <IoShieldCheckmark className="text-green-300 text-2xl" />
                  ),
                },
                {
                  text: "Fast Booking & Listing",
                  icon: <FaCarSide className="text-blue-300 text-2xl" />,
                },
                {
                  text: "24/7 Host Support",
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

      {/* Right Side - Registration Form */}
      <div className="bg-white flex-1 flex items-center justify-center px-6 sm:px-10 md:px-16 lg:px-20">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img
              src={"./logo.png"}
              alt="Logo"
              className="h-20 mx-auto mb-4 drop-shadow-md"
            />
            <p className="text-2xl font-semibold text-gray-800">Register</p>
          </div>

          <Form
            name="registerForm"
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            form={form}
            className="space-y-3"
          >
            <Form.Item
              label="First Name"
              name="firstName"
              rules={[
                { required: true, message: "Please input your first name!" },
              ]}
            >
              <Input
                size="large"
                placeholder="Enter your first name"
                className="rounded-lg border-gray-300 focus:border-[var(--color-primary)]"
              />
            </Form.Item>

            <Form.Item
              label="Last Name"
              name="lastName"
              rules={[
                { required: true, message: "Please input your last name!" },
              ]}
            >
              <Input
                size="large"
                placeholder="Enter your last name"
                className="rounded-lg border-gray-300 focus:border-[var(--color-primary)]"
              />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Please input your email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
            >
              <Input
                size="large"
                placeholder="Enter your email address"
                className="rounded-lg border-gray-300 focus:border-[var(--color-primary)]"
              />
            </Form.Item>

            <Form.Item
              label="Phone"
              name="phone"
              rules={[
                { required: true, message: "Please input your phone number!" },
              ]}
            >
              <Input
                size="large"
                placeholder="Enter your phone number"
                className="rounded-lg border-gray-300 focus:border-[var(--color-primary)]"
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Please input your password!" },
                {
                  min: 6,
                  message: "Password must be at least 6 characters long!",
                },
              ]}
            >
              <Input.Password
                size="large"
                placeholder="Enter a strong password"
                className="rounded-lg border-gray-300 focus:border-[var(--color-primary)]"
              />
            </Form.Item>

            <Form.Item>
              <button
                className="bg-[var(--color-primary)] text-white w-full h-[40px] rounded-lg text-xl  font-medium shadow hover:opacity-80"
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                Register
              </button>
            </Form.Item>

            <div className="text-center mt-6 text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-[#628DBA] font-semibold hover:underline"
              >
                Login
              </Link>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;

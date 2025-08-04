import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Form, Input, message, Radio, Upload } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { UploadOutlined } from '@ant-design/icons';
import { register, selectCurrentUser  } from '../../redux/auth/authSlice';

const SignUpPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('renter');
  
  const currentUser = useSelector(selectCurrentUser);

   useEffect(() => {
    if (currentUser) {
      navigate('/dash');
    }
  }, [currentUser, navigate]);
  
  // Fake function
  const onFinish = async (values) => {
    setLoading(true);
    const formData = new FormData();

    Object.keys(values).forEach(key => {
      if (key !== 'profile_picture' && key !== 'driver_license' && key !== 'national_id') {
        formData.append(key, values[key]);
      }
    });
    if (values.profile_picture && values.profile_picture[0]) {
      formData.append('profile_picture', values.profile_picture[0].originFileObj);
    }
    if (values.driver_license && values.driver_license[0]) {
      formData.append('driver_license', values.driver_license[0].originFileObj);
    }
    if (values.national_id && values.national_id[0]) {
      formData.append('national_id', values.national_id[0].originFileObj);
    }

   const actionResult = await dispatch(register(formData));

    if (register.fulfilled.match(actionResult)) {
      message.success("Registration successful! You are now logged in.");
     } else {
      message.error(actionResult.payload?.message || "Registration failed. Please try again.");
    }
    setLoading(false);
  };
  
  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center py-12">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Create an Account</h1>
        <Form
          name="signup"
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ role: 'renter' }}
        >
          
          <Form.Item name="first_name" label="First Name" rules={[{ required: true }]}>
              <Input />
          </Form.Item>

          <Form.Item name="last_name" label="Last Name" rules={[{ required: true }]}>
              <Input />
          </Form.Item>
          
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="phone_number" label="Phone Number" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="password" label="Password" rules={[{ required: true, min: 4 }]}>
            <Input.Password />
          </Form.Item>

          <Form.Item name="role" label="I want to sign up as a:" rules={[{ required: true }]}>
            <Radio.Group onChange={(e) => setRole(e.target.value)} value={role}>
              <Radio value="renter">Renter</Radio>
              <Radio value="car_owner">Car Owner</Radio>
            </Radio.Group>
          </Form.Item>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="profile_picture" label="Profile Picture" valuePropName="fileList" getValueFromEvent={normFile}>
                <Upload name="logo" listType="picture" maxCount={1}>
                    <Button icon={<UploadOutlined />}>Click to upload</Button>
                </Upload>
            </Form.Item>
                    
            <Form.Item name="driver_license" label="Driver's License" valuePropName="fileList" getValueFromEvent={normFile}>
                <Upload name="logo" listType="picture" maxCount={1}>
                    <Button icon={<UploadOutlined />}>Click to upload</Button>
                        </Upload>
            </Form.Item>
            <Form.Item name="national_id" label="National ID" valuePropName="fileList" getValueFromEvent={normFile}>
                <Upload name="logo" listType="picture" maxCount={1}>
                    <Button icon={<UploadOutlined />}>Click to upload</Button>
                        </Upload>
            </Form.Item>
          </div>

          <Form.Item>
            <Button
              className="bg-black text-white w-full"
              type="primary"
              htmlType="submit"
              loading={loading}
            >
              Sign Up
            </Button>
          </Form.Item>

          <div className="text-center">
            <p>Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Log in</Link></p>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default SignUpPage;
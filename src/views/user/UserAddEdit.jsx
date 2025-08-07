import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Form, Input, message, Select, Spin, Upload } from 'antd';
import { UploadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import UserService from './UserService';

const { Option } = Select;

const UserAddEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pageTitle, setPageTitle] = useState('Add New User');

  useEffect(() => {
    if (id) {
      setPageTitle('Edit User');
      fetchUserData(id);
    }
  }, [id, form]);

  const fetchUserData = async (userId) => {
    setLoading(true);
    try {
      const userData = await UserService.getUser(userId);
      if (userData) {
        // placeholder for handling existing files.
        form.setFieldsValue(userData);
      }
    } catch (error) {
      message.error("Failed to fetch user data.");
      navigate('/dash/users');
    } finally {
      setLoading(false);
    }
  };
  
  const onFinish = async (values) => {
    setLoading(true);
    const formData = new FormData();
    Object.keys(values).forEach(key => {
      if (['profile_picture', 'driver_license', 'national_id'].includes(key)) {
        // append file for new one uploaded only
        if (values[key] && values[key][0] && values[key][0].originFileObj) {
          formData.append(key, values[key][0].originFileObj);
        }
      } else if (values[key] !== undefined && values[key] !== null) {
        formData.append(key, values[key]);
      }
    });

    try {
      if (id) {
        await UserService.updateUser(id, formData);
        message.success("User updated successfully!");
      } else {
        await UserService.createUser(formData);
        message.success("User created successfully!");
      }
      navigate('/dash/users'); 
    } catch (error) {
      const errorMessage = error.response?.data?.message || `Failed to ${id ? 'update' : 'create'} user.`;
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const normFile = (e) => {
    if (Array.isArray(e)) { return e; }
    return e && e.fileList;
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          type="text"
          onClick={() => navigate('/dash/users')}
        />
        <h1 className="text-2xl font-bold ml-4">{pageTitle}</h1>
      </div>

      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          name="user-add-edit-form"
          onFinish={onFinish}
          className="max-w-4xl mx-auto"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0 16px' }}>
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
            <Form.Item name="password" label="Password" rules={[{ required: !id, message: 'Password is required for new users!' }]}>
              <Input.Password placeholder={id ? "Leave blank to keep unchanged" : ""} />
            </Form.Item>
            <Form.Item name="role" label="Role" rules={[{ required: true }]}>
              <Select placeholder="Select a role">
                <Option value="admin">Admin</Option>
                <Option value="renter">Renter</Option>
                <Option value="car_owner">Car Owner</Option>
              </Select>
            </Form.Item>
          </div>
          
          <h2 className="text-lg font-semibold mt-6 mb-4">Verification Documents</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0 16px' }}>
            <Form.Item name="profile_picture" label="Profile Picture" valuePropName="fileList" getValueFromEvent={normFile}>
              <Upload listType="picture" maxCount={1} beforeUpload={() => false}>
                <Button icon={<UploadOutlined />}>Upload Profile Picture</Button>
              </Upload>
            </Form.Item>
            <Form.Item name="driver_license" label="Driver's License" valuePropName="fileList" getValueFromEvent={normFile}>
              <Upload listType="picture" maxCount={1} beforeUpload={() => false}>
                <Button icon={<UploadOutlined />}>Upload Drivers License</Button>
              </Upload>
            </Form.Item>
            <Form.Item name="national_id" label="National ID" valuePropName="fileList" getValueFromEvent={normFile}>
              <Upload listType="picture" maxCount={1} beforeUpload={() => false}>
                <Button icon={<UploadOutlined />}>Upload National ID</Button>
              </Upload>
            </Form.Item>
          </div>

          <Form.Item className="mt-8">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
            >
              {id ? 'Update User' : 'Create User'}
            </Button>
            <Button
              size="large"
              className="ml-4"
              onClick={() => navigate('/dash/users')}
            >
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </div>
  );
};

export default UserAddEdit;
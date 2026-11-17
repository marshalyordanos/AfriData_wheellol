import React, { useEffect } from "react";
import { Button, Form, Input, Switch } from "antd";
import brandsService from "./BrandsService";

const BrandsEdit = ({ mode, setMode, setIsModalOpen, searchData }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (mode) {
      // Editing existing brand
      brandsService.getBrand(mode).then((data) => {
        form.setFieldsValue({
          name: data.name,
          isActive: data.isActive,
        });
      });
    } else {
      form.resetFields();
    }
  }, [mode, form]);

  const onFinish = async (values) => {
    try {
      if (mode) {
        await brandsService.updateBrand(values, mode);
      } else {
        await brandsService.createBrand(values);
      }
      searchData();
      setIsModalOpen(false);
      setMode("");
    } catch (error) {
      console.error("Error saving brand", error);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{ isActive: true }}
    >
      <Form.Item
        name="name"
        label="Brand Name"
        rules={[{ required: true, message: "Please enter brand name" }]}
      >
        <Input placeholder="Enter brand name" />
      </Form.Item>

      <Form.Item name="isActive" label="Active" valuePropName="checked">
        <Switch />
      </Form.Item>

      <div className="mp-form-actions">
        <Button
          onClick={() => setIsModalOpen(false)}
          
        >
          Cancel
        </Button>
        <Button
          type="primary"
          htmlType="submit"
        >
          {mode ? "Update" : "Create"}
        </Button>
      </div>
    </Form>
  );
};

export default BrandsEdit;

// src/views/car-models/CarModelsEdit.jsx
import React, { useEffect, useState } from "react";
import { Form, Input, Select, Switch, message, Spin, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import styled from "styled-components";
import brandsService from "./CarModelsService";

const { Option } = Select;

const CarModelsEdit = ({
  modelId = "",
  setIsModalOpen,
  refreshData,
  initialBrands = [],
  initialModel = null,
}) => {
  const [form] = Form.useForm();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [brandLoading, setBrandLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const isEdit = !!modelId;

  // Load model data (if edit) and brands on mount
  useEffect(() => {
    const fetchModelOrBrand = async () => {
      try {
        // If we have an initialModel and initialBrands, we don't need to show loading
        const needModelFetch = modelId && !initialModel;
        const needBrandsFetch = !initialBrands || initialBrands.length === 0;

        if (needModelFetch) setLoading(true);

        // Load brands first so the Select has options before we set form values
        if (needBrandsFetch) {
          await loadBrands("");
        } else {
          setBrands(initialBrands);
        }

        if (modelId) {
          // If parent provided initialModel, use it immediately to populate form
          const data = initialModel || (await brandsService.getModel(modelId));
          form.setFieldsValue({
            name: data.name,
            makeId: data.make?.id || null,
            isActive: data.isActive,
          });
          // logo field removed - no action
        }
      } catch (err) {
        message.error("Failed to load model data");
      } finally {
        setLoading(false);
      }
    };

    fetchModelOrBrand();
  }, [modelId]);

  // Load brands
  const loadBrands = async (searchText = "") => {
    try {
      setBrandLoading(true);
      const list = await brandsService.fetchAllBrands(searchText);
      setBrands(list);
    } catch (err) {
      message.error("Failed to load brands");
    } finally {
      setBrandLoading(false);
    }
  };

  const handleSearchBrands = (val) => loadBrands(val);

  // upload/preview logic removed

  const onFinish = async (values) => {
    try {
      setSubmitLoading(true);
      if (isEdit) {
        await brandsService.updateModelFields({
          id: modelId,
          name: values.name,
          makeId: values.makeId,
          isActive: values.isActive,
        });
        message.success("Model updated");
      } else {
        await brandsService.createModelFields(values);
        message.success("Model created");
      }

      if (refreshData) refreshData();
      if (setIsModalOpen) setIsModalOpen(false);
    } catch (err) {
      message.error("Failed to save model");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <>
      {loading ? (
        <SpinStyle>
          <Spin size="large" />
        </SpinStyle>
      ) : (
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Model Name"
            name="name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="Model name" />
          </Form.Item>

          <Form.Item
            label="Brand"
            name="makeId"
            rules={[{ required: true, message: "Brand is required" }]}
          >
            <Select
              showSearch
              placeholder="Select brand"
              filterOption={false}
              onSearch={handleSearchBrands}
              loading={brandLoading}
              options={brands.map((b) => ({ label: b.name, value: b.id }))}
            />
          </Form.Item>

          <Form.Item label="Active" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>

          {/* Logo field removed */}

          <div className="mp-form-actions">
            <button
              type="button"
              onClick={() => setIsModalOpen && setIsModalOpen(false)}
              className="mp-btn"
            >
              Cancel
            </button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitLoading}
             
            >
              {isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </Form>
      )}
    </>
  );
};

const SpinStyle = styled.div`
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  left: 40%;
`;

export default CarModelsEdit;

// src/views/car-models/CarModelsEdit.jsx
import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  Switch,
  Upload,
  Image,
  message,
  Spin,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import styled from "styled-components";
import brandsService from "./CarModelsService";

const { Option } = Select;

// Convert file to base64 for preview
const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const CarModelsEdit = ({ modelId = "", setIsModalOpen, refreshData }) => {
  const [form] = Form.useForm();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [brandLoading, setBrandLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const isEdit = !!modelId;

  // Load model data (if edit) and brands on mount
  useEffect(() => {
    const fetchModelOrBrand = async () => {
      try {
        setLoading(true);

        if (modelId) {
          // Editing existing model
          const data = await brandsService.getModel(modelId);
          form.setFieldsValue({
            name: data.name,
            makeId: data.make?.id || null,
            isActive: data.isActive,
          });
          if (data.logo) {
            setFileList([
              { uid: "-1", name: "logo.jpg", status: "done", url: data.logo },
            ]);
          }
        }

        // Always load brands for both create & edit
        await loadBrands("");
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

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  const handleChange = ({ fileList: newFileList }) => setFileList(newFileList);

  const dummyRequest = ({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0);

  const beforeUpload = (file) => {
    if (!file.type.startsWith("image/")) {
      message.error("You can only upload image files!");
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const onFinish = async (values) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("makeId", values.makeId);
      formData.append("isActive", values.isActive);

      fileList.forEach((file) => {
        if (file.originFileObj) formData.append("logo", file.originFileObj);
      });

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

          <Form.Item label="Logo">
            <Upload
              customRequest={dummyRequest}
              listType="picture-card"
              fileList={fileList}
              onPreview={handlePreview}
              onChange={handleChange}
              beforeUpload={beforeUpload}
            >
              {fileList.length >= 1 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
            {previewImage && (
              <Image
                wrapperStyle={{ display: "none" }}
                preview={{
                  visible: previewOpen,
                  onVisibleChange: (visible) => setPreviewOpen(visible),
                  afterOpenChange: (visible) => !visible && setPreviewImage(""),
                }}
                src={previewImage}
              />
            )}
          </Form.Item>

          <div style={{ display: "flex", gap: "10px", marginTop: 20 }}>
            <button
              type="button"
              onClick={() => setIsModalOpen && setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit">{isEdit ? "Update" : "Create"}</button>
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

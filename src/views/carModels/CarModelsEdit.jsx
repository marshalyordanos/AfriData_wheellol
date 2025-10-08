// src/views/car-models/CarModelsEdit.js
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
import dayjs from "dayjs";
import brandsService from "./CarModelsService";

const { Option } = Select;

// Convert file to base64
const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const CarModelsEdit = ({
  modelId = "",
  mode = "",
  setIsModalOpen, // list modal
  closeModal, // detail page
  refreshData, // detail page callback
}) => {
  const [form] = Form.useForm();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [brandLoading, setBrandLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const isEdit = !!modelId || !!mode;

  // Fetch model data or brand for edit
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let data;
        if (modelId) {
          data = await brandsService.getModel(modelId);
        } else if (mode) {
          data = await brandsService.getBrand(mode);
        } else return;

        form.setFieldsValue({
          name: data.name,
          makeId: data.make?.id || null,
          isActive: data.isActive,
        });

        if (data.logo) {
          setFileList([
            {
              uid: "-1",
              name: "logo.jpg",
              status: "done",
              url: data.logo,
            },
          ]);
        }

        // Preload brands
        loadBrands("");
      } catch (err) {
        message.error("Failed to load model data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [modelId, mode]);

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

  const dummyRequest = ({ onSuccess }) => {
    setTimeout(() => onSuccess("ok"), 0);
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
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
          id: modelId || mode,
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
      if (closeModal) closeModal();
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

          <Form.Item label="Status" name="isActive" valuePropName="checked">
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
              onClick={() =>
                setIsModalOpen ? setIsModalOpen(false) : closeModal()
              }
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

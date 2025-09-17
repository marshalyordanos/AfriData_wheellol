import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  message,
  Upload,
  Image,
  AutoComplete,
} from "antd";
import styled from "styled-components";
import {
  ButtonStyle,
  FlexStyle,
  FormStyle,
} from "../../components/commons/CommonStyles";
import carsService from "./CarsService";
import { PlusOutlined } from "@ant-design/icons";
import BrandsService from "../brands/BrandsService";
import VehicleTypesService from "../vehicleTypes/VehicleTypesService";

const { Option } = Select;

const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const CarsEdit = ({ setIsModalOpen, mode, searchData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [fileList, setFileList] = useState([]);

  const [brandOptions, setBrandOptions] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);

  const [vehicleTypeOptions, setVehicleTypeOptions] = useState([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);

  const [currentCar, setCurrentCar] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!mode) return; // create mode
      try {
        const data = await carsService.getCar(mode);
        setCurrentCar(data);

        // preload brand select
        if (data?.brand) {
          const option = {
            value: JSON.stringify(data.brand),
            label: (
              <div>
                <p style={{ fontSize: 18 }}>{data.brand.name}</p>
              </div>
            ),
          };
          setBrandOptions([option]);
          setSelectedBrand(data.brand);
        }

        // preload vehicle type select
        if (data?.vehicle_type) {
          const option = {
            value: JSON.stringify(data.vehicle_type),
            label: (
              <div>
                <p style={{ fontSize: 18 }}>{data.vehicle_type.name}</p>
              </div>
            ),
          };
          setVehicleTypeOptions([option]);
          setSelectedVehicleType(data.vehicle_type);
        }

        // preload images
        const imgs = Array.isArray(data?.images) ? data.images : [];
        setFileList(
          imgs.filter(Boolean).map((url, idx) => ({
            uid: String(idx + 1),
            name: `image-${idx + 1}.jpg`,
            status: "done",
            url,
          }))
        );

        // set form fields
        form.setFieldsValue({
          car: {
            year: data?.year,
            model: data?.model?.name || "",
            brand: data?.brand?.name || "",
            vehicle_type: data?.vehicle_type?.name || "",
            fuel_type: data?.fuel_type || undefined,
            transmission: data?.transmission || undefined,
            eco_friendly: data?.eco_friendly || undefined,
            seating_capacity: data?.seating_capacity,
            license_plate: data?.license_plate,
            mileage: data?.mileage,
            odometer: data?.odometer,
            rental_price_per_day: data?.rental_price_per_day,
            location: data?.location?.address || data?.location?.city || "",
            description: data?.description,
            insurance_info: data?.insurance_info,
            rental_terms: data?.rental_terms,
            is_featured: !!data?.is_featured,
          },
        });
      } catch (e) {
        // ignore
      }
    };
    load();
  }, [mode]);

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  const handleChange = ({ fileList: newFileList }) => setFileList(newFileList);

  const uploadButton = (
    <button style={{ border: 0, background: "none" }} type="button">
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );

  const beforeUpload = (file) => {
    const isImage = file.type?.startsWith("image/");
    if (!isImage) {
      message.error("You can only upload image files!");
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const dummyRequest = ({ onSuccess }) => {
    setTimeout(() => onSuccess("ok"), 0);
  };

  const onSelectBrand = (value) => {
    const obj = JSON.parse(value);
    form.setFieldsValue({
      car: { ...form.getFieldsValue().car, brand: obj.name },
    });
    setSelectedBrand(obj);
  };

  const handleSearchBrand = async (value) => {
    const res = await BrandsService.searchBrand({
      page: 1,
      limit: 50,
      searchText: value,
    });
    const data = res.data?.map((x) => ({
      value: JSON.stringify(x),
      label: (
        <div>
          <p style={{ fontSize: 18 }} className="text-lg">
            {x.name}
          </p>
        </div>
      ),
    }));
    setBrandOptions(data || []);
  };

  const onSelectVehicleType = (value) => {
    const obj = JSON.parse(value);
    form.setFieldsValue({
      car: { ...form.getFieldsValue().car, vehicle_type: obj.name },
    });
    setSelectedVehicleType(obj);
  };

  const handleSearchVehicleType = async (value) => {
    const res = await VehicleTypesService.search({
      page: 1,
      limit: 50,
      searchText: value,
    });
    const data = res.data?.map((x) => ({
      value: JSON.stringify(x),
      label: (
        <div>
          <p style={{ fontSize: 18 }} className="text-lg">
            {x.name}
          </p>
        </div>
      ),
    }));
    setVehicleTypeOptions(data || []);
  };

  const onAdd = async (formData) => {
    try {
      setLoading(true);
      await carsService.createCar(formData);
      searchData && searchData();
      setIsModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const onUpdate = async (formData) => {
    try {
      setLoading(true);
      await carsService.updateCar(formData, mode);
      searchData && searchData();
      setIsModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = (values) => {
    const formData = new FormData();
    Object.entries(values.car || {}).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        key !== "brand" &&
        key !== "vehicle_type"
      ) {
        formData.append(key, value);
      }
    });
    // append images
    fileList.forEach((file) => {
      if (file.originFileObj) formData.append("images", file.originFileObj);
    });
    // preserve ids
    const brandId = selectedBrand?._id || currentCar?.brand?._id;
    const vtId = selectedVehicleType?._id || currentCar?.vehicle_type?._id;
    if (brandId) formData.append("brand", brandId);
    if (vtId) formData.append("vehicle_type", vtId);

    if (!mode) onAdd(formData);
    else onUpdate(formData);
  };

  return (
    <div>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <FlexStyle>
          <Form.Item
            className=" flex-1"
            name={["car", "vehicle_type"]}
            label="Vehicle Type"
            rules={[{ required: true }]}
          >
            <AutoComplete
              popupMatchSelectWidth={280}
              style={{ border: "none" }}
              options={vehicleTypeOptions}
              onSelect={onSelectVehicleType}
              onFocus={() => handleSearchVehicleType("")}
              onSearch={handleSearchVehicleType}
            />
          </Form.Item>

          <Form.Item
            className=" flex-1"
            name={["car", "brand"]}
            label="Brand"
            rules={[{ required: true }]}
          >
            <AutoComplete
              popupMatchSelectWidth={280}
              style={{ border: "none" }}
              options={brandOptions}
              onSelect={onSelectBrand}
              onFocus={() => handleSearchBrand("")}
              onSearch={handleSearchBrand}
            />
          </Form.Item>

          <Form.Item
            className=" flex-1"
            name={["car", "model"]}
            label="Model"
            rules={[{ required: true }]}
          >
            <Input className=" bg-zinc-100  py-2" />
          </Form.Item>
        </FlexStyle>

        <FlexStyle>
          <Form.Item name={["car", "year"]} label="Year" className="flex-1">
            <Input className=" bg-zinc-100  py-2" />
          </Form.Item>
          <Form.Item
            name={["car", "license_plate"]}
            label="License plate"
            className=" flex-1"
          >
            <Input className=" bg-zinc-100  py-2" />
          </Form.Item>
          <Form.Item
            name={["car", "seating_capacity"]}
            label="Seating capacity"
            className="flex-1"
          >
            <InputNumber className="w-full  bg-zinc-100  py-1" min={0} />
          </Form.Item>
        </FlexStyle>

        <FlexStyle>
          <Form.Item
            name={["car", "fuel_type"]}
            label="Fuel type"
            className=" flex-1"
            rules={[{ required: true }]}
          >
            <Select style={{ height: 38 }} placeholder="Select fuel type">
              <Option value="Petrol">Petrol</Option>
              <Option value="Diesel">Diesel</Option>
              <Option value="Hybrid">Hybrid</Option>
              <Option value="Electric">Electric</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name={["car", "transmission"]}
            label="Transmission"
            className=" flex-1"
            rules={[{ required: true }]}
          >
            <Select style={{ height: 38 }} placeholder="Select transmission">
              <Option value="Manual">Manual</Option>
              <Option value="Automatic">Automatic</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name={["car", "eco_friendly"]}
            label="Eco friendly"
            className="flex-1"
          >
            <Select style={{ height: 38 }} placeholder="Select type">
              <Option value="hybrid">Hybrid</Option>
              <Option value="electric">Electric</Option>
              <Option value="none">None</Option>
            </Select>
          </Form.Item>
        </FlexStyle>

        <FlexStyle>
          <Form.Item
            name={["car", "mileage"]}
            label="Mileage"
            className="flex-1"
          >
            <InputNumber className="w-full  bg-zinc-100  py-1" min={0} />
          </Form.Item>
          <Form.Item
            name={["car", "odometer"]}
            label="Odometer"
            className="flex-1"
          >
            <InputNumber className="w-full  bg-zinc-100  py-1" min={0} />
          </Form.Item>
          <Form.Item
            name={["car", "rental_price_per_day"]}
            label="Rental price / day"
            className="flex-1"
          >
            <InputNumber className="w-full  bg-zinc-100  py-1" min={0} />
          </Form.Item>
        </FlexStyle>

        <FlexStyle>
          <Form.Item
            className=" flex-1"
            name={["car", "location"]}
            label="Location"
            rules={[{ required: true }]}
          >
            <Input
              className=" bg-zinc-100  py-2"
              placeholder="Address / City"
            />
          </Form.Item>
          <Form.Item
            name={["car", "is_featured"]}
            className="min-w-[120px]"
            label="Is featured"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </FlexStyle>

        <Form.Item
          className=" flex-1"
          name={["car", "description"]}
          label="Description"
          rules={[{ required: true }]}
        >
          <Input.TextArea className=" bg-zinc-100  py-2" rows={3} />
        </Form.Item>

        <Form.Item
          className=" flex-1"
          name={["car", "insurance_info"]}
          label="Insurance info"
          rules={[{ required: true }]}
        >
          <Input.TextArea className=" bg-zinc-100  py-2" rows={2} />
        </Form.Item>

        <Form.Item
          className=" flex-1"
          name={["car", "rental_terms"]}
          label="Rental terms"
          rules={[{ required: true }]}
        >
          <Input.TextArea className=" bg-zinc-100  py-2" rows={2} />
        </Form.Item>

        <div style={{ marginBottom: 20 }}>
          <h2 style={{ marginBottom: 7 }} className="text-lg">
            Photos
          </h2>
          <Upload
            customRequest={dummyRequest}
            listType="picture-card"
            fileList={fileList}
            onPreview={handlePreview}
            onChange={handleChange}
            beforeUpload={beforeUpload}
          >
            {fileList.length >= 8 ? null : uploadButton}
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
        </div>

        <ButtonStyle>
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" disabled={loading}>
            {mode ? "Update" : "Create"}
          </button>
        </ButtonStyle>
      </Form>
    </div>
  );
};

export default CarsEdit;

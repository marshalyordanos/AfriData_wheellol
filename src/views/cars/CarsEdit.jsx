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
import CarModelsService from "../carModels/CarModelsService";
import FeaturesService from "./FeaturesService";

const { Option } = Select;

const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const CarsEdit = ({ setIsModalOpen, mode, searchData, initialCar }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [fileList, setFileList] = useState([]);

  const [brandOptions, setBrandOptions] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);

  const [vehicleTypeOptions, setVehicleTypeOptions] = useState([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);

  const [modelOptions, setModelOptions] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);

  const [featuresOptions, setFeaturesOptions] = useState([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);

  const [currentCar, setCurrentCar] = useState(null);

  useEffect(() => {
    const hydrate = async (data) => {
      // Some sources may pass { car: {...} } shape; unwrap if present
      const core = data && data.car ? data.car : data;
      setCurrentCar(core);
      if (core?.location) {
        console.debug("Hydrating car location:", core.location);
      }

      // preload brand select
      if (core?.brand) {
        const option = {
          value: JSON.stringify(core.brand),
          label: (
            <div>
              <p style={{ fontSize: 18 }}>{core.brand.name}</p>
            </div>
          ),
        };
        setBrandOptions([option]);
        setSelectedBrand(core.brand);
      }

      // preload vehicle type select
      if (core?.vehicle_type) {
        const option = {
          value: JSON.stringify(core.vehicle_type),
          label: (
            <div>
              <p style={{ fontSize: 18 }}>{core.vehicle_type.name}</p>
            </div>
          ),
        };
        setVehicleTypeOptions([option]);
        setSelectedVehicleType(core.vehicle_type);
      }

      // preload images
      const imgs = Array.isArray(core?.images) ? core.images : [];
      setFileList(
        imgs.filter(Boolean).map((url, idx) => ({
          uid: String(idx + 1),
          name: `image-${idx + 1}.jpg`,
          status: "done",
          url,
        }))
      );

      // preload models: if brand filter exists limit set; else load all for immediate dropdown
      try {
        const modelsRes = await CarModelsService.searchModels({
          page: 1,
          limit: 400,
          searchText: "",
        });
        let list = modelsRes?.data || [];
        if (core?.brand?._id) {
          list = list.filter((m) => m?.brand?._id === core.brand._id);
        }
        const opts = list.map((m) => ({
          value: JSON.stringify(m),
          label: m.name,
        }));
        setModelOptions(opts);
        if (core?.model) setSelectedModel(core.model);
      } catch (e) {
        console.warn("Model preload failed", e);
        setModelOptions([]);
      }

      // preload features options minimally from current data
      if (Array.isArray(core?.features)) {
        const opts = core.features
          .filter((f) => f?._id && f?.name)
          .map((f) => ({ label: f.name, value: f._id }));
        setFeaturesOptions(opts);
      }

      // set form fields
      // Extract coordinates robustly
      let coordLat, coordLng;
      if (
        Array.isArray(core?.location?.coordinates) &&
        core.location.coordinates.length >= 2
      ) {
        coordLng = Number(core.location.coordinates[0]);
        coordLat = Number(core.location.coordinates[1]);
        if (Number.isNaN(coordLat)) coordLat = undefined;
        if (Number.isNaN(coordLng)) coordLng = undefined;
      }

      form.setFieldsValue({
        car: {
          year: core?.year,
          model: core?.model?.name || core?.model || "",
          brand: core?.brand?.name || "",
          vehicle_type: core?.vehicle_type?.name || "",
          fuel_type: core?.fuel_type || undefined,
          transmission: core?.transmission || undefined,
          eco_friendly: core?.eco_friendly || undefined,
          seating_capacity: core?.seating_capacity,
          license_plate: core?.license_plate,
          mileage: core?.mileage,
          odometer: core?.odometer,
          rental_price_per_day: core?.rental_price_per_day,
          // location fields
          loc_address: core?.location?.address?.trim?.() || "",
          loc_city: core?.location?.city?.trim?.() || "",
          loc_region: core?.location?.region?.trim?.() || "",
          loc_country: core?.location?.country?.trim?.() || "",
          loc_latitude: coordLat,
          loc_longitude: coordLng,
          description: core?.description,
          insurance_info: core?.insurance_info,
          rental_terms: core?.rental_terms,
          is_featured: !!core?.is_featured,
          features: Array.isArray(core?.features)
            ? core.features.map((f) => f?._id).filter(Boolean)
            : [],
        },
      });
      console.debug("Form coordinates after setFieldsValue:", {
        lat: coordLat,
        lng: coordLng,
      });

      // if coordinates missing but we have an id, attempt silent fetch to enrich
      const hasCoords =
        Array.isArray(core?.location?.coordinates) &&
        core.location.coordinates.length >= 2;
      if (!hasCoords && (core?._id || mode)) {
        try {
          const fresh = await carsService.getCar(core?._id || mode, {
            suppressErrorToast: true,
          });
          if (
            Array.isArray(fresh?.location?.coordinates) &&
            fresh.location.coordinates.length >= 2
          ) {
            form.setFieldsValue({
              car: {
                ...form.getFieldsValue().car,
                loc_latitude: Number(fresh.location.coordinates[1]),
                loc_longitude: Number(fresh.location.coordinates[0]),
              },
            });
            console.debug(
              "Enriched coordinates applied:",
              fresh.location.coordinates
            );
          }
        } catch (_) {}
      }
    };

    if (mode) {
      // Always hydrate with initialCar first (fast) then enrich with fresh detail
      if (initialCar) {
        hydrate(initialCar);
      }
      (async () => {
        try {
          const fresh = await carsService.getCar(mode);
          // if response maybe shaped { car: {...} }
          await hydrate(fresh);
        } catch (e) {
          console.debug("Car detail fetch failed for enrichment", e);
        }
      })();
    } else {
      (async () => {
        try {
          const modelsRes = await CarModelsService.searchModels({
            page: 1,
            limit: 400,
            searchText: "",
          });
          setModelOptions(
            (modelsRes?.data || []).map((m) => ({
              value: JSON.stringify(m),
              label: m.name,
            }))
          );
        } catch (e) {
          console.warn("Initial models load failed", e);
        }
        await handleSearchFeatures("");
      })();
    }
  }, [mode, initialCar]);

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
    // when brand changes, reset model and load options for that brand
    form.setFieldsValue({ car: { ...form.getFieldsValue().car, model: "" } });
    setSelectedModel(null);
    loadModelsForBrand(obj?._id, "");
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

  const onSelectVehicleModel = (value) => {
    const obj = JSON.parse(value);
    form.setFieldsValue({
      car: { ...form.getFieldsValue().car, model: obj.name },
    });
    setSelectedModel(obj);
  };

  const handleSearchModel = async (value) => {
    await loadModelsForBrand(selectedBrand?._id, value);
  };

  const loadModelsForBrand = async (brandId, searchText = "") => {
    try {
      const res = await CarModelsService.searchModels({
        page: 1,
        limit: 400,
        searchText,
      });
      let list = res?.data || [];
      if (brandId) list = list.filter((m) => m?.brand?._id === brandId);
      const options = list.map((m) => ({
        value: JSON.stringify(m),
        label: m.name,
      }));
      setModelOptions(options);
    } catch (e) {
      console.warn("loadModelsForBrand failed", e);
      setModelOptions([]);
    }
  };

  const handleSearchFeatures = async (value = "") => {
    try {
      setFeaturesLoading(true);
      const res = await FeaturesService.search({
        page: 1,
        limit: 400,
        searchText: value,
      });
      setFeaturesOptions(
        (res?.data || []).map((f) => ({ label: f.name, value: f._id }))
      );
    } catch (e) {
      console.warn("Features load failed", e);
    } finally {
      setFeaturesLoading(false);
    }
  };

  const onAdd = async (formData) => {
    try {
      setLoading(true);
      await carsService.createCar(formData);
      message.success("Car created successfully");
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
      message.success("Car updated successfully");
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
        key !== "vehicle_type" &&
        key !== "model" &&
        key !== "features" &&
        !key.startsWith("loc_")
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
    // model id (selected or existing) or fallback to typed text
    const modelIdOrText =
      selectedModel?._id || currentCar?.model?._id || values.car?.model || "";
    if (modelIdOrText) formData.append("model", modelIdOrText);
    // features
    const featureIds = Array.isArray(values.car?.features)
      ? values.car.features.filter(Boolean)
      : [];
    if (featureIds.length)
      formData.append("features", JSON.stringify(featureIds));

    // location object (schema expects coordinates array [longitude, latitude])
    const rawLat = values.car?.loc_latitude;
    const rawLng = values.car?.loc_longitude;
    const lat =
      rawLat === undefined || rawLat === null || rawLat === ""
        ? undefined
        : parseFloat(rawLat);
    const lng =
      rawLng === undefined || rawLng === null || rawLng === ""
        ? undefined
        : parseFloat(rawLng);
    const loc_address = (values.car?.loc_address || "").trim();
    const loc_city = (values.car?.loc_city || "").trim();
    const loc_region = (values.car?.loc_region || "").trim();
    const loc_country = (values.car?.loc_country || "").trim();
    const hasLat = Number.isFinite(lat);
    const hasLng = Number.isFinite(lng);
    const anyLocField =
      hasLat || hasLng || loc_address || loc_city || loc_region || loc_country;
    if (anyLocField) {
      if (!hasLat || !hasLng) {
        message.error("Latitude and Longitude are required.");
        setLoading(false);
        return; // abort
      }
      const locationPayload = {
        coordinates: [lng, lat], // [longitude, latitude]
        address: loc_address || "",
        city: loc_city || "",
        region: loc_region || "",
        country: loc_country || "",
      };
      formData.append("location", JSON.stringify(locationPayload));
    }

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
            <AutoComplete
              popupMatchSelectWidth={280}
              style={{ border: "none" }}
              options={modelOptions}
              onSelect={onSelectVehicleModel}
              onFocus={() => handleSearchModel("")}
              onSearch={handleSearchModel}
            />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Form.Item name={["car", "loc_address"]} label="Address">
            <Input className=" bg-zinc-100  py-2" />
          </Form.Item>
          <Form.Item name={["car", "loc_city"]} label="City">
            <Input className=" bg-zinc-100  py-2" />
          </Form.Item>
          <Form.Item name={["car", "loc_region"]} label="Region">
            <Input className=" bg-zinc-100  py-2" />
          </Form.Item>
          <Form.Item name={["car", "loc_country"]} label="Country">
            <Input className=" bg-zinc-100  py-2" />
          </Form.Item>
          <Form.Item
            name={["car", "loc_latitude"]}
            label="Latitude"
            rules={[
              {
                type: "number",
                transform: (v) => (v === "" ? undefined : Number(v)),
              },
            ]}
          >
            <InputNumber className="w-full bg-zinc-100 py-1" />
          </Form.Item>
          <Form.Item
            name={["car", "loc_longitude"]}
            label="Longitude"
            rules={[
              {
                type: "number",
                transform: (v) => (v === "" ? undefined : Number(v)),
              },
            ]}
          >
            <InputNumber className="w-full bg-zinc-100 py-1" />
          </Form.Item>
          <Form.Item
            name={["car", "is_featured"]}
            label="Is featured"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </div>

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

        <Form.Item name={["car", "features"]} label="Features">
          <Select
            mode="multiple"
            placeholder="Select features"
            options={featuresOptions}
            loading={featuresLoading}
            onDropdownVisibleChange={(open) => {
              if (open && featuresOptions.length === 0)
                handleSearchFeatures("");
            }}
            showSearch
            onSearch={handleSearchFeatures}
            filterOption={(input, option) =>
              (option?.label || "").toLowerCase().includes(input.toLowerCase())
            }
            allowClear
          />
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

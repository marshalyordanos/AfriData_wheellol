import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  Switch,
  Upload,
  Button,
  DatePicker,
  message,
  Row,
  Col,
  Typography,
  Spin,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import styled from "styled-components";
import carsService from "./CarsService";
import { selectCurrentUser } from "../../redux/auth/authSlice";
import { useSelector } from "react-redux";
import CartypesService from "../cartypes/CartypesService";
import LocationService from "../locations/LocationService";
import {
  CarDocumentsEditor,
  CarPhotosEditor,
  appendCarFiles,
  carFilesFromCar,
  countCarFiles,
  emptyCarFiles,
} from "../../components/carFiles/CarFiles";

const { Option } = Select;
const { Title } = Typography;

const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

/** One numbered section of the form (outside the component so inputs keep focus) */
const Sec = ({ n, title, sub, children }) => (
  <section className="cf-form-sec">
    <div className="cf-form-h">
      <span className="n">{n}</span>
      <div style={{ minWidth: 0 }}>
        <b>{title}</b>
        {sub && (
          <div>
            <span className="s">{sub}</span>
          </div>
        )}
      </div>
    </div>
    <div className="cf-form-b">{children}</div>
  </section>
);

const CarsEdit = ({ carId = null, setIsModalOpen, refreshData }) => {
  const [form] = Form.useForm();
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [carTypes, setCarTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [savedLocation, setSavedLocation] = useState("");

  // Photos (6 slots + extras) and documents — all optional
  const [files, setFiles] = useState(emptyCarFiles);
  const [photoList, setPhotoList] = useState([]); // old upload list (unused)
  const [techCertList, setTechCertList] = useState([]);
  const [gpsReceiptList, setGpsReceiptList] = useState([]);
  const [previewImage, setPreviewImage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [brandLoading, setBrandLoading] = useState(false);
  const [carTypesLoading, setCartypeLoading] = useState(false);

  const [showGPS, setShowGPS] = useState(false);

  const isEdit = !!carId;
  const userData = useSelector(selectCurrentUser);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);

        const brandsList = await carsService.getBrands();
        setBrands(brandsList);

        const typeList = await CartypesService.searchCartype({
          page: 1,
          limit: 1000,
        });
        setCarTypes(typeList?.data);

        // Locations come from Settings → Locations (active ones only)
        try {
          const locRes = await LocationService.list({ pageSize: 200, active: "true" });
          setLocations(locRes?.data || []);
        } catch (e) {
          setLocations([]);
        }

        if (isEdit) {
          const carData = await carsService.getCar(carId);
          if (carData) {
            setShowGPS(carData.hasGPS);
            setFiles(carFilesFromCar(carData));
            setSavedLocation(carData.location || "");

            form.setFieldsValue({
              makeId: carData.makeId,
              modelId: carData.modelId,
              year: carData.year,
              color: carData.color,
              licensePlate: carData.licensePlate,
              vin: carData.vin,
              transmission: carData.transmission,
              mileage: carData.mileage,
              dailyRate: carData.dailyRate,
              rentalPricePerDay: carData.rentalPricePerDay,
              longTermDiscount: carData.longTermDiscount,
              seatingCapacity: carData.seatingCapacity,
              mileageLimit: carData.mileageLimit,
              carType: carData.carTypeId,
              ecoFriendly: carData.ecoFriendly,
              isActive: carData.isActive,
              description: carData.description || "",
              location: carData.location || undefined,
              hasGPS: carData.hasGPS,
              gpsDeviceBrand: carData.gpsDeviceBrand,
              gpsImeiNumber: carData.gpsImeiNumber,
              gpsPlatformUrl: carData.gpsPlatformUrl,
              gpsPlatformUsername: carData.gpsPlatformUsername,
              gpsPlatformPassword: carData.gpsPlatformPassword,
              gpsSubscriptionExpiryDate: carData.gpsSubscriptionExpiryDate
                ? new Date(carData.gpsSubscriptionExpiryDate)
                : null,
            });

            // if (carData.photos?.length) {
            //   setPhotoList(
            //     carData.photos.map((url, index) => ({
            //       uid: index,
            //       name: `photo${index + 1}`,
            //       status: "done",
            //       url,
            //     }))
            //   );
            // }

            if (carData.technicalInspectionCertificateUrl) {
              setTechCertList([
                {
                  uid: "techCert",
                  name: "certificate",
                  status: "done",
                  url: carData.technicalInspectionCertificateUrl,
                },
              ]);
            }

            if (carData.gpsInstallationReceiptUrl) {
              setGpsReceiptList([
                {
                  uid: "gpsReceipt",
                  name: "gps receipt",
                  status: "done",
                  url: carData.gpsInstallationReceiptUrl,
                },
              ]);
            }

            if (carData.makeId) {
              const modelsList = await carsService.getModels(carData.makeId);
              setModels(modelsList || []);
            }
          }
        }
      } catch (err) {
        console.error(err);
        message.error("Failed to load car data");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [carId]);

  const handleBrandChange = async (brandId) => {
    form.setFieldsValue({ modelId: null });
    if (!brandId) return setModels([]);
    try {
      const modelsList = await carsService.getModels(brandId);
      setModels(modelsList || []);
    } catch {
      message.error("Failed to load models");
    }
  };

  const handleSearchBrands = async () => {
    try {
      setBrandLoading(true);
      const list = await carsService.getBrands();
      setBrands(list);
    } finally {
      setBrandLoading(false);
    }
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview && file.originFileObj) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  const dummyRequest = ({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0);

  const beforeUpload = (file, pdf = false) => {
    if (file.type.startsWith("image/")) {
      return true;
    }

    if (pdf && file.type === "application/pdf") {
      return true;
    }

    message.error(
      pdf
        ? "You can only upload image or PDF files!"
        : "You can only upload image files!"
    );
    return Upload.LIST_IGNORE;
  };

  const onFinish = async (values) => {
    try {
      setSubmitLoading(true);
      const formData = new FormData();

      formData.append("hostId", userData?.user?.id || userData?.id);

      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            formData.append(key, value.toISOString());
          } else if (typeof value !== "object") {
            formData.append(key, value);
          }
        }
      });

      /* Old: plain photo list + inspection certificate field
      photoList.forEach((file) => {
        if (file.originFileObj) formData.append("photos", file.originFileObj);
      });
      techCertList.forEach((file) => {
        if (file.originFileObj)
          formData.append("technicalInspectionCertificate", file.originFileObj);
      });
      */
      // photo slots + documents (inspection is one of the documents)
      appendCarFiles(formData, files);

      gpsReceiptList.forEach((file) => {
        if (file.originFileObj)
          formData.append("gpsInstallationReceipt", file.originFileObj);
      });

      if (isEdit) {
        await carsService.updateCar(formData, carId);
        message.success("Car updated successfully");
      } else {
        await carsService.createCar(formData);
        message.success("Car created successfully");
      }

      refreshData?.();
      setIsModalOpen?.(false);
    } catch (err) {
      console.error(err);
      message.error("Failed to save car");
    } finally {
      setSubmitLoading(false);
    }
  };

  const counts = countCarFiles(files);
  const year = new Date().getFullYear() + 1;

  if (loading && isEdit) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: 240 }}>
        <Spin />
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
      <Sec n={1} title="Photos" sub="One photo for each side. Click a box or drop a photo on it. You can add them later.">
        <div style={{ paddingBottom: 12 }}>
          <CarPhotosEditor value={files} onChange={setFiles} />
        </div>
      </Sec>

      <Sec n={2} title="Documents" sub="From the rental agreement. Photo or PDF. All optional — add the missing ones later.">
        <div style={{ paddingBottom: 12 }}>
          <CarDocumentsEditor value={files} onChange={setFiles} />
        </div>
      </Sec>

      <Sec n={3} title="Car details">
        <div className="cf-form-grid">
          <Form.Item label="Brand" name="makeId" rules={[{ required: true, message: "Choose the brand" }]}>
            <Select
              showSearch
              placeholder="Select brand"
              optionFilterProp="label"
              onChange={handleBrandChange}
              onDropdownVisibleChange={(o) => o && !brands.length && handleSearchBrands()}
              loading={brandLoading}
              options={brands.map((b) => ({ label: b.name, value: b.id }))}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(a, b) => a.makeId !== b.makeId}>
            {({ getFieldValue }) => (
              <Form.Item label="Model" name="modelId" rules={[{ required: true, message: "Choose the model" }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder={getFieldValue("makeId") ? "Select model" : "Choose the brand first"}
                  options={models.map((m) => ({ label: m.name, value: m.id }))}
                  disabled={!getFieldValue("makeId")}
                />
              </Form.Item>
            )}
          </Form.Item>
          <Form.Item label="Car type" name="carType" rules={[{ required: true, message: "Choose the type" }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select type"
              loading={carTypesLoading}
              options={carTypes.map((b) => ({ label: b.name, value: b.id }))}
            />
          </Form.Item>
          <Form.Item label="Year" name="year" rules={[{ required: true, message: "Enter the year" }]}>
            <Input type="number" min={1980} max={year} placeholder="e.g. 2020" />
          </Form.Item>
          <Form.Item label="Plate number" name="licensePlate" rules={[{ required: true, message: "Enter the plate" }]}>
            <Input placeholder="e.g. AA-03-A61524" />
          </Form.Item>
          <Form.Item label="Colour" name="color" rules={[{ required: true, message: "Enter the colour" }]}>
            <Input placeholder="e.g. White" />
          </Form.Item>
          <Form.Item label="Transmission" name="transmission" rules={[{ required: true, message: "Choose one" }]}>
            <Select placeholder="Transmission">
              <Option value="AUTOMATIC">Automatic</Option>
              <Option value="MANUAL">Manual</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Mileage (km)" name="mileage" rules={[{ required: true, message: "Enter the mileage" }]}>
            <Input type="number" min={0} placeholder="e.g. 85000" />
          </Form.Item>
          <Form.Item label="Location" name="location">
            <Select
              showSearch
              allowClear
              placeholder="Select location"
              optionFilterProp="label"
              loading={loading}
              notFoundContent="No locations. Add them in Locations."
              options={[
                ...locations.map((l) => ({
                  value: l.name,
                  label: [l.name, l.nameAm ? `· ${l.nameAm}` : "", l.region && l.region !== l.name ? `(${l.region})` : ""]
                    .filter(Boolean)
                    .join(" "),
                })),
                // Keep an old typed-in value visible so editing doesn't lose it
                ...(savedLocation && !locations.some((l) => l.name === savedLocation)
                  ? [{ value: savedLocation, label: savedLocation }]
                  : []),
              ]}
            />
          </Form.Item>
          <Form.Item label="VIN / chassis no." name="vin" rules={[{ required: true, message: "Enter the VIN" }]}>
            <Input placeholder="VIN" />
          </Form.Item>
        </div>
      </Sec>

      <Sec n={4} title="Capacity & description">
        <div className="cf-form-grid">
          <Form.Item label="Seats" name="seatingCapacity" rules={[{ required: true, message: "Enter the seats" }]}>
            <Input type="number" min={1} max={80} placeholder="e.g. 5" />
          </Form.Item>
          <Form.Item label="Mileage limit (km/day)" name="mileageLimit">
            <Input type="number" min={0} placeholder="Optional" />
          </Form.Item>
          <Form.Item label="Fuel" name="ecoFriendly">
            <Select placeholder="Fuel">
              <Option value="NONE">Petrol / diesel</Option>
              <Option value="HYBRID">Hybrid</Option>
              <Option value="ELECTRIC">Electric</Option>
            </Select>
          </Form.Item>
          {isEdit && (
            <Form.Item label="Visible to customers" name="isActive" valuePropName="checked">
              <Switch checkedChildren="Visible" unCheckedChildren="Hidden" />
            </Form.Item>
          )}
        </div>
        <Form.Item label="Description" name="description">
          <Input.TextArea rows={3} placeholder="Condition, extras, anything customers should know" />
        </Form.Item>
      </Sec>

      <Sec n={5} title="GPS" sub="Optional">
        <Form.Item label="This car has a GPS tracker" name="hasGPS" valuePropName="checked">
          <Switch onChange={(checked) => setShowGPS(checked)} />
        </Form.Item>
        {showGPS && (
          <>
            <div className="cf-form-grid">
              <Form.Item label="GPS device brand" name="gpsDeviceBrand">
                <Input placeholder="GPS device brand" />
              </Form.Item>
              <Form.Item label="GPS IMEI number" name="gpsImeiNumber">
                <Input placeholder="IMEI" />
              </Form.Item>
              <Form.Item label="GPS platform URL" name="gpsPlatformUrl">
                <Input placeholder="https://" />
              </Form.Item>
              <Form.Item label="Platform username" name="gpsPlatformUsername">
                <Input placeholder="Username" />
              </Form.Item>
              <Form.Item label="Platform password" name="gpsPlatformPassword">
                <Input.Password placeholder="Password" />
              </Form.Item>
              <Form.Item label="Subscription expiry" name="gpsSubscriptionExpiryDate">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </div>
            <Form.Item label="GPS installation receipt" name="gpsInstallationReceiptFile">
              <Upload
                customRequest={dummyRequest}
                listType="picture"
                maxCount={1}
                fileList={gpsReceiptList}
                onChange={({ fileList }) => setGpsReceiptList(fileList)}
                beforeUpload={(file) => beforeUpload(file, true)}
              >
                <Button icon={<PlusOutlined />}>Upload receipt</Button>
              </Upload>
            </Form.Item>
          </>
        )}
      </Sec>

      {/* Old sections (Photos upload list, Technical Inspection Certificate) are in CarsEditLegacy.jsx */}

      <div className="cf-form-actions">
        <span style={{ flex: 1, alignSelf: "center", fontSize: 12.5, color: "var(--c-text-3)" }}>
          {counts.slots}/6 photos · {counts.docs}/6 documents
        </span>
        <Button onClick={() => setIsModalOpen?.(false)}>Cancel</Button>
        <Button loading={submitLoading} type="primary" htmlType="submit">
          {isEdit ? "Save car" : "Add car"}
        </Button>
      </div>
    </Form>
  );
};

export default CarsEdit;

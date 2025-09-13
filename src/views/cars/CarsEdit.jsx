import React, { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Spin,
  Switch,
  DatePicker,
  Divider,
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
import CommonModal from "../../components/commons/CommonModel";
import CarsPick from "./CarsPick";
import dayjs from "dayjs";
import { PlusOutlined } from "@ant-design/icons";
import CategorysService from "../vehicleTypes/VehicleTypesService";
import BrandsService from "../brands/BrandsService";

const { Option } = Select;

const validateMessages = {
  required: "${label} is required!",
  types: {
    email: "${label} is not a valid email!",
    number: "${label} is not a valid number!",
  },
  number: {
    range: "${label} must be between ${min} and ${max}",
  },
};

var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const CarsEdit = ({
  setIsModalOpen,
  isModelOpen,
  mode,
  setMode,
  carsData,
  searchData,
}) => {
  const [form] = Form.useForm();
  const [switch2, setSwitch2] = useState("");
  const [loading, setLoading] = useState("");
  const [carPick, setCarPick] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [fileList, setFileList] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);

  useEffect(() => {
    const featchData = async () => {
      try {
        const data = await carsService.getCar(mode);
        form.setFieldsValue({
          car: { ...data, updatedAt: dayjs(data.updatedAt) },
        });
      } catch (err) {}
    };
    if (mode == "") {
    } else {
      featchData();
    }
  }, []);

  const handleReset = () => {
    form.resetFields(); // Reset form fields
  };

  const carPickHandler = (data) => {
    console.log("carPickHandler", data);

    setCarPick(false);
  };

  const onAdd = async (datas) => {
    try {
      setLoading(true);

      const data = await carsService.createCar(datas);
      setIsModalOpen(false);
      searchData();

      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const onUpdate = async (datas) => {
    try {
      setLoading(true);

      const data = await carsService.updateCar(datas, mode);
      searchData();
      setIsModalOpen(false);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const onFinish = (values) => {
    console.log("values: ", values);

    const formData = new FormData();

    Object.entries(values.car).forEach(([key, value]) => {
      if (key !== "brand" && key !== "category") {
        formData.append(key, value);
      }
    });
    fileList.forEach((file) => {
      if (file.originFileObj) {
        formData.append("images", file.originFileObj);
      }
    });
    formData.append("brand", selectedBrand?._id);
    formData.append("category", selectedCategory?._id);

    mode == "" ? onAdd(formData) : onUpdate(formData);
  };

  const handlePreview = (file) =>
    __awaiter(void 0, void 0, void 0, function* () {
      if (!file.url && !file.preview) {
        file.preview = yield getBase64(file.originFileObj);
      }
      setPreviewImage(file.url || file.preview);
      setPreviewOpen(true);
    });
  const handleChange = ({ fileList: newFileList }) => setFileList(newFileList);
  const uploadButton = (
    <button style={{ border: 0, background: "none" }} type="button">
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith("image/");
    const isLt2M = file.size / 1024 / 1024 < 2; // < 2MB

    if (!isImage) {
      message.error("You can only upload image files!");
      return Upload.LIST_IGNORE;
    }

    // if (!isLt2M) {
    //   message.error('Image must smaller than 2MB!');
    //   return Upload.LIST_IGNORE;
    // }

    return true;
  };
  const dummyRequest = ({ onSuccess }) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  const onSelectCategory = (value) => {
    // console.log("onSelect", value);
    // alert(JSON.parse(value).name);
    form.setFieldsValue({
      car: {
        ...form.getFieldsValue().car,
        // drugId: JSON.parse(value)._id,
        category: JSON.parse(value).name,
      },
    });
    setSelectedCategory(JSON.parse(value));
  };

  const onSelectBrand = (value) => {
    // console.log("onSelect", value);
    // alert(JSON.parse(value).name);
    form.setFieldsValue({
      car: {
        ...form.getFieldsValue().car,
        // drugId: JSON.parse(value)._id,
        brand: JSON.parse(value).name,
      },
    });
    setSelectedBrand(JSON.parse(value));
  };

  const handleSearchCategory = async (value) => {
    console.log("valuessss:", value);
    const res = await CategorysService.searchCategory({
      page: 1,
      limit: 100000,
      searchText: value,
    });

    // console.log("query::", res.data);

    const data = res.data?.map((x) => {
      console.log("query::", x);

      return {
        value: JSON.stringify(x),
        label: (
          <div>
            <p style={{ fontSize: 18 }} className="text-lg">
              {x.name}
            </p>
            {/* <p className="text-gray-500">{x.name}</p> */}
          </div>
        ),
      };
    });

    setCategoryOptions(data);
  };

  const handleSearchBrand = async (value) => {
    console.log("valuessss:", value);
    const res = await BrandsService.searchBrand({
      page: 1,
      limit: 100000,
      searchText: value,
    });

    // console.log("query::", res.data);

    const data = res.data?.map((x) => {
      console.log("query::", x);

      return {
        value: JSON.stringify(x),
        label: (
          <div>
            <p style={{ fontSize: 18 }} className="text-lg">
              {x.name}
            </p>
            {/* <p className="text-gray-500">{x.name}</p> */}
          </div>
        ),
      };
    });

    setBrandOptions(data);
  };
  return (
    <div>
      {/*******  picks **********/}
      {carPick ? (
        <CommonModal
          width={700}
          isModalOpen={carPick}
          setIsModalOpen={setCarPick}
        >
          <CarsPick
            setIsModalOpen={setCarPick}
            selectHandler={carPickHandler}
          />
        </CommonModal>
      ) : (
        ""
      )}

      {loading ? (
        <SpinStyle>
          <Spin style={{ color: "#fff" }} size="large" />
        </SpinStyle>
      ) : (
        ""
      )}
      {/* <button onClick={() => setCarPick(true)}>hhhhhh</button> */}

      <FormStyle
        form={form}
        layout="vertical"
        name="nest-messages"
        onFinish={onFinish}
        onError={() => {}}
        validateMessages={validateMessages}
      >
        <FlexStyle>
          <Form.Item
            className=" flex-1 "
            name={["car", "title"]}
            label="Name"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input placeholder="Name" className=" bg-zinc-100  py-2" />
          </Form.Item>

          <Form.Item
            className=" flex-1"
            name={["car", "year"]}
            label="Year"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input className=" bg-zinc-100  py-2" />
          </Form.Item>

          <Form.Item
            className=" flex-1"
            name={["car", "model"]}
            label="Model"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input className=" bg-zinc-100  py-2" />
          </Form.Item>
        </FlexStyle>
        <FlexStyle>
          <Form.Item
            className=" flex-1"
            name={["car", "brand"]}
            label="Brand"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <AutoComplete
              popupMatchSelectWidth={282}
              style={{
                // width: 300,
                // backgroundColor: "red",
                border: "none",
              }}
              // className=" bg-gray-100"
              options={brandOptions}
              onSelect={onSelectBrand}
              onFocus={handleSearchBrand}
              onSearch={handleSearchBrand}
            ></AutoComplete>
          </Form.Item>

          <Form.Item
            className=" flex-1"
            name={["car", "category"]}
            label="Category"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <AutoComplete
              popupMatchSelectWidth={252}
              style={
                {
                  // width: 300,
                  // backgroundColor: "red",
                }
              }
              className="border-none bg-[#F3F3F3]"
              options={categoryOptions}
              onSelect={onSelectCategory}
              onFocus={handleSearchCategory}
              onSearch={handleSearchCategory}
            ></AutoComplete>
          </Form.Item>

          <Form.Item
            name={["car", "fuel_type"]}
            label="Fuel type"
            className=" flex-1"
            rules={[
              {
                required: true,
                message: "Please select fuel_type!",
              },
            ]}
          >
            <Select
              style={{ height: 38 }}
              className="   "
              placeholder="select your fuel_type"
            >
              <Option value="value1">Value1</Option>
              <Option value="value2">Value2</Option>
            </Select>
          </Form.Item>
        </FlexStyle>

        <FlexStyle>
          <Form.Item
            name={["car", "transmission"]}
            label="Transmission"
            className=" flex-1"
            rules={[
              {
                required: true,
                message: "Please select transmission!",
              },
            ]}
          >
            <Select
              style={{ height: 38 }}
              className=" bg-zinc-100  "
              placeholder="select your fuel_type"
            >
              <Option value="value1">Value1</Option>
              <Option value="value2">Value2</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name={["car", "seating_capacity"]}
            label="Seating capacity"
            className="flex-1"
            rules={[
              {
                type: "number",
                min: 0,
                max: 99,
              },
            ]}
          >
            <InputNumber
              className="w-full  bg-zinc-100  py-1"
              style={{
                minWidth: 150,
              }}
            />
          </Form.Item>

          <Form.Item
            className="flex-1"
            name={["car", "rental_price_per_day"]}
            label="Rental price / day"
            rules={[
              {
                type: "number",
                min: 0,
                max: 99,
              },
            ]}
          >
            <InputNumber
              className="w-full  bg-zinc-100  py-1"
              style={{
                minWidth: 150,
              }}
            />
          </Form.Item>

          <Form.Item
            className=" flex-1"
            name={["car", "location"]}
            label="Location"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input className=" bg-zinc-100  py-2" />
          </Form.Item>
        </FlexStyle>

        <Form.Item
          className=" flex-1"
          name={["car", "description"]}
          label="Description"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input.TextArea className=" bg-zinc-100  py-2" />
        </Form.Item>

        <Form.Item
          className=" flex-1"
          name={["car", "insurance_info"]}
          label="Insurance info"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input.TextArea className=" bg-zinc-100  py-2" />
        </Form.Item>

        <Form.Item
          className=" flex-1"
          name={["car", "rental_terms"]}
          label="Rental terms"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input.TextArea className=" bg-zinc-100  py-2" />
        </Form.Item>

        <Form.Item
          name={["car", "is_featured"]}
          className="min-w-[120px]"
          label="Is featured"
        >
          <Switch
            checked={switch2}
            onChange={(value) => setSwitch2(value)}
            style={{ background: switch2 ? "blue" : "gray" }}
          />
        </Form.Item>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ marginBottom: 7 }} className="text-lg  ">
            Photo
          </h2>
          <Upload
            // action="https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload"
            customRequest={dummyRequest}
            listType="picture-card"
            fileList={fileList}
            onPreview={handlePreview}
            onChange={handleChange}
            beforeUpload={beforeUpload}
          >
            {fileList.length >= 2 ? null : uploadButton}
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
          <button onClick={() => setIsModalOpen(false)}>cancel</button>
          <button type="submit">Submit</button>
        </ButtonStyle>
      </FormStyle>
    </div>
  );
};

const SpinStyle = styled.div`
  /* border: 1px solid; */
  width: 50px;
  height: 50px;
  background-color: rgba(0, 0, 0, 0.2);
  z-index: 100;
  display: flex;
  border-radius: 120px;
  justify-content: center;
  align-items: center;
  position: absolute;
  left: 40%;

  .ant-spin-dot .ant-spin-dot-spin {
    background-color: red;
  }
  /* .ant-select,
  .ant-select-in-form-item {
    background-color: red !important;
  } */
`;

export default CarsEdit;

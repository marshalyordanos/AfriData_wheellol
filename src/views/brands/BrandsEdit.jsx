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
  Image,
  Upload,
  message,
} from "antd";
import styled from "styled-components";
import {
  ButtonStyle,
  FlexStyle,
  FormStyle,
} from "../../components/commons/CommonStyles";
import brandsService from "./BrandsService";
import CommonModal from "../../components/commons/CommonModel";
import BrandsPick from "./BrandsPick";
import dayjs from "dayjs";
import { PlusOutlined } from "@ant-design/icons";

const { Option } = Select;

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

const BrandsEdit = ({
  setIsModalOpen,
  isModelOpen,
  mode,
  setMode,
  brandsData,
  searchData,
}) => {
  const [form] = Form.useForm();
  const [switch2, setSwitch2] = useState("");
  const [loading, setLoading] = useState("");
  const [brandPick, setBrandPick] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [fileList, setFileList] = useState([]);
  useEffect(() => {
    const featchData = async () => {
      try {
        const data = await brandsService.getBrand(mode);
        form.setFieldsValue({
          brand: { ...data, updatedAt: dayjs(data.updatedAt) },
        });
        if (data.logo) {
          const prefilledPhotos = [
            {
              uid: `-${1}`, // Required unique ID
              name: `photo-${1}.jpg`,
              status: "done",
              url: data.logo,
            },
          ];
          setFileList(prefilledPhotos);
        }
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

  const brandPickHandler = (data) => {
    console.log("brandPickHandler", data);

    setBrandPick(false);
  };

  const onAdd = async (datas) => {
    try {
      setLoading(true);

      const data = await brandsService.createBrand(datas);
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

      const data = await brandsService.updateBrand(datas, mode);
      searchData();
      setIsModalOpen(false);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const onFinish = (values) => {
    const formData = new FormData();
    formData.append("name", values.brand.name);
    formData.append("country", values.brand.country);
    formData.append("is_featured", values.brand?.is_featured);

    fileList.forEach((file) => {
      if (file.originFileObj) {
        formData.append("logo", file.originFileObj);
      }
    });
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
  return (
    <div>
      {/*******  picks **********/}
      {brandPick ? (
        <CommonModal
          width={700}
          isModalOpen={brandPick}
          setIsModalOpen={setBrandPick}
        >
          <BrandsPick
            setIsModalOpen={setBrandPick}
            selectHandler={brandPickHandler}
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
      {/* <button onClick={() => setBrandPick(true)}>hhhhhh</button> */}

      <FormStyle
        form={form}
        layout="vertical"
        name="nest-messages"
        onFinish={onFinish}
        onError={() => {}}
        validateMessages={validateMessages}
      >
        <Form.Item
          className=" flex-1"
          name={["brand", "name"]}
          label="name"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input className="bg-gray-100 py-2" />
        </Form.Item>

        <Form.Item
          className=" flex-1"
          name={["brand", "country"]}
          label="Country"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input className="bg-gray-100 py-2" />
        </Form.Item>

        <Form.Item name={["brand", "is_featured"]} label="Is featured">
          <Switch
            checked={switch2}
            onChange={(value) => setSwitch2(value)}
            style={{ background: switch2 ? "blue" : "gray" }}
          />
        </Form.Item>

        {/* <Form.Item
            className=' flex-1'
            name={['brand', 'logo']}
            label="logo"
            rules={[
                {
                required: true,
                },
            ]}
            >
            <Input  
            className='bg-gray-100 py-2'
            />
            </Form.Item>
             */}

        <div style={{ marginBottom: 20 }}>
          <h2 style={{ marginBottom: 7 }} className="text-md  ">
            Logo
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
            {fileList.length >= 1 ? null : uploadButton}
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
`;

export default BrandsEdit;

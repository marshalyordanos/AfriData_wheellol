import React, { useEffect, useState } from "react";
import {
  Button,
  Divider,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Select,
  Spin,
  Switch,
  DatePicker,
} from "antd";
import styled from "styled-components";
import {
  ButtonStyle,
  FlexStyle,
  FormStyle,
} from "../../components/commons/CommonStyles";
import brandsService from "./CarModelsService";
import CommonModal from "../../components/commons/CommonModel";
import BrandsPick from "./CarModelsPick";
import dayjs from "dayjs";
import CommonTable from "../../components/commons/CommonTable";
import { MoreOutlined, ReloadOutlined } from "@ant-design/icons";

import { NavLink } from "react-router-dom";
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

const BrandsEdit = ({
  setIsModalOpen,
  isModelOpen,
  mode,
  setMode,
  brandsData,
  searchData,
}) => {
  const [brandsData2, setBrandsData2] = useState([]);

  const [form] = Form.useForm();
  const [switch2, setSwitch2] = useState("");
  const [loading, setLoading] = useState("");
  const [brandPick, setBrandPick] = useState(false);

  useEffect(() => {
    const featchData = async () => {
      try {
        const data = await brandsService.getBrand(mode);
        form.setFieldsValue({
          brand: { ...data, updatedAt: dayjs(data.updatedAt) },
        });
      } catch (err) {}
    };
    if (mode == "") {
    } else {
      featchData();
    }
  }, []);

  const handleReset = () => {
    form.resetFields();
  };

  const brandPickHandler = (data) => {
    console.log("brandPickHandler", data);

    setBrandPick(false);
  };

  const onAdd = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const data = await brandsService.brandsDo({
        method: "add_list_to_brand",
        payload: { data: brandsData2 },
      });
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

      const data = await brandsService.updateBrand(datas.brand, mode);
      searchData();
      setIsModalOpen(false);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const onFinish = (values) => {
    console.log("===========");
    mode == "" ? handleAddToList(values) : onUpdate(values);
  };
  const handleAddToList = (e) => {
    // e.preventDefault()
    setBrandsData2([
      { ...form.getFieldsValue()?.brand, _id: new Date().getTime() },
      ...brandsData2,
    ]);
    handleReset();
  };

  const onClick = ({ key }, record) => {
    if (key == "edit") {
      console.log("========", record);

      form.setFieldsValue({ brand: record });
      const data = brandsData2.filter((brand) => brand._id !== record._id);
      setBrandsData2(data);
    } else if (key === "delete") {
      console.log("========", record);
      const data = brandsData2.filter((brand) => brand._id !== record._id);
      setBrandsData2(data);
    }
  };
  const items = [
    {
      key: "edit",
      label: <Button type="text">Edit</Button>,
    },
    {
      key: "delete",
      label: <Button type="text"> Delete</Button>,
    },
    {
      key: "3",
      label: (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.luohanacademy.com"
        >
          3rd menu item
        </a>
      ),
    },
  ];

  const columns = [
    {
      title: "name",
      dataIndex: "name",
    },

    {
      title: "country",
      dataIndex: "country",
    },

    {
      title: "is_featured",
      dataIndex: "is_featured",
      render: (text, recored) => {
        return recored.is_featured ? <p>true</p> : <p>false</p>;
      },
    },

    {
      title: "logo",
      dataIndex: "logo",
    },
  ];

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
      <button onClick={() => setBrandPick(true)}>hhhhhh</button>

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
          <Input className="border-gray-400 py-2" />
        </Form.Item>

        <Form.Item
          className=" flex-1"
          name={["brand", "country"]}
          label="country"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input className="border-gray-400 py-2" />
        </Form.Item>

        <Form.Item name={["brand", "is_featured"]} label="is_featured">
          <Switch
            checked={switch2}
            onChange={(value) => setSwitch2(value)}
            style={{ background: switch2 ? "blue" : "gray" }}
          />
        </Form.Item>

        <Form.Item
          className=" flex-1"
          name={["brand", "logo"]}
          label="logo"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input className="border-gray-400 py-2" />
        </Form.Item>

        {brandsData2.length > 0 && (
          <CommonTable
            rowSelectionType={"checkbox"}
            data={brandsData2}
            columns={columns}
            total={brandsData2.lenght}
            loadding={loading}
            type={true}
          />
        )}

        <Divider />

        <ButtonStyle>
          <button onClick={() => setIsModalOpen(false)}>cancel</button>

          {mode ? (
            <button type="submit">Submit</button>
          ) : (
            <button type="submit">Add List</button>
          )}

          {!mode && (
            <button
              disabled={brandsData2.length == 0}
              onClick={onAdd}
              className={brandsData2.length > 0 ? "" : "disable"}
              type="submit"
            >
              Submit
            </button>
          )}
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

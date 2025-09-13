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
import categorysService from "./VehicleTypesService";
import CommonModal from "../../components/commons/CommonModel";
import CategorysPick from "./VehicleTypesPick";
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

const CategorysEdit = ({
  setIsModalOpen,
  isModelOpen,
  mode,
  setMode,
  categorysData,
  searchData,
}) => {
  const [categorysData2, setCategorysData2] = useState([]);

  const [form] = Form.useForm();
  const [switch2, setSwitch2] = useState("");
  const [loading, setLoading] = useState("");
  const [categoryPick, setCategoryPick] = useState(false);

  useEffect(() => {
    const featchData = async () => {
      try {
        const data = await categorysService.getCategory(mode);
        form.setFieldsValue({
          category: { ...data, updatedAt: dayjs(data.updatedAt) },
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

  const categoryPickHandler = (data) => {
    console.log("categoryPickHandler", data);

    setCategoryPick(false);
  };

  const onAdd = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const data = await categorysService.categorysDo({
        method: "add_list_to_category",
        payload: { data: categorysData2 },
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

      const data = await categorysService.updateCategory(datas.category, mode);
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
    setCategorysData2([
      { ...form.getFieldsValue()?.category, _id: new Date().getTime() },
      ...categorysData2,
    ]);
    handleReset();
  };

  const onClick = ({ key }, record) => {
    if (key == "edit") {
      console.log("========", record);

      form.setFieldsValue({ category: record });
      const data = categorysData2.filter(
        (category) => category._id !== record._id
      );
      setCategorysData2(data);
    } else if (key === "delete") {
      console.log("========", record);
      const data = categorysData2.filter(
        (category) => category._id !== record._id
      );
      setCategorysData2(data);
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
      title: "description",
      dataIndex: "description",
    },
  ];

  return (
    <div>
      {/*******  picks **********/}
      {categoryPick ? (
        <CommonModal
          width={700}
          isModalOpen={categoryPick}
          setIsModalOpen={setCategoryPick}
        >
          <CategorysPick
            setIsModalOpen={setCategoryPick}
            selectHandler={categoryPickHandler}
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
      <button onClick={() => setCategoryPick(true)}>hhhhhh</button>

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
          name={["category", "name"]}
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
          name={["category", "description"]}
          label="description"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input className="border-gray-400 py-2" />
        </Form.Item>

        {categorysData2.length > 0 && (
          <CommonTable
            rowSelectionType={"checkbox"}
            data={categorysData2}
            columns={columns}
            total={categorysData2.lenght}
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
              disabled={categorysData2.length == 0}
              onClick={onAdd}
              className={categorysData2.length > 0 ? "" : "disable"}
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

export default CategorysEdit;

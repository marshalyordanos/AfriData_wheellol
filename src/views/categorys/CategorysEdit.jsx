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
} from "antd";
import styled from "styled-components";
import {
  ButtonStyle,
  FlexStyle,
  FormStyle,
} from "../../components/commons/CommonStyles";
import categorysService from "./CategorysService";
import CommonModal from "../../components/commons/CommonModel";
import CategorysPick from "./CategorysPick";
import dayjs from "dayjs";

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
    form.resetFields(); // Reset form fields
  };

  const categoryPickHandler = (data) => {
    console.log("categoryPickHandler", data);

    setCategoryPick(false);
  };

  const onAdd = async (datas) => {
    try {
      setLoading(true);

      const data = await categorysService.createCategory(datas.category);
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
    mode == "" ? onAdd(values) : onUpdate(values);
  };

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
      {/* <button onClick={() => setCategoryPick(true)}>hhhhhh</button> */}

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
          label="Name"
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
          name={["category", "description"]}
          label="Description"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input.TextArea className="bg-gray-100 py-2" />
        </Form.Item>

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

export default CategorysEdit;

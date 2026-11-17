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
import cartypesService from "./CartypesService";
import CommonModal from "../../components/commons/CommonModel";
import CartypesPick from "./CartypesPick";
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

const CartypesEdit = ({
  setIsModalOpen,
  isModelOpen,
  mode,
  setMode,
  cartypesData,
  searchData,
}) => {
  const [form] = Form.useForm();
  const [switch2, setSwitch2] = useState("");
  const [loading, setLoading] = useState("");
  const [cartypePick, setCartypePick] = useState(false);

  useEffect(() => {
    const featchData = async () => {
      try {
        const data = await cartypesService.getCartype(mode);
        console.log("cartttttttttttype:", data);
        form.setFieldsValue({
          cartype: { ...data, updatedAt: dayjs(data.updatedAt) },
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

  const cartypePickHandler = (data) => {
    console.log("cartypePickHandler", data);

    setCartypePick(false);
  };

  const onAdd = async (datas) => {
    try {
      setLoading(true);

      const data = await cartypesService.createCartype(datas.cartype);
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

      const data = await cartypesService.updateCartype(datas.cartype, mode);
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
      {cartypePick ? (
        <CommonModal
          width={700}
          isModalOpen={cartypePick}
          setIsModalOpen={setCartypePick}
        >
          <CartypesPick
            setIsModalOpen={setCartypePick}
            selectHandler={cartypePickHandler}
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
      {/* <button onClick={() => setCartypePick(true)}>hhhhhh</button> */}

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
          name={["cartype", "name"]}
          label="Name"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>

        {/* <Form.Item name={['cartype', 'active']} label="active" >
                    <Switch checked={switch2} onChange={(value)=>setSwitch2(value)} style={{background:switch2?'blue':'gray'}} />
                </Form.Item> */}

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

export default CartypesEdit;

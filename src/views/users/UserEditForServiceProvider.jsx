import React, { useEffect, useState } from "react";
import { Button, Form, Input, Select, Switch, Spin, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";

import styled from "styled-components";
import {
  ButtonStyle,
  FlexStyle,
  FormStyle,
} from "../../components/commons/CommonStyles";
import userService from "./UsersService";
import CommonModal from "../../components/commons/CommonModel";

const { Option } = Select;

const UsersEdit = ({
  setIsModalOpen,
  isModelOpen,
  mode,
  setMode,
  usersData,
  setUsersData,
  searchData,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [wereda, setWereda] = useState({});
  const [state, setState] = useState({});
  const [zone, setZone] = useState({});
  const type = Form.useWatch(["user", "type"], form) || "";

  const [switch2, setSwitch2] = useState(true); // Default to "on" (true)

  useEffect(() => {
    // Set default values for "add" mode
    form.setFieldsValue({
      user: {
        type: "woreda_level",
        isServiceProvider: true,
      },
    });
    setSwitch2(true); // Default to "on" for the switch
  }, []);

  const handleReset = () => {
    form.resetFields();
  };

  const onAdd = async (datas) => {
    try {
      setLoading(true);
      await userService.createUser(datas.user);
      message.success("User added successfully!");
      setIsModalOpen(false);
      searchData();
      // setLoading(false);
    } catch (err) {
      message.error("Failed to add user. Please try again!", err);
      setLoading(false);
    }
  };

  //   const onUpdate = async (datas) => {
  //     try {
  //       setLoading(true);
  //       const updatedUser = await userService.updateUser(datas.user, mode);
  //       setUsersData((prev) =>
  //         prev.map((user) => (user._id === mode ? updatedUser : user))
  //       );
  //       setIsModalOpen(false);
  //       setLoading(false);
  //     } catch (err) {
  //       setLoading(false);
  //     }
  //   };

  const onFinish = (values) => {
    onAdd(values);
  };

  return (
    <div>
      {loading ? (
        <SpinStyle>
          <Spin size="large" />
        </SpinStyle>
      ) : null}

      <FormStyle
        form={form}
        layout="vertical"
        name="nest-messages"
        onFinish={onFinish}
      >
        <FlexStyle>
          <Form.Item
            className="flex-1"
            name={["user", "fullName"]}
            label="Full Name"
            rules={[{ required: true }]}
          >
            <Input className="border-gray-400 py-2" />
          </Form.Item>
          <Form.Item
            className="flex-1"
            name={["user", "email"]}
            label="Email"
            rules={[
              {
                type: "email",
                required: true,
              },
            ]}
          >
            <Input className="border-gray-400 py-2" />
          </Form.Item>
          <Form.Item
            className=" flex-1 border-gray-400"
            name={["user", "username"]}
            label="Username"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input className="border-gray-400 py-2" />
          </Form.Item>
        </FlexStyle>
        <FlexStyle>
          <Form.Item
            name={["user", "gender"]}
            label="Gender"
            className=" flex-1"
            rules={[
              {
                required: true,
                message: "Please select gender!",
              },
            ]}
          >
            <Select className="border-gray-400 " placeholder="select  gender">
              <Option value="male">Male</Option>
              <Option value="female">Female</Option>
            </Select>
          </Form.Item>

          <Form.Item
            rules={[
              {
                required: true,
                message: "Please select Phone Number!",
              },
            ]}
            className=" flex-1"
            name={["user", "phoneNumber"]}
            label="Phone Number"
          >
            <Input className="border-gray-400 py-2" />
          </Form.Item>
        </FlexStyle>

        <div className="flex gap-2">
          <Form.Item
            name={["user", "status"]}
            label="Status"
            className=" flex-1 "
            rules={[
              {
                required: true,
                message: "Please select status!",
              },
            ]}
          >
            <Select className="border-gray-400 " placeholder="select  status">
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Form.Item>
          <Form.Item
            className=" flex-1 border-gray-400"
            name={["user", "location"]}
            label="Location"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input className="border-gray-400 py-2" />
          </Form.Item>
        </div>

        <ButtonStyle>
          <button onClick={() => setIsModalOpen(false)}>Cancel</button>
          <button type="submit">Submit</button>
        </ButtonStyle>
      </FormStyle>
    </div>
  );
};

const SpinStyle = styled.div`
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
`;

export default UsersEdit;

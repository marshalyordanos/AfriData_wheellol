import React, { useEffect, useRef, useState } from "react";
import CommonTable from "../../components/commons/CommonTable";
import { MoreOutlined, ReloadOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Dropdown, Input, Select } from "antd";
import styled from "styled-components";
import CommonModal from "../../components/commons/CommonModel";

import HostService from "./HostService";
import HostEdit from "./HostEdit";
import HostAddEdit from "./HostAddEdit";
import { NavLink, useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
//import { HeaderStyle, SearchInputStyle } from '../../components/commons/CommonStyles';
import CommonDeleteModal from "../../components/commons/CommonDeleteModal";
import { useDispatch, useSelector } from "react-redux";
import { searchHost, updateHostState, hostSearchText } from "./HostRedux";

const UserList = () => {
  const navigate = useNavigate();
  const handleDelete = async (id) => {
    await HostService.deleteHost(id);
    setIsDeleteModalOpen(false);
  };
  const [userData, setUserData] = useState([]);
  const [total, setTotal] = useState();

  const searchText = useSelector(hostSearchText);
  const [loading, setLoading] = useState();
  const [userSelection, setUserSelection] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [modeID, setModeID] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const delayTimerRef = useRef(null);
  const dispatch = useDispatch();

  const getPaginationInfo = () => {
    return [searchParams.get("page") || 1, searchParams.get("limit") || 5];
  };

  useEffect(() => {
    const [page, limit] = getPaginationInfo();
    dispatch(updateHostState({ page: page, limit: limit }));
    // setSearchParams({ ...Object.fromEntries(searchParams), 'searchText': e.target.value })
    searchData();
  }, []);

  async function searchData(val = "") {
    try {
      setLoading(true);
      const { payload } = await dispatch(searchHost(val));
      setUserData(payload.data);
      setTotal(payload.total);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  }

  const searchHandler = (e) => {
    const { value } = e.target;
    const [page, limit] = getPaginationInfo();

    // setSearchParams({ page: page, limit: limit })
    dispatch(updateHostState({ page: page, limit: limit, searchText: value }));
    clearTimeout(delayTimerRef.current);
    delayTimerRef.current = setTimeout(() => {
      searchData();
    }, 500);
  };

  const handlePagination = async (page, pageSize) => {
    const columns = [
      {
        title: "First Name",
        dataIndex: "firstName",
        key: "firstName",
      },
      {
        title: "Last Name",
        dataIndex: "lastName",
        key: "lastName",
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
      },
      {
        title: "Phone",
        dataIndex: "phone",
        key: "phone",
      },
      {
        title: "Role",
        dataIndex: "role",
        key: "role",
        render: (role) => role?.name || "-",
      },
      {
        title: "Created At",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (date) => (date ? new Date(date).toLocaleString() : "-"),
      },
    ];
  };

  const onClick = ({ key }, record) => {
    if (key == "edit") {
      setIsModalOpen(true);
    } else if (key === "delete") {
      setIsDeleteModalOpen(true);
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
  ];

  const columns = [
    {
      title: " ",
      dataIndex: "action",
      render: (_, record) => {
        return (
          <Dropdown
            menu={{
              items,
              onClick: (value) => onClick(value, record),
            }}
            trigger={["click"]}
            placement="bottomLeft"
          >
            <Button
              type="text"
              icon={<MoreOutlined style={{ fontSize: 20 }} />}
              onClick={() => {
                setModeID(record._id);
              }}
            ></Button>
          </Dropdown>
        );
      },
    },
    ...["firstName", "lastName", "email", "phone", "role", "verified"].map(
      (key) => ({
        title:
          key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1"),
        dataIndex: key,
        key,
        sorter: true,
        onCell: (record) => ({
          onClick: () => {
            const id = record?.id || record?._id;
            if (id) navigate(`/dash/host/details/${id}`, { state: record });
          },
          style: { cursor: "pointer" },
        }),
        render:
          key === "role"
            ? (role) => role?.name || "-"
            : key === "verified"
            ? (verified) => (verified ? "true" : "false")
            : undefined,
      })
    ),
  ];

  const handleReload = () => {
    if (typeof fetchUsers === "function") {
      fetchUsers();
    } else {
      window.location.reload();
    }
  };

  // Add tableChange function to fix ReferenceError
  const tableChange = (pagination, filters, sorter) => {
    // Extract sort field and order
    let sortField = sorter.field;
    let sortOrder = sorter.order;
    // Convert Ant Design order to backend format
    let order =
      sortOrder === "ascend"
        ? "asc"
        : sortOrder === "descend"
        ? "desc"
        : undefined;
    // Update query state and refetch data
    const [page, limit] = [pagination.current, pagination.pageSize];
    dispatch(updateHostState({ page, limit, sort: sortField, order }));
    searchData();
  };

  return (
    <div>
      {isModalOpen ? (
        <CommonModal
          width={1000}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
        >
          {modeID === "" ? (
            <HostAddEdit
              userData={userData}
              searchData={searchData}
              setMode={setModeID}
              mode={modeID}
              isModelOpen={isModalOpen}
              setIsModalOpen={setIsModalOpen}
            />
          ) : (
            <HostEdit
              userData={userData.find((u) => u._id === modeID) || {}}
              searchData={searchData}
              setMode={setModeID}
              mode={modeID}
              isModelOpen={isModalOpen}
              setIsModalOpen={setIsModalOpen}
            />
          )}
        </CommonModal>
      ) : (
        ""
      )}

      {isDeleteModalOpen ? (
        <CommonDeleteModal
          setIsModalOpen={setIsDeleteModalOpen}
          handleDelete={handleDelete}
          loading={loading}
          isModalOpen={isDeleteModalOpen}
        >
          <h1 className=" text-2xl">Are you sure?</h1>
        </CommonDeleteModal>
      ) : (
        ""
      )}

      <span className="flex md:flex-row flex-col justify-between items-start md:items-end borde border-rose-700">
        <div className="flex flex-col p-6 md:w-[45vw] w-full">
          <h1 className="text-2xl font-bold pb-4">Hosts</h1>
          <div className="flex">
            <Input
              onChange={searchHandler}
              placeholder="Search"
              value={searchText}
              allowClear
              style={{ borderRadius: "0px 0px 0px 0px" }}
              className=" drop-shadow-sm rounded-r  py-2"
            />
            
          </div>
        </div>
        <span className="flex ml-6 mb-6 md:mr-6">
          <button
            onClick={handleReload}
            className="
             border border-[#1D9BF0] py-2 px-3
             text-[#1D9BF0] rounded mr-4 flex items-center justify-center"
          >
            <ReloadOutlined className=" boder boder-red-900" />
          </button>

          <button
            className="px-4  py-2 border border-[#3BB66E] 
            text-white bg-[#3BB66E] rounded"
            onClick={() => {
              setIsModalOpen(true);
              setModeID("");
            }}
          >
            <span className="flex flex-row">
              <PlusOutlined />
              <p className="pl-2">Add Host</p>
            </span>
          </button>
        </span>
      </span>

      <CommonTable
        rowSelectionType={"checkbox"}
        data={userData}
        columns={columns}
        setSelection={setUserSelection}
        handlePagination={handlePagination}
        total={total}
        loadding={loading}
        tableChange={tableChange}
        rowKey={(r) => r?._id || r?.id}
      />
    </div>
  );
};

export default UserList;

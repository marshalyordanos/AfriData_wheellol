import React, { useEffect, useRef, useState } from "react";
import CommonTable from "../../components/commons/CommonTable";
import CommonCard from "../../components/commons/CommonCard";
import { Pagination } from "antd";
import { MoreOutlined, ReloadOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Dropdown, Input, Select, message, Modal, Tag } from "antd";
import styled from "styled-components";
import CommonModal from "../../components/commons/CommonModel";

import HostService from "./HostService";
import HostEdit from "./HostEdit";
import HostAddEdit from "./HostAddEdit";
import { NavLink, useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
//import { HeaderStyle, SearchInputStyle } from '../../components/commons/CommonStyles';
import { useDispatch, useSelector } from "react-redux";
import { searchHost, updateHostState, hostSearchText } from "./HostRedux";

const UserList = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState([]);
  const [total, setTotal] = useState();

  const searchText = useSelector(hostSearchText);
  const page = useSelector((state) => state.host.query.page);
  const limit = useSelector((state) => state.host.query.limit);
  const [loading, setLoading] = useState();
  const [userSelection, setUserSelection] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [modeID, setModeID] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [openModalFor, setOpenModalFor] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const delayTimerRef = useRef(null);
  const dispatch = useDispatch();

  const getPaginationInfo = () => {
    return [searchParams.get("page") || 1, searchParams.get("limit") || 10];
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

  const handlePagination = async (p, pageSize) => {
    // update redux query and fetch
    dispatch(updateHostState({ page: p, limit: pageSize }));
    await searchData();
  };

  const onClick = async ({ key }, record) => {
    const id = record?._id || record?.id;
    setModeID(id);
    setSelectedRecord(record);
    if (key === "edit") {
      setOpenModalFor("edit");
      return;
    }

    if (key === "verify") {
      if (record?.hostProfile?.isVerified) {
        return;
      }
      try {
        setLoading(true);
        const res = await HostService.verifyHost(id);
        message.success(res?.message || "Host verified successfully");
        await searchData();
      } catch (err) {
        console.error(err);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to verify host";
        message.error(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (key === "toggleActive") {
      const action = record.isActive ? "Deactivate" : "Activate";
      Modal.confirm({
        title: `${action} Host`,
        content: `Are you sure you want to ${action.toLowerCase()} this host?`,
        onOk: async () => {
          try {
            setLoading(true);
            let res;
            if (record.isActive) {
              res = await HostService.deactivateHost(id);
            } else {
              res = await HostService.activateHost(id);
            }
            message.success(res?.message || "Host status updated successfully");
            await searchData();
          } catch (err) {
            console.error(err);
            const msg =
              err?.response?.data?.message ||
              err?.message ||
              "Failed to change host active status";
            message.error(msg);
          } finally {
            setLoading(false);
          }
        },
      });
      return;
    }
  };

  const columns = [
    {
      title: " ",
      dataIndex: "action",
      render: (_, record) => {
        return (
          <Dropdown
            menu={{
              items: [
                {
                  key: "edit",
                  label: <Button type="text">Edit</Button>,
                },
                {
                  key: "verify",
                  label: record?.hostProfile?.isVerified ? (
                    <Button
                      type="text"
                      style={{ color: "#3BB66E", fontWeight: 600 }}
                      disabled
                    >
                      Verified
                    </Button>
                  ) : (
                    <Button type="text">Verify</Button>
                  ),
                },
                {
                  key: "toggleActive",
                  label: (
                    <Button type="text">
                      {record.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  ),
                },
              ],
              onClick: (value) => onClick(value, record),
            }}
            trigger={["click"]}
            placement="bottomLeft"
          >
            <Button
              type="text"
              icon={<MoreOutlined style={{ fontSize: 20 }} />}
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
            ? (_, record) =>
                record?.hostProfile?.isVerified ? (
                  <Tag color="green">{"Verified"}</Tag>
                ) : (
                  <Tag color="red"> Not Verified</Tag>
                )
            : undefined,
      })
    ),
    {
      title: "Reviews",
      dataIndex: "reviews",
      key: "reviews",
      render: (_, record) => (
        <Button
          type="link"
          onClick={(e) => {
            e.stopPropagation();
            const id = record?._id || record?.id;
            if (id) navigate(`/dash/host/reviews/${id}`);
          }}
        >
          View Reviews
        </Button>
      ),
    },
  ];

  const handleReload = () => {
    const resetPage = 1;
    dispatch(updateHostState({ page: resetPage }));
    searchData();
  };

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
      {openModalFor === "edit" || openModalFor === "add" ? (
        <CommonModal
          width={1000}
          isModalOpen={true}
          setIsModalOpen={(open) => {
            if (!open) {
              setOpenModalFor(null);
              setSelectedRecord(null);
              setModeID("");
            }
          }}
        >
          {openModalFor === "add" ? (
            <HostAddEdit
              key={"host-add"}
              userData={userData}
              searchData={searchData}
              setMode={setModeID}
              mode={""}
              isModelOpen={true}
              setIsModalOpen={(open) => {
                if (!open) {
                  setOpenModalFor(null);
                  setSelectedRecord(null);
                }
              }}
            />
          ) : (
            <HostEdit
              key={selectedRecord?._id || modeID || "host-edit"}
              userData={
                selectedRecord || userData.find((u) => u._id === modeID) || {}
              }
              searchData={searchData}
              setMode={setModeID}
              mode={modeID}
              isModelOpen={true}
              setIsModalOpen={(open) => {
                if (!open) {
                  setOpenModalFor(null);
                  setSelectedRecord(null);
                }
              }}
            />
          )}
        </CommonModal>
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
             border border-[var(--color-primary)] py-2 px-3
             text-[var(--color-primary)] rounded mr-4 flex items-center justify-center"
          >
            <ReloadOutlined className=" boder boder-red-900" />
          </button>

          <button
            className="px-4  py-2 border border-[var(--color-primary)] 
            text-white bg-[var(--color-primary)] rounded"
            onClick={() => {
              setOpenModalFor("add");
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

      <div className="hidden md:block">
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
          currentPage={parseInt(page) || 1}
          pageSize={parseInt(limit) || 10}
        />
      </div>

      <div className="block md:hidden px-6">
        {userData && userData.length > 0 ? (
          userData.map((u) => (
            <CommonCard
              key={u?._id || u?.id}
              item={u}
              title={["firstName", "lastName"]}
              fieldMap={{
                email: "Email",
                phone: "Phone",
                verified: "Verified",
              }}
              actionItems={[
                { key: "edit", label: <Button type="text">Edit</Button> },
                {
                  key: "verify",
                  label: u?.hostProfile?.isVerified ? (
                    <Button type="text" disabled>
                      Verified
                    </Button>
                  ) : (
                    <Button type="text">Verify</Button>
                  ),
                },
                {
                  key: "toggleActive",
                  label: (
                    <Button type="text">
                      {u.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  ),
                },
              ]}
              onActionClick={(info, item) => onClick(info, item)}
              onCardClick={(record) => {
                const id = record?.id || record?._id;
                if (id) navigate(`/dash/host/details/${id}`, { state: record });
              }}
            />
          ))
        ) : (
          <div className="p-6">No hosts found</div>
        )}

        <div className="my-4 flex justify-center">
          <Pagination
            current={parseInt(page) || 1}
            pageSize={parseInt(limit) || 10}
            total={total}
            onChange={handlePagination}
            showSizeChanger
          />
        </div>
      </div>
    </div>
  );
};

export default UserList;

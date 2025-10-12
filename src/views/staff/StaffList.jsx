import React, { useEffect, useRef, useState } from "react";
import { Button, Dropdown, Input } from "antd";
import { PlusOutlined, ReloadOutlined, MoreOutlined } from "@ant-design/icons";
import CommonTable from "../../components/commons/CommonTable";
import CommonModal from "../../components/commons/CommonModel";
import CommonDeleteModal from "../../components/commons/CommonDeleteModal";
import StaffService from "./StaffService";
import StaffEdit from "./StaffEdit";
import StaffAddEdit from "./StaffAddEdit";
import { useDispatch, useSelector } from "react-redux";
import { searchStaff, updateStaffState, staffSearchText } from "./StaffRedux";
import { useSearchParams, useNavigate } from "react-router-dom";

const StaffList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const searchText = useSelector(staffSearchText);
  const [staffData, setStaffData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modeID, setModeID] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const delayTimerRef = useRef(null);

  const getPaginationInfo = () => [
    searchParams.get("page") || 1,
    searchParams.get("limit") || 5,
  ];

  useEffect(() => {
    const [page, limit] = getPaginationInfo();
    dispatch(updateStaffState({ page, limit }));
    searchData();
  }, []);

  async function searchData(val = "") {
    try {
      setLoading(true);
      const { payload } = await dispatch(searchStaff(val));
      setStaffData(payload.data);
      setTotal(payload.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const searchHandler = (e) => {
    const { value } = e.target;
    const [page, limit] = getPaginationInfo();
    dispatch(updateStaffState({ page, limit, searchText: value }));
    clearTimeout(delayTimerRef.current);
    delayTimerRef.current = setTimeout(() => {
      searchData(value);
    }, 500);
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await StaffService.deleteStaff(id);
      setIsDeleteModalOpen(false);
      searchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReload = () => searchData();

  const items = [
    { key: "edit", label: <Button type="text">Edit</Button> },
    {
      key: "delete",
      label: (
        <Button type="text" danger>
          Delete
        </Button>
      ),
    },
  ];

  const onClick = ({ key }, record) => {
    setModeID(record._id);
    if (key === "edit") setIsModalOpen(true);
    else if (key === "delete") setIsDeleteModalOpen(true);
  };

  const columns = [
    {
      title: " ",
      dataIndex: "action",
      render: (_, record) => (
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
            onClick={() => setModeID(record._id)}
          />
        </Dropdown>
      ),
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
            const id = record?._id || record?.id;
            if (id) navigate(`/dash/staff/details/${id}`, { state: record });
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

  // handle table sort and pagination
  const tableChange = (pagination, filters, sorter) => {
    let sortField = sorter.field;
    let sortOrder = sorter.order;
    let order =
      sortOrder === "ascend"
        ? "asc"
        : sortOrder === "descend"
        ? "desc"
        : undefined;
    const [page, limit] = [pagination.current, pagination.pageSize];
    dispatch(updateStaffState({ page, limit, sort: sortField, order }));
    searchData();
  };

  return (
    <div>
      {isModalOpen && (
        <CommonModal
          width={1000}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
        >
          {modeID === "" ? (
            <StaffAddEdit
              searchData={searchData}
              setMode={setModeID}
              mode={modeID}
              isModelOpen={isModalOpen}
              setIsModalOpen={setIsModalOpen}
            />
          ) : (
            <StaffEdit
              userData={staffData.find((u) => u._id === modeID) || {}}
              searchData={searchData}
              setMode={setModeID}
              mode={modeID}
              isModelOpen={isModalOpen}
              setIsModalOpen={setIsModalOpen}
            />
          )}
        </CommonModal>
      )}

      {isDeleteModalOpen && (
        <CommonDeleteModal
          setIsModalOpen={setIsDeleteModalOpen}
          handleDelete={() => handleDelete(modeID)}
          loading={loading}
          isModalOpen={isDeleteModalOpen}
        >
          <h1 className="text-2xl">Are you sure?</h1>
        </CommonDeleteModal>
      )}

      <div className="flex md:flex-row flex-col justify-between items-start md:items-end p-6">
        <div className="flex flex-col md:w-[45vw] w-full">
          <h1 className="text-2xl font-bold pb-4">Staffs</h1>
          <Input
            onChange={searchHandler}
            placeholder="Search"
            value={searchText}
            allowClear
            className="drop-shadow-sm py-2"
          />
        </div>
        <div className="flex items-center mt-4 md:mt-0">
          <button
            onClick={handleReload}
            className="border border-[#1D9BF0] py-2 px-3 text-[#1D9BF0] rounded mr-4 flex items-center justify-center"
          >
            <ReloadOutlined />
          </button>
          <button
            className="px-4 py-2 border border-[#3BB66E] text-white bg-[#3BB66E] rounded"
            onClick={() => {
              setIsModalOpen(true);
              setModeID("");
            }}
          >
            <PlusOutlined className="mr-2" /> Add Staff
          </button>
        </div>
      </div>

      <CommonTable
        rowSelectionType={"checkbox"}
        data={staffData}
        columns={columns}
        total={total}
        loadding={loading}
        rowKey={(r) => r?._id}
        tableChange={tableChange}
      />
    </div>
  );
};

export default StaffList;

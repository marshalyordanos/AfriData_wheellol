import React, { useEffect, useRef, useState } from "react";
import { Button, Dropdown, Input, message } from "antd";
import { PlusOutlined, ReloadOutlined, MoreOutlined } from "@ant-design/icons";
import CommonTable from "../../components/commons/CommonTable";
import CommonModal from "../../components/commons/CommonModel";
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
  const page = useSelector((state) => state.staff.query.page);
  const limit = useSelector((state) => state.staff.query.limit);
  const [staffData, setStaffData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modeID, setModeID] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const delayTimerRef = useRef(null);

  const getPaginationInfo = () => [
    searchParams.get("page") || 1,
    searchParams.get("limit") || 10,
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

  const handlePagination = async (p, pageSize) => {
    dispatch(updateStaffState({ page: p, limit: pageSize }));
    await searchData();
  };

  const searchHandler = (e) => {
    const { value } = e.target;
    const [page, limit] = getPaginationInfo();
    dispatch(updateStaffState({ page, limit, searchText: value }));
    clearTimeout(delayTimerRef.current);
    delayTimerRef.current = setTimeout(() => {
      searchData(value);
    }, 500);
  };

  const handleReload = () => searchData();

  const handleToggleActive = async (id, isActive) => {
    try {
      setLoading(true);
      let res;
      if (isActive) {
        res = await StaffService.deactivateStaff(id);
      } else {
        res = await StaffService.activateStaff(id);
      }
      message.success(res?.message || "Staff status updated successfully");
      searchData();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to change staff active status";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const items = (record) => [
    { key: "edit", label: <Button type="text">Edit</Button> },
    {
      key: "toggleActive",
      label: (
        <Button type="text">
          {record.isActive ? "Deactivate" : "Activate"}
        </Button>
      ),
    },
  ];

  const onClick = ({ key }, record) => {
    const id = record?._id || record?.id;
    setModeID(id);
    setSelectedRecord(record);
    if (key === "edit") {
      setIsModalOpen(true);
      return;
    }

    if (key === "toggleActive") {
      handleToggleActive(id, record.isActive);
      return;
    }
  };

  const columns = [
    {
      title: " ",
      dataIndex: "action",
      render: (_, record) => {
        const menuItems = items(record);
        return (
          <Dropdown
            menu={{
              items: menuItems,
              onClick: (value) => onClick(value, record),
            }}
            trigger={["click"]}
            placement="bottomLeft"
          >
            <Button
              type="text"
              icon={<MoreOutlined style={{ fontSize: 20 }} />}
              onClick={() => setModeID(record?._id || record?.id)}
            />
          </Dropdown>
        );
      },
    },
    ...["firstName", "lastName", "email", "phone", "role", "active"].map(
      (key) => ({
        title:
          key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1"),
        dataIndex: key === "active" ? "isActive" : key,
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
            : key === "active"
            ? (_, record) => (record?.isActive ? "true" : "false")
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
          setIsModalOpen={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setSelectedRecord(null);
              setModeID("");
            }
          }}
        >
          {modeID === "" ? (
            <StaffAddEdit
              key={"staff-add"}
              searchData={searchData}
              setMode={setModeID}
              mode={modeID}
              isModelOpen={isModalOpen}
              setIsModalOpen={setIsModalOpen}
            />
          ) : (
            <StaffEdit
              key={modeID || "staff-edit"}
              userData={
                selectedRecord || staffData.find((u) => u._id === modeID) || {}
              }
              searchData={searchData}
              setMode={setModeID}
              mode={modeID}
              isModelOpen={isModalOpen}
              setIsModalOpen={setIsModalOpen}
            />
          )}
        </CommonModal>
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
        handlePagination={handlePagination}
        currentPage={parseInt(page) || 1}
        pageSize={parseInt(limit) || 10}
      />
    </div>
  );
};

export default StaffList;

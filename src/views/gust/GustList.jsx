import React, { useEffect, useRef, useState } from "react";
import { Button, Dropdown, Input, message, Tag, Pagination } from "antd";
import { PlusOutlined, ReloadOutlined, MoreOutlined } from "@ant-design/icons";
import CommonTable from "../../components/commons/CommonTable";
import CommonCard from "../../components/commons/CommonCard";
import GustService from "./GustService";
import { useDispatch, useSelector } from "react-redux";
import { searchGust, updateGustState, gustSearchText } from "./GustRedux";
import { useSearchParams, useNavigate } from "react-router-dom";

const GustList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const searchText = useSelector(gustSearchText);
  const page = useSelector((state) => state.gust.query.page);
  const limit = useSelector((state) => state.gust.query.limit);
  const [gustData, setGustData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modeID, setModeID] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const delayTimerRef = useRef(null);

  const getPaginationInfo = () => [
    searchParams.get("page") || 1,
    searchParams.get("limit") || 10,
  ];

  useEffect(() => {
    const [page, limit] = getPaginationInfo();
    dispatch(updateGustState({ page, limit }));
    searchData();
  }, []);

  async function searchData(val = "") {
    try {
      setLoading(true);
      const { payload } = await dispatch(searchGust(val));
      setGustData(payload.data);
      setTotal(payload.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handlePagination = async (p, pageSize) => {
    dispatch(updateGustState({ page: p, limit: pageSize }));
    await searchData();
  };

  const searchHandler = (e) => {
    const { value } = e.target;
    const [page, limit] = getPaginationInfo();
    dispatch(updateGustState({ page, limit, searchText: value }));
    clearTimeout(delayTimerRef.current);
    delayTimerRef.current = setTimeout(() => {
      searchData(value);
    }, 500);
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      setLoading(true);
      let res;
      if (isActive) {
        res = await GustService.deactivateGuest(id);
      } else {
        res = await GustService.activateGuest(id);
      }
      message.success(res?.message || "Guest status updated successfully");
      await searchData();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to change guest active status";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReload = () => searchData();

  const items = (record) => [
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
    const id = record._id || record.id;
    setModeID(id);
    if (key === "toggleActive") {
      handleToggleActive(id, record.isActive);
      return;
    }
  };

  const columns = [
    {
      title: " ",
      dataIndex: "action",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: items(record),
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
    ...["firstName", "lastName", "email", "phone", "role", "active"].map(
      (key) => ({
        title:
          key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1"),
        dataIndex: key,
        key,
        sorter: true,
        onCell: (record) => ({
          onClick: () => {
            const id = record?._id || record?.id;
            if (id) navigate(`/dash/gust/details/${id}`, { state: record });
          },
          style: { cursor: "pointer" },
        }),
        render:
          key === "role"
            ? (role) => role?.name || "-"
            : key === "active"
            ? (_, record) =>
                record?.isActive ? (
                  <Tag color="green">Active</Tag>
                ) : (
                  <Tag color="red">Inactive</Tag>
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
            const id = record._id || record.id;
            if (id) navigate(`/dash/gust/reviews/${id}`);
          }}
        >
          View Reviews
        </Button>
      ),
    },
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
    dispatch(updateGustState({ page, limit, sort: sortField, order }));
    searchData();
  };

  return (
    <div>
      <div className="flex md:flex-row flex-col justify-between items-start md:items-end p-6">
        <div className="flex flex-col md:w-[45vw] w-full">
          <h1 className="text-2xl font-bold pb-4">Guests</h1>
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
            className="border border-[var(--color-primary)] py-2 px-3 text-[var(--color-primary)] rounded mr-4 flex items-center justify-center"
          >
            <ReloadOutlined />
          </button>
        </div>
      </div>

      <div className="hidden md:block">
        <CommonTable
          rowSelectionType={"checkbox"}
          data={gustData}
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

      <div className="block md:hidden px-6">
        {gustData && gustData.length > 0 ? (
          gustData.map((g) => (
            <CommonCard
              key={g?._id || g?.id}
              item={g}
              title={["firstName", "lastName"]}
              fieldMap={{
                email: "Email",
                phone: "Phone",
                "role.name": "Role",
                // isActive: "Active",
              }}
              actionItems={items(g)}
              onActionClick={(info, item) => onClick(info, item)}
              onCardClick={(record) => {
                const id = record?._id || record?.id;
                if (id) navigate(`/dash/gust/details/${id}`, { state: record });
              }}
            />
          ))
        ) : (
          <div className="p-6">No guests found</div>
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

export default GustList;

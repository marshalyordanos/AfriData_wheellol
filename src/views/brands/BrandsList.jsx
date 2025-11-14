// src/views/brands/BrandsList.jsx
import React, { useEffect, useRef, useState } from "react";
import { Button, Dropdown, Input, message } from "antd";
import { MoreOutlined, ReloadOutlined, PlusOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useNavigate } from "react-router-dom";

import CommonTable from "../../components/commons/CommonTable";
import CommonCard from "../../components/commons/CommonCard";
import { Pagination } from "antd";
import CommonModal from "../../components/commons/CommonModel";
import CommonDeleteModal from "../../components/commons/CommonDeleteModal";
import BrandsEdit from "./BrandsEdit";
import brandsService from "./BrandsService";
import { updateBrandsState, brandsSearchText } from "./BrandsRedux";
import CommonCardSkeleton from "../../components/commons/CommonSkeleton";

const BrandsList = () => {
  const [brandsData, setBrandsData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [brandsSelection, setBrandsSelection] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modeID, setModeID] = useState(""); // id for edit/delete
  const reduxSearchText = useSelector(brandsSearchText);
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const delayTimerRef = useRef(null);
  const navigate = useNavigate();

  const getPaginationInfo = () => [
    parseInt(searchParams.get("page") || 1, 10),
    parseInt(searchParams.get("limit") || 5, 10),
  ];

  useEffect(() => {
    const [page, limit] = getPaginationInfo();
    dispatch(updateBrandsState({ page, limit }));
    fetchData(); // initial load
  }, []);

  const fetchData = async (opts = {}) => {
    const { page: p, limit: l, searchText: s } = opts;
    const [page, limit] = [
      p ?? getPaginationInfo()[0],
      l ?? getPaginationInfo()[1],
    ];
    const searchText = s ?? reduxSearchText ?? "";

    try {
      setLoading(true);
      const res = await brandsService.searchBrand({
        page,
        limit,
        searchText,
      });
      setBrandsData(res.data || []);
      setTotal(res.total ?? (res.data ? res.data.length : 0));
    } catch (err) {
      console.error("Failed to fetch brands", err);
      message.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  // debounce text input
  const searchHandler = (e) => {
    const value = e.target.value;
    const [page, limit] = getPaginationInfo();
    dispatch(updateBrandsState({ page, limit, searchText: value }));

    // live search without delay
    fetchData({ page, limit, searchText: value });
  };

  const handleReload = () => {
    setSearchParams({ page: 1, limit: 5 });
    dispatch(updateBrandsState({ page: 1, limit: 5, searchText: "" }));
    fetchData({ page: 1, limit: 5, searchText: "" });
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await brandsService.deleteBrand(modeID);
      message.success("Brand deleted successfully");
      setIsDeleteModalOpen(false);
      fetchData(); // refresh list
    } catch (err) {
      setLoading(false);

      console.error("Delete brand error:", err?.response?.data?.message || err);

      const fkError =
        err?.response?.data?.message?.toLowerCase().includes("foreign key") ||
        err?.response?.status === 409 ||
        err?.response?.status === 400;

      if (fkError) {
        message.error(
          "Cannot delete brand: please remove related models first."
        );
      } else {
        message.error("Failed to delete brand");
      }
    }
  };

  const handleMenuClick = (info, record) => {
    try {
      if (info?.domEvent) info.domEvent.stopPropagation();
    } catch (e) {}
    setModeID(record.id);

    if (info.key === "edit") {
      setIsModalOpen(true);
    } else if (info.key === "delete") {
      setIsDeleteModalOpen(true);
    }
  };

  const dropdownItems = [
    { key: "edit", label: <Button type="text">Edit</Button> },
    { key: "delete", label: <Button type="text">Delete</Button> },
  ];

  const columns = [
    {
      title: "Action",
      dataIndex: "action",
      width: 60,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: dropdownItems,
            onClick: (info) => handleMenuClick(info, record),
          }}
          trigger={["click"]}
          placement="bottomLeft"
          getPopupContainer={() => document.body}
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              setModeID(record.id);
            }}
          />
        </Dropdown>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Active",
      dataIndex: "isActive",
      key: "isActive",
      render: (val) => (val ? "Yes" : "No"),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => (date ? new Date(date).toLocaleDateString() : "N/A"),
    },
    {
      title: "Models",
      key: "models",
      render: (_, record) =>
        record.models && record.models.length > 0 ? (
          <Button
            type="link"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dash/brands/${record.id}/models`);
            }}
          >
            View Models ({record.models.length})
          </Button>
        ) : (
          <span>No models</span>
        ),
    },
  ];

  return (
    <div className="p-6">
      {isModalOpen && (
        <CommonModal
          width={600}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
        >
          <BrandsEdit
            searchData={() => fetchData()}
            mode={modeID}
            setMode={setModeID}
            isModelOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
          />
        </CommonModal>
      )}

      {isDeleteModalOpen && (
        <CommonDeleteModal
          isModalOpen={isDeleteModalOpen}
          setIsModalOpen={setIsDeleteModalOpen}
          handleDelete={handleDelete}
          loading={loading}
        >
          <h1 className="text-2xl">Are you sure?</h1>
        </CommonDeleteModal>
      )}

      <div className="flex justify-between items-center mb-6">
        <Input
          placeholder="Search Brands"
          value={reduxSearchText}
          onChange={searchHandler}
          className="max-w-sm rounded"
          allowClear
        />

        <div className="flex gap-4">
          <Button
            onClick={handleReload}
            style={{ color: "var(--color-primary)" }}
            icon={<ReloadOutlined />}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setModeID("");
              setIsModalOpen(true);
            }}
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Add Brand
          </Button>
        </div>
      </div>

      <div className="hidden md:block">
        <CommonTable
          data={brandsData}
          columns={columns}
          rowKey="id" // important for row selection & uniqueness
          rowSelectionType="checkbox"
          setSelection={setBrandsSelection}
          onRow={(record) => ({
            onClick: (e) => {
              navigate(`/dash/brands/${record.id}`, { state: record });
            },
          })}
          handlePagination={(page, pageSize) => {
            setSearchParams({ page, limit: pageSize });
            dispatch(updateBrandsState({ page, limit: pageSize }));
            fetchData({ page, limit: pageSize });
          }}
          total={total}
          loadding={loading}
        />
      </div>

      {/* Mobile cards */}
      <div className="block md:hidden px-4">
        {loading &&
          Array(5)
            .fill(1)
            .map((_) => <CommonCardSkeleton />)}
        {brandsData && brandsData.length > 0 ? (
          brandsData.map((b) => (
            <CommonCard
              key={b.id}
              item={b}
              title={["name", "name"]}
              fieldMap={{
                createdAt: "Created At",
                // isActive: "Active",
              }}
              actionItems={dropdownItems}
              onActionClick={(info, item) => handleMenuClick(info, item)}
              onCardClick={(record) =>
                navigate(`/dash/brands/${record.id}`, { state: record })
              }
            />
          ))
        ) : (
          <div className="p-6">No brands found</div>
        )}

        <div className="my-4 flex justify-center">
          <Pagination
            current={getPaginationInfo()[0]}
            pageSize={getPaginationInfo()[1]}
            total={total}
            onChange={(p, ps) => {
              setSearchParams({ page: p, limit: ps });
              dispatch(updateBrandsState({ page: p, limit: ps }));
              fetchData({ page: p, limit: ps });
            }}
            showSizeChanger
          />
        </div>
      </div>
    </div>
  );
};

export default BrandsList;

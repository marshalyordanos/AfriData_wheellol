// src/views/brands/BrandsList.jsx
import React, { useEffect, useRef, useState } from "react";
import { Button, Dropdown, Input, message } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import {
  Page,
  PageHeader,
  Btn,
  ReloadBtn,
  StatsStrip,
  TableCard,
  ThumbCell,
  ActivePill,
  TwoLine,
  RowMenu,
  actionColumn,
  EmptyState,
} from "../../components/modern/ModernUI";
import { shortDate, shortTime } from "../../utils/dateFormat";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useNavigate } from "react-router-dom";

import CommonTable from "../../components/commons/CommonTable";
import CommonCard from "../../components/commons/CommonCard";
import { formatReadableDate } from "../../utils/date_currency_formatter";
import { Pagination } from "antd";
import CommonModal from "../../components/commons/CommonModel";
import CommonDeleteModal from "../../components/commons/CommonDeleteModal";
import BrandsEdit from "./BrandsEdit";
import brandsService from "./BrandsService";
import {
  updateBrandsState,
  brandsSearchText,
  brandsPage,
  brandsLimit,
  searchBrands,
} from "./BrandsRedux";
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
    parseInt(searchParams.get("limit") || 10, 10),
  ];

  const reduxPage = useSelector(brandsPage);
  const reduxLimit = useSelector(brandsLimit);

  useEffect(() => {
    const [page, limit] = getPaginationInfo();
    dispatch(updateBrandsState({ page, limit }));
    searchData(); // initial load via redux
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const searchData = async (val = "") => {
    try {
      setLoading(true);
      const { payload } = await dispatch(searchBrands(val));
      const res = payload || { data: [], total: 0, pagination: null };
      const mapped = (res.data || []).map((it) => ({
        ...it,
        createdAtFormatted: it.createdAt
          ? formatReadableDate(it.createdAt)
          : "-",
      }));
      setBrandsData(mapped);
      setTotal(res.total ?? (res.data ? res.data.length : 0));

      // if backend supplies pagination info, update search params and redux
      if (res.pagination) {
        const p = res.pagination.page || 1;
        const ps = res.pagination.pageSize || reduxLimit || 10;
        setSearchParams({ page: p, limit: ps });
        dispatch(updateBrandsState({ page: p, limit: ps }));
      }
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
    searchData(value);
  };

  const handleReload = () => {
    setSearchParams({ page: 1, limit: 10 });
    dispatch(updateBrandsState({ page: 1, limit: 10, searchText: "" }));
    searchData("");
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await brandsService.deleteBrand(modeID);
      message.success("Brand deleted successfully");
      setIsDeleteModalOpen(false);
      searchData(); // refresh list
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
    { key: "edit", icon: <EditOutlined />, label: "Edit brand" },
    { key: "models", icon: <AppstoreOutlined />, label: "View models" },
    { type: "divider" },
    { key: "delete", icon: <DeleteOutlined />, label: "Delete", danger: true },
  ];

  const onMenu = (info, record) => {
    if (info.key === "models") {
      info?.domEvent?.stopPropagation();
      return navigate(`/dash/brands/${record.id}/models`);
    }
    handleMenuClick(info, record);
  };

  const columns = [
    {
      title: "Brand",
      dataIndex: "name",
      key: "name",
      render: (name, r) => (
        <ThumbCell
          img={r.logo || r.logoUrl || r.image}
          icon={<span style={{ fontWeight: 700, fontSize: 14 }}>{String(name || "?").charAt(0).toUpperCase()}</span>}
          title={name}
          sub={r.country || (r.models ? `${r.models.length} model${r.models.length === 1 ? "" : "s"}` : null)}
        />
      ),
    },
    {
      title: "Models",
      key: "models",
      render: (_, record) =>
        record.models && record.models.length > 0 ? (
          <button
            className="mp-link"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dash/brands/${record.id}/models`);
            }}
          >
            View {record.models.length} model{record.models.length === 1 ? "" : "s"} →
          </button>
        ) : (
          <span className="mp-muted">No models yet</span>
        ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (val) => <ActivePill active={val} />,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (d) => <TwoLine main={shortDate(d)} sub={shortTime(d)} />,
    },
    actionColumn((_, r) => <RowMenu items={dropdownItems} record={r} onClick={onMenu} />),
  ];

  const onPage = (page, pageSize) => {
    setSearchParams({ page, limit: pageSize });
    dispatch(updateBrandsState({ page, limit: pageSize }));
    searchData();
  };

  const activeCount = brandsData.filter((b) => b.isActive).length;
  const modelCount = brandsData.reduce((a, b) => a + (b.models?.length || 0), 0);

  return (
    <Page>
      {isModalOpen && (
        <CommonModal width={600} isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} title={modeID ? "Edit brand" : "New brand"}>
          <BrandsEdit
            searchData={() => searchData()}
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
          The brand will be removed permanently. Brands that still have models can't be deleted.
        </CommonDeleteModal>
      )}

      <PageHeader
        eyebrow="Catalog"
        title="Brands"
        subtitle="Car makes available when hosts list a vehicle."
        actions={
          <>
            <ReloadBtn onClick={handleReload} loading={loading} />
            <Btn
              variant="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setModeID("");
                setIsModalOpen(true);
              }}
            >
              Add brand
            </Btn>
          </>
        }
      />

      <StatsStrip
        items={[
          { label: "Total brands", value: total || 0, note: "In the catalog", color: "#09234c" },
          { label: "Active", value: activeCount, note: "On this page", color: "#059669" },
          { label: "Inactive", value: brandsData.length - activeCount, note: "On this page", color: "#94a3b8" },
          { label: "Models", value: modelCount, note: "Across brands on this page", color: "#fc6b38" },
        ]}
      />

      <TableCard
        search={{ value: reduxSearchText, onChange: searchHandler, placeholder: "Search brands" }}
        resultLabel={`${total || 0} brands`}
      >
        <div className="hidden md:block">
          <CommonTable
            data={brandsData}
            columns={columns}
            rowKey="id"
            setSelection={setBrandsSelection}
            onRow={(record) => ({
              onClick: () => navigate(`/dash/brands/${record.id}`, { state: record }),
              style: { cursor: "pointer" },
            })}
            handlePagination={onPage}
            total={total}
            loadding={loading}
            currentPage={Number(reduxPage) || Number(getPaginationInfo()[0])}
            pageSize={Number(reduxLimit) || Number(getPaginationInfo()[1])}
            unit="brands"
          />
        </div>

        <div className="block md:hidden mp-mlist">
          {loading && Array(4).fill(1).map((_, i) => <CommonCardSkeleton key={i} />)}
          {!loading && brandsData.length > 0
            ? brandsData.map((b) => (
                <CommonCard
                  key={b.id}
                  item={b}
                  title="name"
                  fieldMap={{ createdAtFormatted: "Created", isActive: "Status" }}
                  actionItems={dropdownItems}
                  onActionClick={(info, item) => onMenu(info, item)}
                  onCardClick={(record) => navigate(`/dash/brands/${record.id}`, { state: record })}
                />
              ))
            : !loading && <EmptyState title="No brands found" />}
          <div className="my-4 flex justify-center">
            <Pagination current={getPaginationInfo()[0]} pageSize={getPaginationInfo()[1]} total={total} onChange={onPage} size="small" />
          </div>
        </div>
      </TableCard>
    </Page>
  );
};

export default BrandsList;

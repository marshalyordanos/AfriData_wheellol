import React, { useEffect, useRef, useState } from "react";
import CommonTable from "../../components/commons/CommonTable";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CarOutlined,
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
import { Button, Dropdown, Input, Select, Pagination } from "antd";
import styled from "styled-components";
import CommonModal from "../../components/commons/CommonModel";
import CommonCard from "../../components/commons/CommonCard";
import { formatReadableDate } from "../../utils/date_currency_formatter";

import cartypesService from "./CartypesService";
import CartypesEdit from "./CartypesEdit";
import { NavLink, useSearchParams } from "react-router-dom";
//import { HeaderStyle, SearchInputStyle } from '../../components/commons/CommonStyles';
import CommonDeleteModal from "../../components/commons/CommonDeleteModal";
import { useDispatch, useSelector } from "react-redux";
import {
  searchCartypes,
  updateCartypesState,
  cartypesSearchText,
} from "./CartypesRedux";
import { cartypesPage, cartypesLimit } from "./CartypesRedux";
import CommonCardSkeleton from "../../components/commons/CommonSkeleton";

const CartypesList = () => {
  const [cartypesData, setCartypesData] = useState([]);
  const [total, setTotal] = useState();

  const searchText = useSelector(cartypesSearchText);
  const [loading, setLoading] = useState();
  const [cartypesSelection, setCartypesSelection] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [modeID, setModeID] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const page = useSelector(cartypesPage);
  const limit = useSelector(cartypesLimit);

  const delayTimerRef = useRef(null);
  const dispatch = useDispatch();
  const [pages, setPages] = useState([]);

  const getPaginationInfo = () => {
    return [searchParams.get("page") || 1, searchParams.get("limit") || 10];
  };

  useEffect(() => {
    const [page, limit] = getPaginationInfo();
    dispatch(updateCartypesState({ page: page, limit: limit }));
    // setSearchParams({ ...Object.fromEntries(searchParams), 'searchText': e.target.value })
    searchData();
  }, []);

  async function searchData() {
    try {
      setLoading(true);
      const { payload } = await dispatch(searchCartypes());
      const list = Array.isArray(payload.data) ? payload.data : [];
      const mapped = list.map((it) => ({
        ...it,
        createdAtFormatted: it.createdAt
          ? formatReadableDate(it.createdAt)
          : "-",
        isActiveLabel: it.isActive ? "Active" : "Inactive",
      }));
      setCartypesData(mapped);
      // prefer server pagination total if available
      if (payload.pagination) {
        setTotal(payload.pagination.total);
        dispatch(
          updateCartypesState({
            page: payload.pagination.page,
            limit: payload.pagination.pageSize,
          })
        );
        const pagesCount =
          payload.pagination.totalPages ||
          Math.ceil(
            (payload.pagination.total || 0) /
              (payload.pagination.pageSize || limit || 10)
          );
        setPages(Array.from({ length: pagesCount }, (_, i) => i + 1));
      } else {
        setTotal(payload.total);
        const pagesCount = Math.ceil((payload.total || 0) / (limit || 10));
        setPages(Array.from({ length: pagesCount }, (_, i) => i + 1));
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  }

  const searchHandler = (e) => {
    const { value } = e.target;
    const [page, limit] = getPaginationInfo();

    // setSearchParams({ page: page, limit: limit })
    dispatch(
      updateCartypesState({ page: page, limit: limit, searchText: value })
    );
    clearTimeout(delayTimerRef.current);
    delayTimerRef.current = setTimeout(() => {
      searchData();
    }, 500);
  };

  const handlePagination = async (page, pageSize) => {
    // permmission exmple

    // if (!(await authService.checkPermmision('cartypes', 'read'))) {
    //     return message.error('You have not a permmission');
    // }

    setSearchParams({ page: page, limit: pageSize });
    dispatch(updateCartypesState({ page: page, limit: pageSize }));

    searchData();
  };

  const tableChange = (pagination, filters, sorter) => {
    const { field, order } = sorter;
    dispatch(updateCartypesState({ sort: field, order: order }));

    searchData();
  };

  const handleReload = () => {
    const [page, limit] = getPaginationInfo();

    setSearchParams({ page: 1, limit: 10 });
    dispatch(
      updateCartypesState({
        page: 1,
        limit: 10,
        sort: "",
        order: "",
        searchText: "",
      })
    );
    searchData();
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const data = await cartypesService.deleteCartype(modeID);
      setIsDeleteModalOpen(false);

      searchData();
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const onClick = ({ key }, record) => {
    setModeID(record?.id);
    if (key === "edit") setIsModalOpen(true);
    else if (key === "delete") setIsDeleteModalOpen(true);
  };

  const items = [
    { key: "edit", icon: <EditOutlined />, label: "Edit car type" },
    { type: "divider" },
    { key: "delete", icon: <DeleteOutlined />, label: "Delete", danger: true },
  ];

  const columns = [
    {
      title: "Car type",
      dataIndex: "name",
      render: (text, r) => (
        <ThumbCell
          img={r.image || r.icon || r.imageUrl}
          icon={<CarOutlined />}
          title={text}
          sub={r.description}
        />
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (v) => <ActivePill active={v} />,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      render: (d) => <TwoLine main={shortDate(d)} sub={shortTime(d)} />,
    },
    actionColumn((_, r) => <RowMenu items={items} record={r} onClick={onClick} />),
  ];

  const activeCount = (cartypesData || []).filter((c) => c.isActive).length;

  return (
    <Page>
      {isModalOpen && (
        <CommonModal
          width={720}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          title={modeID ? "Edit car type" : "New car type"}
        >
          <CartypesEdit
            cartypesData={cartypesData}
            searchData={searchData}
            setMode={setModeID}
            mode={modeID}
            isModelOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
          />
        </CommonModal>
      )}

      {isDeleteModalOpen && (
        <CommonDeleteModal
          setIsModalOpen={setIsDeleteModalOpen}
          handleDelete={handleDelete}
          loading={loading}
          isModalOpen={isDeleteModalOpen}
        >
          This car type will be removed permanently.
        </CommonDeleteModal>
      )}

      <PageHeader
        eyebrow="Catalog"
        title="Car types"
        subtitle="Body styles such as Sedan, SUV or Pickup that hosts pick from."
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
              Add car type
            </Btn>
          </>
        }
      />

      <StatsStrip
        items={[
          { label: "Total car types", value: total || 0, note: "In the catalog", color: "#09234c" },
          { label: "Active", value: activeCount, note: "On this page", color: "#059669" },
          { label: "Inactive", value: (cartypesData || []).length - activeCount, note: "On this page", color: "#94a3b8" },
        ]}
      />

      <TableCard
        search={{ value: searchText, onChange: searchHandler, placeholder: "Search car types" }}
        resultLabel={`${total || 0} car types`}
      >
        <div className="hidden md:block">
          <CommonTable
            data={cartypesData}
            columns={columns}
            rowKey="id"
            setSelection={setCartypesSelection}
            handlePagination={handlePagination}
            total={total}
            loadding={loading}
            tableChange={tableChange}
            currentPage={Number(page) || 1}
            pageSize={Number(limit) || 10}
            unit="car types"
          />
        </div>

        <div className="block md:hidden mp-mlist">
          {loading && Array(4).fill(1).map((_, i) => <CommonCardSkeleton key={i} />)}
          {!loading && cartypesData && cartypesData.length > 0
            ? cartypesData.map((ct) => (
                <CommonCard
                  key={ct?.id || ct?._id}
                  item={ct}
                  title="name"
                  fieldMap={{ createdAtFormatted: "Created", isActive: "Status" }}
                  actionItems={items}
                  onActionClick={(info, item) => onClick(info, item)}
                />
              ))
            : !loading && <EmptyState title="No car types found" />}
          <div className="my-4 flex justify-center">
            <Pagination current={Number(page) || 1} pageSize={Number(limit) || 10} total={total} onChange={handlePagination} size="small" />
          </div>
        </div>
      </TableCard>
    </Page>
  );
};

export default CartypesList;

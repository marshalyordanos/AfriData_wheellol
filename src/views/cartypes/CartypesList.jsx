import React, { useEffect, useRef, useState } from "react";
import CommonTable from "../../components/commons/CommonTable";
import { MoreOutlined, ReloadOutlined, PlusOutlined } from "@ant-design/icons";
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

  const delayTimerRef = useRef(null);
  const dispatch = useDispatch();

  const getPaginationInfo = () => {
    return [searchParams.get("page") || 1, searchParams.get("limit") || 5];
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

    setSearchParams({ page: 1, limit: 5 });
    dispatch(
      updateCartypesState({
        page: 1,
        limit: 5,
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
      render: (_, recored) => {
        return (
          <Dropdown
            menu={{
              items,
              onClick: (value) => onClick(value, recored),
            }}
            trigger={["click"]}
            placement="bottomLeft"
          >
            <Button
              type="text"
              icon={<MoreOutlined style={{ fontSize: 20 }} />}
              onClick={() => {
                setModeID(recored.id);
              }}
            ></Button>
          </Dropdown>
        );
      },
    },

    {
      title: "Name",
      dataIndex: "name",
      render: (text, recored) => {
        return (
          <NavLink
            style={{ color: "#2f1dca" }}
            state={recored}
            // to={`${recored.id}`}
          >
            {text}
          </NavLink>
        );
      },
      // sorter: true,
    },

    // {
    //   title: "active",
    //   dataIndex: "active",
    //   render: (text, recored) => {
    //     return recored.active ? <p>true</p> : <p>false</p>;
    //   },
    // },
    {
      title: "Active",
      dataIndex: "isActive",
      render: (v, r) =>
        v ? (
          <span className="text-green-600 font-medium">Active</span>
        ) : (
          <span className="text-gray-500">Inactive</span>
        ),
      // sorter: true,
    },
    {
      title: "Created At",
      dataIndex: "createdAtFormatted",
      render: (t) => t || "-",
      // sorter: true,
    },
  ];

  return (
    <div>
      {isModalOpen ? (
        <CommonModal
          width={1000}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
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
          <h1 className="text-2xl font-bold pb-4">Car Types</h1>
          <div className="flex">
            <Input
              onChange={searchHandler}
              placeholder="Search"
              value={searchText}
              allowClear
              className="drop-shadow-sm py-2"
            />
            {/* <div className="hover:border-[#4096FF] transition-all delay-75 ease-in hover:border border-y-[0.5px] py-[0.15rem] border-r-[0.5px] rounded-r-[8px] border-[#CCCCCC] searchSelect">
              <Select
                onChange={(val) => {
                  searchData();
                }}
                bordered={false}
                //   style={ borderRadius: "0px 8px 8px 0px" }
                className=""
                placeholder="Select item category"
              >
                <Option value={""}>All</Option>
                <Option value={"spare_part"}>Spare part</Option>
                <Option value={"lubricant"}>Lubricants</Option>
              </Select>
            </div> */}
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
              setIsModalOpen(true);
              setModeID("");
            }}
          >
            <span className="flex flex-row">
              <PlusOutlined />
              <p className="pl-2">Add CarType</p>
            </span>
          </button>
        </span>
      </span>

      <div className="hidden md:block">
        <CommonTable
          // rowSelectionType={"checkbox"}
          data={cartypesData}
          columns={columns}
          setSelection={setCartypesSelection}
          handlePagination={handlePagination}
          total={total}
          loadding={loading}
          tableChange={tableChange}
        />
      </div>

      <div className="block md:hidden px-4">
        {loading &&
          Array(5)
            .fill(1)
            .map((_) => <CommonCardSkeleton />)}
        {cartypesData && cartypesData.length > 0 ? (
          cartypesData.map((ct) => (
            <CommonCard
              key={ct?.id || ct?._id}
              item={ct}
              title={"name"}
              fieldMap={{
                createdAtFormatted: "Created At",
                isActiveLabel: "Active",
              }}
              actionItems={items.map((it) => ({ ...it }))}
              onActionClick={(info, item) => onClick(info, item)}
            />
          ))
        ) : (
          <div className="p-6">No car types found</div>
        )}

        <div className="my-4 flex justify-center">
          <Pagination
            current={parseInt(searchParams.get("page") || 1)}
            pageSize={parseInt(searchParams.get("limit") || 5)}
            total={total}
            onChange={handlePagination}
            showSizeChanger
          />
        </div>
      </div>
    </div>
  );
};

export default CartypesList;

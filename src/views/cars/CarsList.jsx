import React, { useEffect, useRef, useState } from "react";
import CommonTable from "../../components/commons/CommonTable";
import { MoreOutlined, ReloadOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Dropdown, Image, Input, Select, Tag } from "antd";
import styled from "styled-components";
import CommonModal from "../../components/commons/CommonModel";

import carsService from "./CarsService";
import CarsEdit from "./CarsEdit";
import { NavLink, useSearchParams } from "react-router-dom";
//import { HeaderStyle, SearchInputStyle } from '../../components/commons/CommonStyles';
import CommonDeleteModal from "../../components/commons/CommonDeleteModal";
import { useDispatch, useSelector } from "react-redux";
import { searchCars, updateCarsState, carsSearchText } from "./CarsRedux";

const CarsList = () => {
  const [carsData, setCarsData] = useState([]);
  const [total, setTotal] = useState();

  const searchText = useSelector(carsSearchText);
  const [loading, setLoading] = useState();
  const [carsSelection, setCarsSelection] = useState([]);
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
    dispatch(updateCarsState({ page: page, limit: limit }));
    // setSearchParams({ ...Object.fromEntries(searchParams), 'searchText': e.target.value })
    searchData();
  }, []);

  async function searchData() {
    try {
      setLoading(true);
      const { payload } = await dispatch(searchCars());
      setCarsData(payload.data);
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
    dispatch(updateCarsState({ page: page, limit: limit, searchText: value }));
    clearTimeout(delayTimerRef.current);
    delayTimerRef.current = setTimeout(() => {
      searchData();
    }, 500);
  };

  const handlePagination = async (page, pageSize) => {
    // permmission exmple

    // if (!(await authService.checkPermmision('cars', 'read'))) {
    //     return message.error('You have not a permmission');
    // }

    setSearchParams({ page: page, limit: pageSize });
    dispatch(updateCarsState({ page: page, limit: pageSize }));

    searchData();
  };

  const tableChange = (pagination, filters, sorter) => {
    const { field, order } = sorter;
    dispatch(updateCarsState({ sort: field, order: order }));

    searchData();
  };

  const handleReload = () => {
    const [page, limit] = getPaginationInfo();

    setSearchParams({ page: 1, limit: 5 });
    dispatch(
      updateCarsState({
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
      const data = await carsService.deleteCar(modeID);
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
    {
      key: "3",
      label: (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.luohanacademy.com"
        >
          3rd menu item
        </a>
      ),
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
                setModeID(recored._id);
              }}
            ></Button>
          </Dropdown>
        );
      },
    },
    {
      title: "Image",
      dataIndex: "images",
      sorter: true,
      render: (text, recored) => {
        return (
          <Image
            // height={50}
            width={80}
            style={{ objectFit: "cover", maxHeight: 50 }}
            src={recored?.images[0]}
          />
        );
      },
    },
    {
      title: "Car Type",
      dataIndex: "car_type",
      render: (_, record) => <p>{record.vehicle_type?.name}</p>, // or record.title if exists
      // sorter: true,
    },

    {
      title: "Brand",
      dataIndex: "brand",
      // sorter: true,
      render: (text, recored) => {
        return <p>{recored?.brand?.name}</p>;
      },
    },

    {
      title: "Model",
      dataIndex: "model",
      render: (model) => model?.name || "",
      // sorter: true,
    },

    {
      title: "Year",
      dataIndex: "year",
      // sorter: true,
    },

    {
      title: "Is Featured",
      dataIndex: "is_featured",
      render: (text, recored) => {
        return recored.is_featured ? (
          <Tag color="green">Featured</Tag>
        ) : (
          <Tag color="blue">Not featured</Tag>
        );
      },
    },
    {
      title: "Transmission",
      dataIndex: "transmission",
      sorter: true,
    },

    {
      title: "Fuel type",
      dataIndex: "fuel_type",
      sorter: true,
    },

    {
      title: "Seating capacity",
      dataIndex: "seating_capacity",
      sorter: true,
    },

    {
      title: "Rental price / day",
      dataIndex: "rental_price_per_day",
      sorter: true,
    },

    {
      title: "Location",
      dataIndex: "location",
      render: (loc) => loc?.city || loc?.address || "",
      sorter: true,
    },

    {
      title: "Description",
      dataIndex: "description",
      sorter: true,
    },

    {
      title: "Insurance info",
      dataIndex: "insurance_info",
      sorter: true,
    },

    {
      title: "rental terms",
      dataIndex: "rental_terms",
      sorter: true,
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
          <CarsEdit
            carsData={carsData}
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
          <h1 className="text-2xl font-bold pb-4">Carss</h1>
          <div className="flex">
            <Input
              onChange={searchHandler}
              placeholder="Search"
              value={searchText}
              allowClear
              //   style={{ borderRadius: "0px 0px 0px 0px" }}
              className=" drop-shadow-sm rounded-lg  py-2"
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
              <p className="pl-2">Add Item</p>
            </span>
          </button>
        </span>
      </span>

      <CommonTable
        rowSelectionType={"checkbox"}
        data={carsData}
        columns={columns}
        setSelection={setCarsSelection}
        handlePagination={handlePagination}
        total={total}
        loadding={loading}
        tableChange={tableChange}
      />
    </div>
  );
};

export default CarsList;

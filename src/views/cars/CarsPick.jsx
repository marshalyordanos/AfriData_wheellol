import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import carsService from "./CarsService";
import CommonTable from "../../components/commons/CommonTable";
import {
  ButtonStyle,
  SearchInputStyle,
} from "../../components/commons/CommonStyles";
import { Divider, Input } from "antd";
import { searchCars, updateCarsState, carsSearchText } from "./CarsRedux"; //** */
import { useDispatch, useSelector } from "react-redux"; /*** */

const CarsPick = ({ setIsModalOpen, selectHandler }) => {
  const [carsData, setCarsData] = useState([]);
  const [total, setTotal] = useState();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch(); /*** */
  const searchText = useSelector(carsSearchText); //** */

  const [loading, setLoading] = useState();
  const [carsSelection, setCarsSelection] = useState([]);
  const delayTimerRef = useRef(null);

  const getPaginationInfo = () => {
    return [searchParams.get("page") || 1, searchParams.get("limit") || 5];
  };

  useEffect(() => {
    const [page, limit] = getPaginationInfo();
    dispatch(updateCarsState({ page: page, limit: limit }));

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

    dispatch(updateCarsState({ page: page, limit: limit, searchText: value }));
    clearTimeout(delayTimerRef.current);
    delayTimerRef.current = setTimeout(() => {
      searchData();
    }, 500);
  };

  const handlePagination = (page, pageSize) => {
    setSearchParams({ page: page, limit: pageSize });
    searchData();
  };

  const columns = [
    {
      title: "title",
      dataIndex: "title",
    },

    {
      title: "brand",
      dataIndex: "brand",
    },

    {
      title: "model",
      dataIndex: "model",
    },

    {
      title: "year",
      dataIndex: "year",
    },

    {
      title: "is_featured",
      dataIndex: "is_featured",
      render: (text, recored) => {
        return recored.is_featured ? <p>true</p> : <p>false</p>;
      },
    },

    {
      title: "category",
      dataIndex: "category",
    },

    {
      title: "transmission",
      dataIndex: "transmission",
    },

    {
      title: "fuel_type",
      dataIndex: "fuel_type",
    },

    {
      title: "seating_capacity",
      dataIndex: "seating_capacity",
    },

    {
      title: "rental_price_per_day",
      dataIndex: "rental_price_per_day",
    },

    {
      title: "location",
      dataIndex: "location",
    },

    {
      title: "description",
      dataIndex: "description",
    },

    {
      title: "images",
      dataIndex: "images",
    },

    {
      title: "insurance_info",
      dataIndex: "insurance_info",
    },

    {
      title: "rental_terms",
      dataIndex: "rental_terms",
    },
  ];

  return (
    <div>
      <SearchInputStyle>
        <Input
          onChange={searchHandler}
          placeholder="Search"
          value={searchText}
          allowClear
        />
      </SearchInputStyle>

      <CommonTable
        rowSelectionType={"radio"}
        data={carsData}
        columns={columns}
        setSelection={setCarsSelection}
        handlePagination={handlePagination}
        total={total}
        loadding={loading}
      />
      <Divider style={{ margin: 15 }} />

      <ButtonStyle>
        <button onClick={() => setIsModalOpen(false)}>cancel</button>
        <button
          disabled={carsSelection.length == 0}
          className={carsSelection.length > 0 ? "" : "disable"}
          onClick={() => selectHandler(carsSelection[0])}
        >
          Return
        </button>
      </ButtonStyle>
    </div>
  );
};

export default CarsPick;

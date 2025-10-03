import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import categorysService from "./PermissionService";
import CommonTable from "../../components/commons/CommonTable";
import {
  ButtonStyle,
  SearchInputStyle,
} from "../../components/commons/CommonStyles";
import { Divider, Input } from "antd";
import {
  searchCategorys,
  updateCategorysState,
  categorysSearchText,
} from "./PermissionRedux"; //** */
import { useDispatch, useSelector } from "react-redux"; /*** */

const CategorysPick = ({ setIsModalOpen, selectHandler }) => {
  const [categorysData, setCategorysData] = useState([]);
  const [total, setTotal] = useState();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch(); /*** */
  const searchText = useSelector(categorysSearchText); //** */

  const [loading, setLoading] = useState();
  const [categorysSelection, setCategorysSelection] = useState([]);
  const delayTimerRef = useRef(null);

  const getPaginationInfo = () => {
    return [searchParams.get("page") || 1, searchParams.get("limit") || 5];
  };

  useEffect(() => {
    const [page, limit] = getPaginationInfo();
    dispatch(updateCategorysState({ page: page, limit: limit }));

    searchData();
  }, []);

  async function searchData() {
    try {
      setLoading(true);
      const { payload } = await dispatch(searchCategorys());
      setCategorysData(payload.data);
      setTotal(payload.total);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  }
  const searchHandler = (e) => {
    const { value } = e.target;
    const [page, limit] = getPaginationInfo();

    dispatch(
      updateCategorysState({ page: page, limit: limit, searchText: value })
    );
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
      title: "name",
      dataIndex: "name",
    },

    {
      title: "description",
      dataIndex: "description",
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
        data={categorysData}
        columns={columns}
        setSelection={setCategorysSelection}
        handlePagination={handlePagination}
        total={total}
        loadding={loading}
      />
      <Divider style={{ margin: 15 }} />

      <ButtonStyle>
        <button onClick={() => setIsModalOpen(false)}>cancel</button>
        <button
          disabled={categorysSelection.length == 0}
          className={categorysSelection.length > 0 ? "" : "disable"}
          onClick={() => selectHandler(categorysSelection[0])}
        >
          Return
        </button>
      </ButtonStyle>
    </div>
  );
};

export default CategorysPick;

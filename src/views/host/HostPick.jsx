import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import hostService from "./HostService";
import CommonTable from "../../components/commons/CommonTable";
import {
  ButtonStyle,
  SearchInputStyle,
} from "../../components/commons/CommonStyles";
import { Divider, Input } from "antd";
import { searchHost, updateHostState, hostSearchText } from "./HostRedux";
import { useDispatch, useSelector } from "react-redux";

const HostPick = ({ setIsModalOpen, selectHandler }) => {
  const [hostData, setHostData] = useState([]);
  const [total, setTotal] = useState();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const searchText = useSelector(hostSearchText);

  const [loading, setLoading] = useState();
  const [hostSelection, setHostSelection] = useState([]);
  const delayTimerRef = useRef(null);

  const getPaginationInfo = () => {
    return [searchParams.get("page") || 1, searchParams.get("limit") || 5];
  };

  useEffect(() => {
    const [page, limit] = getPaginationInfo();
    dispatch(updateHostState({ page: page, limit: limit }));
    searchData();
  }, []);

  async function searchData() {
    try {
      setLoading(true);
      const { payload } = await dispatch(searchHost());
      setHostData(payload.data);
      setTotal(payload.total);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  }
  const searchHandler = (e) => {
    const { value } = e.target;
    const [page, limit] = getPaginationInfo();
    dispatch(updateHostState({ page: page, limit: limit, searchText: value }));
    clearTimeout(delayTimerRef.current);
    delayTimerRef.current = setTimeout(() => {
      searchData();
    }, 500);
  };

  const handlePagination = (page, pageSize) => {
    setSearchParams({ page: page, limit: pageSize });
    dispatch(updateHostState({ page, limit: pageSize }));
    searchData();
  };

  const columns = [
    {
      title: "First Name",
      dataIndex: "firstName",
      key: "firstName",
    },
    {
      title: "Last Name",
      dataIndex: "lastName",
      key: "lastName",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => role?.name || "-",
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
        data={hostData}
        columns={columns}
        setSelection={setHostSelection}
        handlePagination={handlePagination}
        total={total}
        loadding={loading}
      />
      <Divider style={{ margin: 15 }} />

      <ButtonStyle>
        <button onClick={() => setIsModalOpen(false)}>cancel</button>
        <button
          disabled={hostSelection.length == 0}
          className={hostSelection.length > 0 ? "" : "disable"}
          onClick={() => selectHandler(hostSelection[0])}
        >
          Return
        </button>
      </ButtonStyle>
    </div>
  );
};

export default HostPick;

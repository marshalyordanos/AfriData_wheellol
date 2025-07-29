// import React, { useState } from "react";
// import { Divider, Empty, Pagination, Radio, Table } from "antd";
// import styled from "styled-components";

// const CommonTable = React.memo(
//   ({
//     data,
//     columns,
//     rowSelectionType,
//     setSelection,
//     handlePagination,
//     total,
//     loadding,
//     tableChange,
//     type,
//     scroll,
//   }) => {
//     const onShowSizeChange = (current, pageSize) => {
//       console.log(current, pageSize);
//       handlePagination(current, pageSize);
//     };
//     console.log("88",data)

//     let rowSelection = {
//       onChange: (selectedRowKeys, selectedRows) => {
//         setSelection(selectedRows);
//         console.log(
//           `selectedRowKeys: ${selectedRowKeys}`,
//           "selectedRows: ",
//           selectedRows
//         );
//       },
//       getCheckboxProps: (record) => ({
//         disabled: type,
//         name: type ? "" : record?.name,
//       }),
//     };

//     console.log("common table");

//     return (
//       <div className="mx-6 border-[1px] border-[#F0F0F0] rounded">
//         <div className="common_table">
//           <Table
//             scroll={{ x: "full" }}
//             rowSelection={{
//               type: rowSelectionType,
//               ...rowSelection,
//             }}
//             loading={loadding}
//             rowKey={"_id"}
//             locale={{
//               emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />,
//             }}
//             columns={columns}
//             dataSource={data}
//             onChange={tableChange}
//             pagination={false}
//             className=" text-base"
//           />
//         </div>

//         {type ? (
//           ""
//         ) : (
//           <div className="flex justify-end py-4">
//             <Pagination
//               total={total}
//               defaultPageSize={5}
//               defaultCurrent={1}
//               pageSizeOptions={["5", "10", "20"]}
//               showSizeChanger={true}
//               onChange={onShowSizeChange}
//             />
//           </div>
//         )}
//       </div>
//     );
//   }
// );

// export const TableStyle = styled.div`
//   border: 1px solid whitesmoke;

//   margin: 0 24px;
//   margin-top: 20px;
//   background-color: #ffffff;
//   border-radius: 10px;
//   .common_table {
//     width: 100%;
//     overflow-x: auto;
//   }
//   .common_pagination {
//     margin: 40px 15px;
//     display: flex;
//     justify-content: flex-end;
//   }

//   th {
//     font-size: 15px;

//     background-color: #fafafa !important;
//   }

//   tr {
//     font-size: 15px;
//   }

//   tr:n {
//     font-size: 15px;
//     background-color: #ffffff;
//   }
// `;

// export default CommonTable;

// import React from "react";
import React, { useEffect, useRef, useState } from "react";

import { Card, Row, Col, Dropdown, Button, Pagination } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import CommonModal from "../../components/commons/CommonModel";
import StateEdit from "../../views/state/StateEdit";
import ZoneEdit from "../../views/zone/ZoneEdit";
import WoredaEdit from "../../views/woreda/WoredaEdit";
import { NavLink, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  searchState,
  updateStateState,
  stateSearchText,
} from "../../views/state/StateRedux";
import CommonDeleteModal from "../../components/commons/CommonDeleteModal";
import { set } from "lodash";
import stateService from "../../views/state/StateService";
import ZoneService from "../../views/zone/ZoneService";
import WoredaService from "../../views/woreda/WoredaService";
import KebeleEdit from "../../views/kebele/kebeleEdit";
import VillageEdit from "../../views/village/VillageEdit";
import kebeleService from "../../views/kebele/KebeleRedux";
import VillageService from "../../views/village/VillageService";

const CommonTable = React.memo(
  ({
    data,
    columns,
    rowSelectionType,
    onStateChange,
    onZoneChange,
    onWoredaChange,
    onKebeleChange,
    onVillageChange,
    onStateDelete,
    onZoneDelete,
    onWoredaDelete,
    onVillageDelete,
    onKebeleDelete,

    setSelection,
    handlePagination,
    hasPermission,
    setSelectedState,
    navigateToZones,
    total,
    tableChange,
    type,
    scroll,
    state,
  }) => {
    const [stateData, setStateData] = useState([]);
    const [zoneData, setZoneData] = useState([]);
    const [woredaData, setWoredaData] = useState([]);

    const [loading, setLoading] = useState();
    const [stateSelection, setStateSelection] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
    const [isWoredaModalOpen, setIsWoredaModalOpen] = useState(false);
    const [isKebeleModalOpen, setIsKebeleModalOpen] = useState(false);
    const [isVillageModalOpen, setIsVillageModalOpen] = useState(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isWoredaDeleteModalOpen, setIsWoredaDeleteModalOpen] =
      useState(false);
    const [isZoneDeleteModalOpen, setIsZoneDeleteModalOpen] = useState(false);
    const [isKebeleDeleteModalOpen, setIsKebeleDeleteModalOpen] =
      useState(false);
    const [isVillageDeleteModalOpen, setIsVillageDeleteModalOpen] =
      useState(false);

    const [modeID, setModeID] = useState("");
    const [searchParams, setSearchParams] = useSearchParams();
    const dispatch = useDispatch();
    console.log("./././././", data);

    const getPaginationInfo = () => {
      return [searchParams.get("page") || 1, searchParams.get("limit") || 5];
    };
    useEffect(() => {
      const [page, limit] = getPaginationInfo();
      dispatch(updateStateState({ page: page, limit: limit }));
      // setSearchParams({ ...Object.fromEntries(searchParams), 'searchText': e.target.value })
      searchData();
    }, []);

    async function searchData() {
      try {
        setLoading(true);

        const { payload } = await dispatch(searchState());
        setStateData(payload.data);
        setTotal(payload.total);
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    }
    const delayTimerRef = useRef(null);
    const handleDelete = async () => {
      try {
        setLoading(true);
        const data = await stateService.deleteStat(modeID);
        setIsDeleteModalOpen(false);
        onStateDelete();

        searchData();

        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    const handleZoneDelete = async () => {
      try {
        setLoading(true);
        const data = await ZoneService.deleteZone(modeID);
        setIsZoneDeleteModalOpen(false);
        onZoneDelete();

        searchData();
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    console.log("fgfgf", onStateChange);

    // const onStateChange = () => {
    //   console.log("onStateChange");
    //   searchData();
    // };

    const handleWoredaDelete = async () => {
      try {
        setLoading(true);
        const data = await WoredaService.deleteWoreda(modeID);
        setIsWoredaDeleteModalOpen(false);
        onWoredaDelete();

        searchData();
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    const handleKebeleDelete = async () => {
      try {
        setLoading(true);
        const data = await kebeleService.deleteKebele(modeID);
        setIsKebeleDeleteModalOpen(false);
        onKebeleDelete();

        searchData();
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    const handleVillageDelete = async () => {
      try {
        setLoading(true);
        const data = await VillageService.deleteVillage(modeID);
        setIsVillageDeleteModalOpen(false);
        onVillageDelete();

        searchData();
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    const onClick = ({ key }, record) => {
      console.log("key", key);
      console.log("record", record);
      if (key == "edit") {
        if (state === "zone") {
          console.log("zone");
          setIsZoneModalOpen(true);
        } else if (state === "woreda") {
          console.log("woreda");
          setIsWoredaModalOpen(true);
        } else if (state === "kebele") {
          setIsKebeleModalOpen(true);
        } else if (state === "village") {
          setIsVillageModalOpen(true);
        } else {
          setIsModalOpen(true);
        }

        setModeID(record._id);
      } else if (key === "delete") {
        if (state === "zone") {
          console.log("zone");
          setIsZoneDeleteModalOpen(true);
        } else if (state === "woreda") {
          console.log("woreda");
          setIsWoredaDeleteModalOpen(true);
        } else if (state === "kebele") {
          setIsKebeleDeleteModalOpen(true);
        } else if (state === "village") {
          setIsVillageDeleteModalOpen(true);
        } else {
          setIsDeleteModalOpen(true);
        }
        setModeID(record._id);
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

    const onShowSizeChange = (current, pageSize) => {
      console.log(current, pageSize);
      handlePagination(current, pageSize);
    };

    // Function to map column titles to card content
    const renderCardContent = (record) => {
      return columns.map((column) => {
        const value = record[column.dataIndex];
        if (Array.isArray(value)) {
          return (
            <div key={column.dataIndex}>
              <strong>{column.title}: </strong>
              {value.join(", ")}
            </div>
          );
        } else if (typeof value === "object" && value !== null) {
          return (
            <div key={column.dataIndex}>
              {Object.entries(value).map(([key, val]) => (
                <div key={key}>{val.name}</div>
              ))}
            </div>
          );
        }
        return (
          <div className="card-content" key={column.dataIndex}>
            {/* <strong>{column.title}: </strong> */}
            {value}
          </div>
        );
      });
    };
    console.log("pppppppp", data);
    console.log("fkfk", hasPermission);
    console.log("**********", isZoneModalOpen);
    // console.log("**********",sele)

    return (
      <div className="flex flex-col mx-6 mb-4 px-14 border-[1px] border-[#F0F0F0] rounded">
        {hasPermission && isModalOpen ? (
          <CommonModal
            width={1000}
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
          >
            <StateEdit
              stateData={stateData}
              searchData={searchData}
              setMode={setModeID}
              mode={modeID}
              isModelOpen={isModalOpen}
              setIsModalOpen={setIsModalOpen}
              onStateChange={onStateChange}
            />
          </CommonModal>
        ) : (
          ""
        )}

        {hasPermission && isZoneModalOpen ? (
          <CommonModal
            width={1000}
            isModalOpen={isZoneModalOpen}
            setIsModalOpen={setIsZoneModalOpen}
          >
            <ZoneEdit
              zoneData={stateData}
              searchData={searchData}
              setMode={setModeID}
              mode={modeID}
              isModelOpen={isZoneModalOpen}
              setIsModalOpen={setIsZoneModalOpen}
              onZoneChange={onZoneChange}
            />
          </CommonModal>
        ) : (
          ""
        )}

        {hasPermission && isWoredaModalOpen ? (
          <CommonModal
            width={1000}
            isModalOpen={isWoredaModalOpen}
            setIsModalOpen={setIsWoredaModalOpen}
          >
            <WoredaEdit
              woredaData={stateData}
              searchData={searchData}
              setMode={setModeID}
              mode={modeID}
              onWoredaChange={onWoredaChange}
              isModelOpen={isWoredaModalOpen}
              setIsModalOpen={setIsWoredaModalOpen}
            />
          </CommonModal>
        ) : (
          ""
        )}

        {hasPermission && isKebeleModalOpen ? (
          <CommonModal
            width={1000}
            isModalOpen={isKebeleModalOpen}
            setIsModalOpen={setIsKebeleModalOpen}
          >
            <KebeleEdit
              kebeleData={stateData}
              searchData={searchData}
              setMode={setModeID}
              mode={modeID}
              onKebeleChange={onKebeleChange}
              isModelOpen={isKebeleModalOpen}
              setIsModalOpen={setIsKebeleModalOpen}
            />
          </CommonModal>
        ) : (
          ""
        )}

        {hasPermission && isVillageModalOpen ? (
          <CommonModal
            width={1000}
            isModalOpen={isVillageModalOpen}
            setIsModalOpen={setIsVillageModalOpen}
          >
            <VillageEdit
              villageData={stateData}
              searchData={searchData}
              setMode={setModeID}
              mode={modeID}
              onVillageChange={onVillageChange}
              isModelOpen={isVillageModalOpen}
              setIsModalOpen={setIsVillageModalOpen}
            />
          </CommonModal>
        ) : (
          ""
        )}
        {hasPermission && isDeleteModalOpen ? (
          <CommonDeleteModal
            setIsModalOpen={setIsDeleteModalOpen}
            handleDelete={handleDelete}
            loading={loading}
            isModalOpen={isDeleteModalOpen}
          >
            <h1 className="text-2xl font-bold text-red-600">
              Are you absolutely sure?
            </h1>
            <p className="mt-2 text-lg text-gray-700">
              This action{" "}
              <span className="font-semibold">cannot be undone</span> and will
              permanently delete the selected data.
            </p>
            <p className="mt-2 text-lg text-red-500">
              Please double-check your selection before proceeding.
            </p>
          </CommonDeleteModal>
        ) : (
          ""
        )}

        {hasPermission && isZoneDeleteModalOpen ? (
          <CommonDeleteModal
            setIsModalOpen={setIsZoneDeleteModalOpen}
            handleDelete={handleZoneDelete}
            loading={loading}
            isModalOpen={isZoneDeleteModalOpen}
          >
            <h1 className="text-2xl font-bold text-red-600">
              Are you absolutely sure?
            </h1>
            <p className="mt-2 text-lg text-gray-700">
              This action{" "}
              <span className="font-semibold">cannot be undone</span> and will
              permanently delete the selected data.
            </p>
            <p className="mt-2 text-lg text-red-500">
              Please double-check your selection before proceeding.
            </p>
          </CommonDeleteModal>
        ) : (
          ""
        )}

        {hasPermission && isWoredaDeleteModalOpen ? (
          <CommonDeleteModal
            setIsModalOpen={setIsWoredaDeleteModalOpen}
            handleDelete={handleWoredaDelete}
            loading={loading}
            isModalOpen={isWoredaDeleteModalOpen}
          >
            <h1 className="text-2xl font-bold text-red-600">
              Are you absolutely sure?
            </h1>
            <p className="mt-2 text-lg text-gray-700">
              This action{" "}
              <span className="font-semibold">cannot be undone</span> and will
              permanently delete the selected data.
            </p>
            <p className="mt-2 text-lg text-red-500">
              Please double-check your selection before proceeding.
            </p>
          </CommonDeleteModal>
        ) : (
          ""
        )}

        {hasPermission && isKebeleDeleteModalOpen ? (
          <CommonDeleteModal
            setIsModalOpen={setIsKebeleDeleteModalOpen}
            handleDelete={handleKebeleDelete}
            loading={loading}
            isModalOpen={isKebeleDeleteModalOpen}
          >
            <h1 className="text-2xl font-bold text-red-600">
              Are you absolutely sure?
            </h1>
            <p className="mt-2 text-lg text-gray-700">
              This action{" "}
              <span className="font-semibold">cannot be undone</span> and will
              permanently delete the selected data.
            </p>
            <p className="mt-2 text-lg text-red-500">
              Please double-check your selection before proceeding.
            </p>
          </CommonDeleteModal>
        ) : (
          ""
        )}
        {hasPermission && isVillageDeleteModalOpen ? (
          <CommonDeleteModal
            setIsModalOpen={setIsVillageDeleteModalOpen}
            handleDelete={handleVillageDelete}
            loading={loading}
            isModalOpen={isVillageDeleteModalOpen}
          >
            <h1 className="text-2xl font-bold text-red-600">
              Are you absolutely sure?
            </h1>
            <p className="mt-2 text-lg text-gray-700">
              This action{" "}
              <span className="font-semibold">cannot be undone</span> and will
              permanently delete the selected data.
            </p>
            <p className="mt-2 text-lg text-red-500">
              Please double-check your selection before proceeding.
            </p>
          </CommonDeleteModal>
        ) : (
          ""
        )}

        <Row gutter={[24, 24]}>
          {data?.map((record) => (
            <Col span={8} key={record._id}>
              <Card
                title={
                  <div className="flex justify-between items-center">
                    <div>
                      <p
                        style={{ fontWeight: "700", color: "#000000" }}
                        className="font-18px capitalize font-bold"
                      >
                        {renderCardContent(record)}
                      </p>
                    </div>
                    {hasPermission && (
                      <Dropdown
                        menu={{
                          items,
                          onClick: (menuInfo) => {
                            menuInfo.domEvent.stopPropagation();
                            onClick(menuInfo, record);
                          },
                        }}
                        trigger={["click"]}
                      >
                        <Button
                          type="text"
                          icon={<MoreOutlined className="horizontal-dots" />}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Dropdown>
                    )}
                  </div>
                }
                bordered={false}
                loading={loading}
                style={{ minHeight: "150px", cursor: "pointer" }} // Add cursor pointer
                bodyStyle={{ padding: "20px" }}
                // onClick={() => {
                //     // Action on card click
                //     setSelectedState(record._id);
                //     onClick={() => navigateToZones(record._id)}
                //     searchData(); // or navigate to specific zone
                // }}
                onClick={() => navigateToZones(record._id)}
              >
                {record.zonesCount >= 0 ? (
                  <p
                    style={{
                      fontWeight: "700",
                      color: "#D8D8D8",
                      fontSize: "16px",
                    }}
                    className="font-bold"
                  >
                    {record.zonesCount} Zones
                  </p>
                ) : record.woredasCount >= 0 ? (
                  <p
                    style={{
                      fontWeight: "700",
                      color: "#D8D8D8",
                      fontSize: "16px",
                    }}
                    className="font-bold"
                  >
                    {record.woredasCount} Woredas
                  </p>
                ) : record.kebeleCount >= 0 ? (
                  <p
                    style={{
                      fontWeight: "700",
                      color: "#D8D8D8",
                      fontSize: "16px",
                    }}
                    className="font-bold"
                  >
                    {record.kebeleCount} kebeles
                  </p>
                ) : record.villageCount >= 0 ? (
                  <p
                    style={{
                      fontWeight: "700",
                      color: "#D8D8D8",
                      fontSize: "16px",
                    }}
                    className="font-bold"
                  >
                    {record.villageCount} Villages
                  </p>
                ) : (
                  <p
                    style={{
                      fontWeight: "700",
                      color: "#D8D8D8",
                      fontSize: "16px",
                    }}
                    className="font-bold"
                  >
                    {record.facilityCount} Facilities
                  </p>
                )}
              </Card>
            </Col>
          ))}
        </Row>

        {!type && (
          <div className="flex justify-end py-4">
            <Pagination
              total={total}
              defaultPageSize={5}
              defaultCurrent={1}
              pageSizeOptions={["5", "10", "20"]}
              showSizeChanger={true}
              onChange={onShowSizeChange}
            />
          </div>
        )}
      </div>
    );
  }
);

export default CommonTable;

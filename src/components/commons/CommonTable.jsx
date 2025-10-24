import React from "react";
import { Empty, Pagination, Table } from "antd";
import styled from "styled-components";

const CommonTable = React.memo(
  ({
    data,
    columns,
    rowSelectionType,
    setSelection,
    handlePagination,
    total,
    loadding,
    tableChange,
    type,
    rowKey,
    onRow,
    currentPage = 1,
    pageSize = 10,
    ...rest
  }) => {
    const onShowSizeChange = (current, pageSize) => {
      handlePagination(current, pageSize);
    };

    const rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
        setSelection(selectedRows);
      },
      getCheckboxProps: (record) => ({
        disabled: type,
        name: type ? "" : record?.name,
      }),
    };

    return (
      <TableContainer>
        <div className="common_table">
          <Table
            scroll={{ x: "max-content" }} 
            rowSelection={
              rowSelectionType
                ? { type: rowSelectionType, ...rowSelection }
                : undefined
            }
            loading={loadding}
            rowKey={rowKey || "_id"}
            locale={{
              emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />,
            }}
            columns={columns}
            dataSource={data}
            onChange={tableChange}
            pagination={false}
            className="text-base nowrap-table"
            onRow={onRow}
            {...rest}
          />
        </div>

        {!type && (
          <div className="common_pagination">
            <Pagination
              total={total}
              current={currentPage}
              pageSize={pageSize}
              pageSizeOptions={["10", "20"]}
              showSizeChanger
              onChange={onShowSizeChange}
              onShowSizeChange={onShowSizeChange}
            />
          </div>
        )}
      </TableContainer>
    );
  }
);

export const TableContainer = styled.div`
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fff;
  margin: 0 24px;
  margin-top: 20px;
  overflow-x: auto;

  .common_table {
    width: 100%;
  }

  /* Prevent column names and cell text from wrapping */
  .ant-table-thead > tr > th,
  .ant-table-tbody > tr > td {
    white-space: nowrap;
  }

  /* ✅ Optional: Add ellipsis if content is too long */
  .ant-table-thead > tr > th {
    text-overflow: ellipsis;
    overflow: hidden;
  }

  th {
    font-size: 15px;
    background-color: #fafafa !important;
  }

  tr {
    font-size: 15px;
  }

  .common_pagination {
    margin: 16px 24px;
    display: flex;
    justify-content: flex-end;
  }
`;

export default CommonTable;

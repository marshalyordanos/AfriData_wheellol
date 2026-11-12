import React from "react";
import { Empty, Pagination, Table } from "antd";
import "../modern/modern.css";

/**
 * Shared data table — styled to the Wheellol admin design.
 * Same props as before, so every list page picks up the new look.
 */
const CommonTable = React.memo(
  ({
    data,
    columns,
    rowSelectionType,
    setSelection,
    handlePagination,
    total,
    loadding,
    loading,
    tableChange,
    type,
    rowKey,
    onRow,
    currentPage = 1,
    pageSize = 10,
    unit = "results",
    ...rest
  }) => {
    const onShowSizeChange = (current, size) => {
      handlePagination && handlePagination(current, size);
    };

    const rowSelection = {
      onChange: (_keys, selectedRows) => {
        setSelection && setSelection(selectedRows);
      },
      getCheckboxProps: (record) => ({
        disabled: type,
        name: type ? "" : record?.name,
      }),
    };

    const cp = Number(currentPage) || 1;
    const ps = Number(pageSize) || 10;
    const tot = Number(total) || 0;
    const from = tot ? (cp - 1) * ps + 1 : 0;
    const to = Math.min(cp * ps, tot);

    return (
      <div className="mp-ctable">
        <div className="mp-table">
          <Table
            scroll={{ x: "max-content" }}
            rowSelection={
              rowSelectionType ? { type: rowSelectionType, ...rowSelection } : undefined
            }
            loading={loadding ?? loading}
            rowKey={rowKey || "_id"}
            locale={{
              emptyText: (
                <div style={{ padding: "36px 0" }}>
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nothing to show" />
                </div>
              ),
            }}
            columns={columns}
            dataSource={data}
            onChange={tableChange}
            pagination={false}
            onRow={
              onRow ||
              undefined
            }
            {...rest}
          />
        </div>

        {!type && (
          <div className="mp-table-foot">
            <span>
              Showing <b style={{ color: "var(--c-text)" }}>{from}</b>–
              <b style={{ color: "var(--c-text)" }}>{to}</b> of{" "}
              <b style={{ color: "var(--c-text)" }}>{tot}</b> {unit}
            </span>
            <Pagination
              total={tot}
              current={cp}
              pageSize={ps}
              pageSizeOptions={["10", "20", "50"]}
              showSizeChanger
              size="small"
              onChange={onShowSizeChange}
            />
          </div>
        )}
      </div>
    );
  }
);

export default CommonTable;

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Table,
  Input,
  Button,
  Space,
  Modal,
  Form,
  message,
  Popconfirm,
  Empty,
} from "antd";
import styled from "styled-components";
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import PermissionService from "./PermissionService";
import CommonCard from "../../components/commons/CommonCard";
import { Pagination } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  updateVehicleTypesState,
  permissionsPage,
  permissionsLimit,
  permissionsSearchText,
} from "./PermissionRedux";

const PAGE_SIZE = 10;

const PermissionList = () => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const dispatch = useDispatch();
  const page = useSelector(permissionsPage);
  const limit = useSelector(permissionsLimit);
  const reduxSearchText = useSelector(permissionsSearchText);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const searchDebounceRef = useRef();
  const [form] = Form.useForm();

  const fetchList = useCallback(
    async (opts = {}) => {
      try {
        setLoading(true);
        const searchVal =
          opts.searchText !== undefined ? opts.searchText : searchText;
        const pageVal = opts.page !== undefined ? opts.page : page || 1;
        const limitVal =
          opts.limit !== undefined ? opts.limit : limit || PAGE_SIZE;
        const res = await PermissionService.search({
          page: pageVal,
          limit: limitVal,
          search: searchVal,
        });
        setData(res.data);
        setTotal(res.total);
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    },
    [searchText, page, limit]
  );

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchText(val);
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      // reset to first page in redux and fetch
      dispatch(updateVehicleTypesState({ page: 1 }));
      fetchList({ page: 1, searchText: val, limit: limit || PAGE_SIZE });
    }, 400);
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      resource: record.resource,
      description: record.description,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await PermissionService.remove(id);
      message.success("Deleted");
      setData((prev) => prev.filter((r) => r.id !== id));
      setTotal((t) => t - 1);
      if (data.length === 1 && page > 1) {
        const newPage = (page || 1) - 1;
        dispatch(updateVehicleTypesState({ page: newPage }));
        fetchList({ page: newPage, limit: limit || PAGE_SIZE });
      }
    } catch (e) {
      message.error(e?.response?.data?.message || "Delete failed");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editing) {
        const updated = await PermissionService.update(editing.id, {
          resource: values.resource,
          description: values.description,
        });
        message.success("Updated");
        setData((prev) => prev.map((r) => (r.id === editing.id ? updated : r)));
      } else {
        const created = await PermissionService.create({
          resource: values.resource,
          description: values.description,
        });
        message.success("Created");
        setData((prev) => [created, ...prev.slice(0, PAGE_SIZE - 1)]);
        setTotal((t) => t + 1);
      }
      setModalOpen(false);
    } catch (e) {
      if (!e.errorFields) {
        message.error(e?.response?.data?.message || "Save failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "#",
      dataIndex: "index",
      width: 60,
      render: (_, __, i) => ((page || 1) - 1) * (limit || PAGE_SIZE) + i + 1,
    },
    {
      title: "Resource",
      dataIndex: "resource",
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (text) => <span>{text || "-"}</span>,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      render: (text) => (text ? new Date(text).toLocaleString() : "-"),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      align: "right",
      width: 140,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title="Delete permission?"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    dispatch(
      updateVehicleTypesState({ page: page || 1, limit: limit || PAGE_SIZE })
    );
    fetchList();
  }, [page, limit, searchText]);

  return (
    <div className="p-4">
      <div className="flex md:flex-row flex-col justify-between items-start md:items-end borde border-rose-700 mb-5">
        <div className="flex flex-col p-6 md:w-[45vw] w-full">
          <h1 className="text-2xl font-bold pb-4">Permissions</h1>
          <div className="flex">
            <Input
              onChange={handleSearchChange}
              placeholder="Search"
              value={searchText}
              allowClear
              className="drop-shadow-sm rounded-lg py-2"
            />
          </div>
        </div>
        <div className="flex ml-6 mb-6 md:mr-6">
          <button
            onClick={() => {
              dispatch(updateVehicleTypesState({ page: 1 }));
              fetchList({ page: 1, limit: limit || PAGE_SIZE, searchText });
            }}
            className="border border-[var(--color-primary)] py-2 px-3 text-[var(--color-primary)] rounded mr-4 flex items-center justify-center"
          >
            <ReloadOutlined className="boder boder-red-900" />
          </button>
          <button
            className="px-4 py-2 border border-[var(--color-primary)] text-white bg-[var(--color-primary)] rounded"
            onClick={openCreate}
          >
            <span className="flex flex-row">
              <PlusOutlined />
              <p className="pl-2">Add Permission</p>
            </span>
          </button>
        </div>
      </div>

      <div className="hidden md:block">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: page,
            pageSize: limit || PAGE_SIZE,
            total,
            onChange: (p, ps) => {
              dispatch(updateVehicleTypesState({ page: p, limit: ps }));
              fetchList({ page: p, limit: ps, searchText });
            },
            showTotal: (t) => `${t} item${t === 1 ? "" : "s"}`,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20"],
            showQuickJumper: false,
          }}
          locale={{
            emptyText: loading ? "" : <Empty description="No permissions" />,
          }}
        />
      </div>

      {/* Mobile card list */}
      <div className="block md:hidden px-4">
        {data && data.length > 0 ? (
          data.map((rec) => (
            <CommonCard
              key={rec.id}
              item={rec}
              title={"resource"}
              fieldMap={{ description: "Description", createdAt: "Created At" }}
              actionItems={[
                { key: "edit", label: <Button type="text">Edit</Button> },
                { key: "delete", label: <Button type="text">Delete</Button> },
              ]}
              onActionClick={(info, item) => {
                if (!info) return;
                const key = info.key;
                if (key === "edit") {
                  openEdit(item);
                }
                if (key === "delete") {
                  Modal.confirm({
                    title: "Delete permission?",
                    okButtonProps: { danger: true },
                    onOk: () => handleDelete(item.id),
                  });
                }
              }}
            />
          ))
        ) : (
          <div className="p-6">No permissions found</div>
        )}

        <div className="my-4 flex justify-center">
          <Pagination
            current={page}
            pageSize={limit || PAGE_SIZE}
            total={total}
            onChange={(p, ps) => {
              dispatch(updateVehicleTypesState({ page: p, limit: ps }));
              fetchList({ page: p, limit: ps, searchText });
            }}
            showSizeChanger
          />
        </div>
      </div>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        title={editing ? "Edit Permission" : "Create Permission"}
        okText={editing ? "Save" : "Create"}
        onOk={handleSubmit}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="resource"
            label="Resource"
            rules={[{ required: true, message: "Resource is required" }]}
          >
            <Input placeholder="e.g. Role" autoFocus />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input placeholder="Description" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PermissionList;

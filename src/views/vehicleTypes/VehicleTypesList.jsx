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
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import VehicleTypesService from "./VehicleTypesService";

// Clean implementation of Vehicle Types management list (list, search, create, edit, delete)

const PAGE_SIZE = 10;

const VehicleTypesList = () => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
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
        const res = await VehicleTypesService.search({
          page: opts.page || page,
          limit: PAGE_SIZE,
          searchText:
            opts.searchText !== undefined ? opts.searchText : searchText,
        });
        setData(res.data || []);
        setTotal(res.total || 0);
      } catch (e) {
        message.error(
          e?.response?.data?.message || "Failed to load vehicle types"
        );
      } finally {
        setLoading(false);
      }
    },
    [page, searchText]
  );

  useEffect(() => {
    fetchList();
  }, [page]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchText(val);
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setPage(1);
      fetchList({ page: 1, searchText: val });
    }, 400);
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({ name: record.name });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await VehicleTypesService.remove(id);
      message.success("Deleted");
      setData((prev) => prev.filter((r) => r._id !== id));
      setTotal((t) => t - 1);
      if (data.length === 1 && page > 1) {
        setPage((p) => p - 1);
        fetchList({ page: page - 1 });
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
        const updated = await VehicleTypesService.update(editing._id, {
          name: values.name,
        });
        message.success("Updated");
        setData((prev) =>
          prev.map((r) => (r._id === editing._id ? updated : r))
        );
      } else {
        const created = await VehicleTypesService.create({ name: values.name });
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
      render: (_, __, i) => (page - 1) * PAGE_SIZE + i + 1,
    },
    {
      title: "Name",
      dataIndex: "name",
      render: (text) => <span className="font-medium">{text}</span>,
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
            title="Delete vehicle type?"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record._id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
        <div className="flex flex-col w-full md:w-auto">
          <h1 className="text-2xl font-bold tracking-wide">Vehicle Types</h1>
        </div>
        <Space wrap>
          <Input
            allowClear
            placeholder="Search vehicle types..."
            className="w-60"
            value={searchText}
            onChange={handleSearchChange}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setPage(1);
              fetchList({ page: 1 });
            }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            New Type
          </Button>
        </Space>
      </div>

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total,
          onChange: (p) => setPage(p),
          showTotal: (t) => `${t} item${t === 1 ? "" : "s"}`,
        }}
        locale={{
          emptyText: loading ? "" : <Empty description="No vehicle types" />,
        }}
      />

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        title={editing ? "Edit Vehicle Type" : "Create Vehicle Type"}
        okText={editing ? "Save" : "Create"}
        onOk={handleSubmit}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: "Name is required" },
              { min: 2, message: "Too short" },
            ]}
          >
            <Input placeholder="e.g. SUVs" autoFocus />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VehicleTypesList;

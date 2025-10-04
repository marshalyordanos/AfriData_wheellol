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
import RolesService from "./roleService";

const PAGE_SIZE = 10;

const RoleList = () => {
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
        const res = await RolesService.search({
          page: opts.page || page,
          limit: PAGE_SIZE,
          search: opts.searchText !== undefined ? opts.searchText : searchText,
        });
        setData(res.data || []);
        setTotal(res.total || 0);
      } catch (e) {
        message.error(e?.response?.data?.message || "Failed to load roles");
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
    form.setFieldsValue({
      name: record.name,
      description: record.description,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await RolesService.remove(id);
      message.success("Deleted");
      setData((prev) => prev.filter((r) => r.id !== id));
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
        const updated = await RolesService.update(editing.id, {
          name: values.name,
          description: values.description,
        });
        message.success("Updated");
        setData((prev) => prev.map((r) => (r.id === editing.id ? updated : r)));
      } else {
        const created = await RolesService.create({
          name: values.name,
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
      render: (_, __, i) => (page - 1) * PAGE_SIZE + i + 1,
    },
    {
      title: "Name",
      dataIndex: "name",
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
      title: "Permissions",
      dataIndex: "rolePermissions",
      render: (rolePermissions) => (
        <ul style={{ paddingLeft: 16 }}>
          {rolePermissions && rolePermissions.length > 0 ? (
            rolePermissions.map((perm) => (
              <li key={perm.id}>
                <b>{perm.permission?.resource}</b>:
                {perm.createAction && " Create"}
                {perm.readAction && " Read"}
                {perm.updateAction && " Update"}
                {perm.deleteAction && " Delete"}
              </li>
            ))
          ) : (
            <span>-</span>
          )}
        </ul>
      ),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      align: "right",
      width: 160,
      render: (_, record) => (
        <Space style={{ paddingRight: 50 }}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title="Delete role?"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id)}
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
          <h1 className="text-2xl font-bold tracking-wide">Roles</h1>
        </div>
        <Space wrap>
          <Input
            allowClear
            placeholder="Search permissions..."
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
            New Role
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
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
          emptyText: loading ? "" : <Empty description="No roles" />,
        }}
      />

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        title={editing ? "Edit Role" : "Create Role"}
        okText={editing ? "Save" : "Create"}
        onOk={handleSubmit}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="e.g. SuperAdmin" autoFocus />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input placeholder="Description" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleList;

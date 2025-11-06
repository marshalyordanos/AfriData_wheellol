import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dropdown,
  Menu,
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
import RolesService from "./RoleService";
import PermissionService from "../permissions/PermissionService";

const PAGE_SIZE = 10;

const RoleList = () => {
  const [updatePermissionLoading, setUpdatePermissionLoading] = useState(false);
  // Modal state for viewing all permissions/actions
  const [permissionModal, setPermissionModal] = useState({
    open: false,
    role: null,
  });
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [selectedRolePermission, setSelectedRolePermission] = useState(null);
  const [removePermissionLoading, setRemovePermissionLoading] = useState(false);
  const [updateActions, setUpdateActions] = useState({
    createAction: false,
    readAction: false,
    updateAction: false,
    deleteAction: false,
  });
  const [data, setData] = useState([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [assignPermissionLoading, setAssignPermissionLoading] = useState(false);
  // Store selected permissions and actions as an object: { permissionId: { createAction, readAction, ... } }
  const [selectedPermissions, setSelectedPermissions] = useState({});
  // Fetch all permissions for assign modal
  const fetchPermissions = async () => {
    try {
      const res = await PermissionService.search({ page: 1, limit: 100 });
      setPermissions(res.data || []);
    } catch (e) {
      message.error("Failed to load permissions");
    }
  };
  // Open assign permission modal
  // Open update permission modal
  const openUpdateModal = (role, rolePermission) => {
    setSelectedRole(role);
    setSelectedRolePermission(rolePermission);
    setUpdateActions({
      createAction: !!rolePermission.createAction,
      readAction: !!rolePermission.readAction,
      updateAction: !!rolePermission.updateAction,
      deleteAction: !!rolePermission.deleteAction,
    });
    setUpdateModalOpen(true);
  };

  // Open remove permission modal
  const openRemoveModal = (role, rolePermission) => {
    setSelectedRole(role);
    setSelectedRolePermission(rolePermission);
    setRemoveModalOpen(true);
  };

  // Handle update action checkbox
  const handleUpdateActionCheck = (action) => {
    setUpdateActions((prev) => ({ ...prev, [action]: !prev[action] }));
  };

  // Update permission API call
  const handleUpdatePermission = async () => {
    if (!selectedRole || !selectedRolePermission) return;
    const payload = {
      permissionId:
        selectedRolePermission.permissionId ||
        selectedRolePermission.permission?.id,
      ...updateActions,
    };
    setUpdatePermissionLoading(true);
    try {
      await RolesService.updateAssignedPermissionToRole(
        selectedRole.id,
        payload
      );
      message.success("Permission updated");
      setUpdateModalOpen(false);
      // Reload the updated role and update modal
      const updatedRole = await RolesService.get(selectedRole.id);
      setPermissionModal((prev) =>
        prev.open ? { open: true, role: updatedRole } : prev
      );
      fetchList();
    } catch (e) {
      message.error(e?.response?.data?.message || "Update failed");
    } finally {
      setUpdatePermissionLoading(false);
    }
  };

  // Remove permission API call
  const handleRemovePermission = async () => {
    if (!selectedRole || !selectedRolePermission) return;
    setRemovePermissionLoading(true);
    const payload = {
      permissionId:
        selectedRolePermission.permissionId ||
        selectedRolePermission.permission?.id,
    };
    try {
      await RolesService.removeAssignedPermissionToRole(
        selectedRole.id,
        payload
      );
      message.success("Permission removed");
      setRemoveModalOpen(false);
      // Reload the updated role and update modal
      const updatedRole = await RolesService.get(selectedRole.id);
      setPermissionModal((prev) =>
        prev.open ? { open: true, role: updatedRole } : prev
      );
      fetchList();
    } catch (e) {
      message.error(e?.response?.data?.message || "Remove failed");
    } finally {
      setRemovePermissionLoading(false);
    }
  };
  const openAssignModal = (role) => {
    setSelectedRole(role);
    setAssignModalOpen(true);
    setSelectedPermissions({});
    fetchPermissions();
  };

  // Handle permission selection
  // Toggle permission selection
  const handlePermissionToggle = (permId) => {
    setSelectedPermissions((prev) => {
      if (prev[permId]) {
        // Deselect
        const copy = { ...prev };
        delete copy[permId];
        return copy;
      } else {
        // Select with all actions false
        return {
          ...prev,
          [permId]: {
            createAction: false,
            readAction: false,
            updateAction: false,
            deleteAction: false,
          },
        };
      }
    });
  };

  // Handle checkbox change
  // Toggle action checkbox for a permission
  const handleActionCheck = (permId, action) => {
    setSelectedPermissions((prev) => ({
      ...prev,
      [permId]: {
        ...prev[permId],
        [action]: !prev[permId][action],
      },
    }));
  };

  // Assign permission to role
  const handleAssignPermission = async () => {
    if (!selectedRole || Object.keys(selectedPermissions).length === 0) return;
    setAssignPermissionLoading(true);
    // Prepare payload as { roleId, permissions: [ ... ] }
    const permissionsArr = Object.entries(selectedPermissions).map(
      ([permissionId, actions]) => {
        const permObj = permissions.find(
          (p) => String(p.id) === String(permissionId)
        );
        return {
          permissionId: permObj ? permObj.id : permissionId,
          ...actions,
        };
      }
    );
    const payload = {
      roleId: selectedRole.id,
      permissions: permissionsArr,
    };
    try {
      await RolesService.assignPermissionToRole(payload);
      message.success("Permissions assigned");
      setAssignModalOpen(false);
      fetchList();
    } catch (e) {
      message.error(e?.response?.data?.message || "Assign failed");
    } finally {
      setAssignPermissionLoading(false);
    }
  };
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZE);
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
          limit: opts.limit || limit || PAGE_SIZE,
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
      title: "",
      dataIndex: "menu",
      width: 60,
      render: (_, record) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item key="assign" onClick={() => openAssignModal(record)}>
                Assign Permissions
              </Menu.Item>
            </Menu>
          }
          trigger={["click"]}
        >
          <Button size="small">
            <span style={{ fontSize: 18, verticalAlign: "middle" }}>⋮</span>
          </Button>
        </Dropdown>
      ),
    },
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
      render: (rolePermissions, record) => {
        const maxPreview = 2;
        const preview = (rolePermissions || []).slice(0, maxPreview);
        return (
          <div style={{ position: "relative", minHeight: 32 }}>
            <div
              style={{
                display: "inline-block",
                maxWidth: "calc(100% - 80px)",
                verticalAlign: "middle",
              }}
            >
              {preview.map((perm) => (
                <span
                  key={perm.id}
                  style={{
                    marginRight: 8,
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 120,
                    display: "inline-block",
                  }}
                >
                  {perm.permission?.resource || perm.permissionId}
                </span>
              ))}
              {rolePermissions && rolePermissions.length > maxPreview && (
                <span style={{ color: "#888", marginRight: 8 }}>
                  +{rolePermissions.length - maxPreview} more
                </span>
              )}
            </div>
            {rolePermissions && rolePermissions.length > 0 && (
              <Button
                size="small"
                onClick={() => setPermissionModal({ open: true, role: record })}
                style={{
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  padding: "0 8px",
                  zIndex: 2,
                  minWidth: 70,
                }}
              >
                View All
              </Button>
            )}
          </div>
        );
      },
    },
    {
      title: "Actions",
      dataIndex: "actions",
      align: "right",
      width: 140,
      render: (_, record) => (
        <Space style={{ paddingRight: 10 }}>
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
      {/* Modal to show all permissions and actions for a role */}
      <Modal
        open={permissionModal.open}
        onCancel={() => setPermissionModal({ open: false, role: null })}
        title={
          permissionModal.role
            ? `Permissions for ${permissionModal.role.name}`
            : "Permissions"
        }
        footer={null}
        width={800}
        bodyStyle={{ minHeight: 350, padding: 32 }}
      >
        {permissionModal.role &&
        permissionModal.role.rolePermissions &&
        permissionModal.role.rolePermissions.length > 0 ? (
          <ul style={{ paddingLeft: 0 }}>
            {permissionModal.role.rolePermissions.map((perm) => (
              <li
                key={perm.id}
                style={{
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  borderBottom: "1px solid #eee",
                  paddingBottom: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flex: 1,
                    gap: 18,
                  }}
                >
                  <span style={{ fontWeight: 600, minWidth: 140 }}>
                    {perm.permission?.resource || perm.permissionId}
                  </span>
                  <span>
                    {perm.createAction && (
                      <span
                        style={{
                          color: "#22c55e",
                          fontWeight: 500,
                          marginRight: 8,
                        }}
                      >
                        Create
                      </span>
                    )}
                    {perm.readAction && (
                      <span
                        style={{
                          color: "#3b82f6",
                          fontWeight: 500,
                          marginRight: 8,
                        }}
                      >
                        Read
                      </span>
                    )}
                    {perm.updateAction && (
                      <span
                        style={{
                          color: "#f59e42",
                          fontWeight: 500,
                          marginRight: 8,
                        }}
                      >
                        Update
                      </span>
                    )}
                    {perm.deleteAction && (
                      <span
                        style={{
                          color: "#ef4444",
                          fontWeight: 500,
                          marginRight: 8,
                        }}
                      >
                        Delete
                      </span>
                    )}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginLeft: "auto",
                  }}
                >
                  <Button
                    size="small"
                    type="dashed"
                    style={{
                      borderColor: "#4096ff",
                      color: "#4096ff",
                      fontWeight: 500,
                    }}
                    onClick={() => openUpdateModal(permissionModal.role, perm)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    type="default"
                    danger
                    style={{
                      borderColor: "#ef4444",
                      color: "#ef4444",
                      fontWeight: 500,
                      background: "#fff",
                    }}
                    onClick={() => openRemoveModal(permissionModal.role, perm)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <span>No permissions assigned.</span>
        )}
      </Modal>
      <div className="flex md:flex-row flex-col justify-between items-start md:items-end borde border-rose-700 mb-5">
        <div className="flex flex-col p-6 md:w-[45vw] w-full">
          <h1 className="text-2xl font-bold pb-4">Roles</h1>
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
              // reset to first page and re-fetch using current limit
              setPage(1);
              setLimit(PAGE_SIZE);
              fetchList({ page: 1, limit: PAGE_SIZE });
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
              <p className="pl-2">Add Role</p>
            </span>
          </button>
        </div>
      </div>
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
            // if pageSize changed, update limit
            if (ps && ps !== limit) setLimit(ps);
            setPage(p);
            fetchList({ page: p, limit: ps || limit });
          },
          showTotal: (t) => `${t} item${t === 1 ? "" : "s"}`,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20"],
          showQuickJumper: false,
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

      {/* Assign Permission Modal */}
      <Modal
        open={assignModalOpen}
        onCancel={() => setAssignModalOpen(false)}
        title={
          selectedRole
            ? `Assign Permissions to ${selectedRole.name}`
            : "Assign Permissions"
        }
        okText={
          assignPermissionLoading ? (
            <span>
              <span
                className="ant-spin-dot ant-spin-dot-spin"
                style={{ marginRight: 8 }}
              >
                <i className="ant-spin-dot-item" />
                <i className="ant-spin-dot-item" />
                <i className="ant-spin-dot-item" />
                <i className="ant-spin-dot-item" />
              </span>
              Assigning...
            </span>
          ) : (
            "Assign"
          )
        }
        onOk={handleAssignPermission}
        confirmLoading={assignPermissionLoading}
        destroyOnClose
        width={700}
      >
        <div>
          <h3 style={{ marginBottom: 18, fontWeight: 600, fontSize: 18 }}>
            Select permissions and actions:
          </h3>
          <div
            style={{
              maxHeight: 400,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            {permissions.map((perm) => (
              <div
                key={perm.id}
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  boxShadow: "0 2px 8px #e2e8f0",
                  padding: "18px 20px",
                  marginBottom: 0,
                  border: !!selectedPermissions[perm.id]
                    ? "2px solid #38bdf8"
                    : "1px solid #e2e8f0",
                  transition: "border 0.2s",
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 18,
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    fontSize: 16,
                    marginRight: 18,
                    color: "#0ea5e9",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!selectedPermissions[perm.id]}
                    onChange={() => handlePermissionToggle(perm.id)}
                    style={{
                      marginRight: 10,
                      accentColor: "#38bdf8",
                      width: 18,
                      height: 18,
                    }}
                  />
                  {perm.resource}
                </label>
                {selectedPermissions[perm.id] && (
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {Object.keys(selectedPermissions[perm.id]).map((action) => {
                      let color = "#e5e7eb",
                        label = "";
                      if (action === "createAction") {
                        color = "#22c55e";
                        label = "Create";
                      }
                      if (action === "readAction") {
                        color = "#3b82f6";
                        label = "Read";
                      }
                      if (action === "updateAction") {
                        color = "#f59e42";
                        label = "Update";
                      }
                      if (action === "deleteAction") {
                        color = "#ef4444";
                        label = "Delete";
                      }
                      return (
                        <label
                          key={action}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            fontWeight: 500,
                            fontSize: 15,
                            background: selectedPermissions[perm.id][action]
                              ? color
                              : "#e5e7eb",
                            color: selectedPermissions[perm.id][action]
                              ? "#fff"
                              : "#334155",
                            borderRadius: 6,
                            padding: "6px 14px",
                            cursor: "pointer",
                            boxShadow: selectedPermissions[perm.id][action]
                              ? "0 1px 4px #cbd5e1"
                              : "none",
                            transition: "background 0.2s, color 0.2s",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions[perm.id][action]}
                            onChange={() => handleActionCheck(perm.id, action)}
                            style={{
                              marginRight: 8,
                              accentColor: color,
                              width: 16,
                              height: 16,
                            }}
                          />
                          {label}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Update Permission Modal */}
      <Modal
        open={updateModalOpen}
        onCancel={() => setUpdateModalOpen(false)}
        title="Update Permission"
        destroyOnClose
        width={600}
        footer={null}
      >
        {selectedRolePermission && (
          <div>
            <h4 style={{ marginBottom: 12 }}>
              {selectedRolePermission.permission?.resource ||
                selectedRolePermission.permissionId}
            </h4>
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                maxHeight: 120,
                overflowY: "auto",
              }}
            >
              {Object.keys(updateActions).map((action) => {
                let color = "#e5e7eb",
                  label = "";
                if (action === "createAction") {
                  color = "#22c55e";
                  label = "Create";
                }
                if (action === "readAction") {
                  color = "#3b82f6";
                  label = "Read";
                }
                if (action === "updateAction") {
                  color = "#f59e42";
                  label = "Update";
                }
                if (action === "deleteAction") {
                  color = "#ef4444";
                  label = "Delete";
                }
                return (
                  <label
                    key={action}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      fontWeight: 500,
                      fontSize: 15,
                      background: updateActions[action] ? color : "#e5e7eb",
                      color: updateActions[action] ? "#fff" : "#334155",
                      borderRadius: 6,
                      padding: "6px 14px",
                      cursor: "pointer",
                      boxShadow: updateActions[action]
                        ? "0 1px 4px #cbd5e1"
                        : "none",
                      transition: "background 0.2s, color 0.2s",
                      marginBottom: 8,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={updateActions[action]}
                      onChange={() => handleUpdateActionCheck(action)}
                      style={{
                        marginRight: 8,
                        accentColor: color,
                        width: 16,
                        height: 16,
                      }}
                    />
                    {label}
                  </label>
                );
              })}
            </div>
            <div style={{ marginTop: 24, textAlign: "right" }}>
              <Button
                type="primary"
                onClick={handleUpdatePermission}
                loading={updatePermissionLoading}
                style={{ minWidth: 100 }}
              >
                {updatePermissionLoading ? (
                  <span>
                    <span
                      className="ant-spin-dot ant-spin-dot-spin"
                      style={{ marginRight: 8 }}
                    >
                      <i className="ant-spin-dot-item" />
                      <i className="ant-spin-dot-item" />
                      <i className="ant-spin-dot-item" />
                      <i className="ant-spin-dot-item" />
                    </span>
                    Updating...
                  </span>
                ) : (
                  "Update"
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Remove Permission Modal */}
      <Modal
        open={removeModalOpen}
        onCancel={() => setRemoveModalOpen(false)}
        title="Remove Permission"
        okText={
          removePermissionLoading ? (
            <span>
              <span
                className="ant-spin-dot ant-spin-dot-spin"
                style={{ marginRight: 8 }}
              >
                <i className="ant-spin-dot-item" />
                <i className="ant-spin-dot-item" />
                <i className="ant-spin-dot-item" />
                <i className="ant-spin-dot-item" />
              </span>
              Removing...
            </span>
          ) : (
            "Remove"
          )
        }
        onOk={handleRemovePermission}
        confirmLoading={removePermissionLoading}
        destroyOnClose
        width={350}
      >
        {selectedRolePermission && (
          <div>
            <h4 style={{ marginBottom: 12 }}>
              Are you sure you want to remove permission{" "}
              <b>
                {selectedRolePermission.permission?.resource ||
                  selectedRolePermission.permissionId}
              </b>
              ?
            </h4>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RoleList;

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
import { PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined } from "@ant-design/icons";
import CommonTable from "../../components/commons/CommonTable";
import {
  Page,
  PageHeader,
  Btn,
  ReloadBtn,
  StatsStrip,
  TableCard,
  ThumbCell,
  TwoLine,
  RowMenu,
  actionColumn,
  EmptyState,
} from "../../components/modern/ModernUI";
import { shortDate, shortTime } from "../../utils/dateFormat";
import PermissionService from "./PermissionService";
import { formatReadableDate } from "../../utils/date_currency_formatter";
import CommonCard from "../../components/commons/CommonCard";
import { Pagination } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  updateVehicleTypesState,
  permissionsPage,
  permissionsLimit,
  permissionsSearchText,
} from "./PermissionRedux";
import CommonCardSkeleton from "../../components/commons/CommonSkeleton";

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
        // add formatted fields for display
        const mapped = (res.data || []).map((it) => ({
          ...it,
          createdAtFormatted: it.createdAt
            ? formatReadableDate(it.createdAt)
            : "-",
        }));
        setData(mapped);
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

  const rowItems = [
    { key: "edit", icon: <EditOutlined />, label: "Edit permission" },
    { type: "divider" },
    { key: "delete", icon: <DeleteOutlined />, label: "Delete", danger: true },
  ];
  const onMenu = ({ key }, record) => {
    if (key === "edit") openEdit(record);
    if (key === "delete")
      Modal.confirm({
        title: "Delete this permission?",
        content: "Roles that use it will lose access to this resource.",
        okText: "Delete",
        okButtonProps: { danger: true },
        onOk: () => handleDelete(record.id),
      });
  };

  const columns = [
    {
      title: "Resource",
      dataIndex: "resource",
      render: (text, r) => (
        <ThumbCell
          icon={<LockOutlined />}
          title={text}
          sub={`#${((page || 1) - 1) * (limit || PAGE_SIZE) + data.indexOf(r) + 1}`}
        />
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (text) =>
        text ? (
          <span style={{ whiteSpace: "normal", display: "block", maxWidth: 420, color: "var(--c-text-2)" }}>{text}</span>
        ) : (
          <span className="mp-muted">No description</span>
        ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      render: (d) => <TwoLine main={shortDate(d)} sub={shortTime(d)} />,
    },
    actionColumn((_, r) => <RowMenu items={rowItems} record={r} onClick={onMenu} />),
  ];

  const onPage = (p, ps) => {
    dispatch(updateVehicleTypesState({ page: p, limit: ps }));
    fetchList({ page: p, limit: ps, searchText });
  };

  useEffect(() => {
    dispatch(
      updateVehicleTypesState({ page: page || 1, limit: limit || PAGE_SIZE })
    );
    fetchList();
  }, [page, limit, searchText]);

  return (
    <Page>
      <PageHeader
        eyebrow="Access & settings"
        title="Permissions"
        subtitle="Resources that roles can be granted access to."
        actions={
          <>
            <ReloadBtn
              loading={loading}
              onClick={() => {
                dispatch(updateVehicleTypesState({ page: 1 }));
                fetchList({ page: 1, limit: limit || PAGE_SIZE, searchText });
              }}
            />
            <Btn variant="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add permission
            </Btn>
          </>
        }
      />

      <StatsStrip
        items={[
          { label: "Total permissions", value: total || 0, note: "Defined resources", color: "#09234c" },
          { label: "With description", value: data.filter((d) => d.description).length, note: "On this page", color: "#059669" },
          { label: "Missing description", value: data.filter((d) => !d.description).length, note: "On this page", color: "#d97706" },
        ]}
      />

      <TableCard
        search={{ value: searchText, onChange: handleSearchChange, placeholder: "Search resources" }}
        resultLabel={`${total || 0} permissions`}
      >
        <div className="hidden md:block">
          <CommonTable
            rowKey="id"
            columns={columns}
            data={data}
            loadding={loading}
            total={total}
            currentPage={page || 1}
            pageSize={limit || PAGE_SIZE}
            handlePagination={onPage}
            unit="permissions"
          />
        </div>

        <div className="block md:hidden mp-mlist">
          {loading && Array(4).fill(1).map((_, i) => <CommonCardSkeleton key={i} />)}
          {!loading && data && data.length > 0
            ? data.map((rec) => (
                <CommonCard
                  key={rec.id}
                  item={rec}
                  title="resource"
                  fieldMap={{ description: "Description", createdAtFormatted: "Created" }}
                  actionItems={rowItems}
                  onActionClick={(info, item) => info && onMenu(info, item)}
                />
              ))
            : !loading && <EmptyState title="No permissions found" />}
          <div className="my-4 flex justify-center">
            <Pagination current={page} pageSize={limit || PAGE_SIZE} total={total} onChange={onPage} size="small" />
          </div>
        </div>
      </TableCard>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        title={editing ? "Edit permission" : "New permission"}
        okText={editing ? "Save changes" : "Create permission"}
        onOk={handleSubmit}
        confirmLoading={submitting}
        destroyOnClose
        className="mp-modal"
      >
        <Form form={form} layout="vertical" preserve={false} style={{ marginTop: 12 }}>
          <Form.Item
            name="resource"
            label="Resource"
            extra="The name used in code, e.g. Booking, Car, Role."
            rules={[{ required: true, message: "Resource is required" }]}
          >
            <Input placeholder="e.g. Role" autoFocus />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="What does this permission allow?" />
          </Form.Item>
        </Form>
      </Modal>
    </Page>
  );
};

export default PermissionList;

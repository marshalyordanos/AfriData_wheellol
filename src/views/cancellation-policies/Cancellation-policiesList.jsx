import React, { useEffect, useRef, useState } from "react";
import CommonTable from "../../components/commons/CommonTable";
import { MoreOutlined, ReloadOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Dropdown,
  Input,
  Modal,
  Tag,
  Space,
  Form,
  Select,
  message,
} from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCancellationPolicies,
  deleteCancellationPolicy,
  createCancellationPolicy,
  updateCancellationPolicy,
  fetchCancellationPolicyById,
  selectCancellationPolicies,
  selectCancellationPagination,
  selectCancellationLoading,
  setQuery,
} from "./Cancellation-policiesRedux";

const CancellationPoliciesList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const delayRef = useRef(null);
  const dispatch = useDispatch();

  const policies = useSelector(selectCancellationPolicies) || [];
  const pagination = useSelector(selectCancellationPagination) || {};
  const loading = useSelector(selectCancellationLoading);
  const policyDetails = useSelector((s) => s.cancellationPolicies.policy);
  const modalLoading = useSelector(selectCancellationLoading);
  const queryState = useSelector((s) => s.cancellationPolicies.query || {});

  const [searchText, setSearchText] = useState(queryState.searchText || "");
  const [selection, setSelection] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const getPaginationInfo = () => [
    Number(searchParams.get("page") || 1),
    Number(searchParams.get("limit") || 10),
  ];

  useEffect(() => {
    const [pg, lm] = getPaginationInfo();
    // initialize redux query
    dispatch(setQuery({ page: pg, limit: lm, searchText: searchText }));
    dispatch(
      fetchCancellationPolicies({
        page: pg,
        pageSize: lm,
        searchText: searchText,
      })
    );
  }, []);

  const searchHandler = (e) => {
    const v = e.target.value;
    setSearchText(v);
    clearTimeout(delayRef.current);
    delayRef.current = setTimeout(() => {
      const [pg, lm] = getPaginationInfo();
      setSearchParams({ page: 1, limit: lm });
      dispatch(setQuery({ page: 1, limit: lm, searchText: v }));
      dispatch(
        fetchCancellationPolicies({ page: 1, pageSize: lm, searchText: v })
      );
    }, 500);
  };

  const handlePagination = (p, ps) => {
    setSearchParams({ page: p, limit: ps });
    dispatch(setQuery({ page: p, limit: ps }));
    dispatch(fetchCancellationPolicies({ page: p, pageSize: ps, searchText }));
  };

  const handleAction = (key, record) => {
    const id = record?.id || record?._id;
    if (!id) return;
    if (key === "update") {
      // open modal and load current policy
      setEditingId(id);
      setIsModalVisible(true);
      dispatch(fetchCancellationPolicyById(id));
      return;
    }
    if (key === "delete") {
      Modal.confirm({
        title: "Delete policy",
        content: "Are you sure you want to delete this cancellation policy?",
        onOk: async () => {
          try {
            const res = await dispatch(deleteCancellationPolicy(id)).unwrap();
            const serverMsg =
              res?.message || res?.data?.message || "Deleted successfully";
            message.success(serverMsg);
            const [pg, lm] = getPaginationInfo();
            dispatch(
              fetchCancellationPolicies({ page: pg, pageSize: lm, searchText })
            );
          } catch (err) {
            const errMsg =
              err?.message || err?.data?.message || "Delete failed";
            message.error(errMsg);
            console.error(err);
          }
        },
      });
      return;
    }
  };

  useEffect(() => {
    // when policyDetails loads, populate the form
    if (
      policyDetails &&
      (policyDetails.id === editingId || policyDetails._id === editingId)
    ) {
      form.setFieldsValue({
        userType: policyDetails.userType || "",
        daysBeforeTrip: policyDetails.daysBeforeTrip ?? "",
        refundPercent: policyDetails.refundPercent ?? "",
        status: policyDetails.status || "",
      });
    }
  }, [policyDetails, editingId, form]);

  const onFinish = async (values) => {
    try {
      // Convert numeric fields to integers
      const formattedValues = {
        ...values,
        daysBeforeTrip: parseInt(values.daysBeforeTrip, 10),
        refundPercent: parseInt(values.refundPercent, 10),
      };

      // dispatch and unwrap to get server payload
      let res;
      try {
        setSaving(true);
        if (editingId) {
          res = await dispatch(
            updateCancellationPolicy({ id: editingId, data: formattedValues })
          ).unwrap();
        } else {
          res = await dispatch(
            createCancellationPolicy(formattedValues)
          ).unwrap();
        }
        const serverMsg =
          res?.message || res?.data?.message || "Saved successfully";
        message.success(serverMsg);
      } finally {
        setSaving(false);
      }

      // refresh list and close modal
      const [pg, lm] = getPaginationInfo();
      dispatch(
        fetchCancellationPolicies({ page: pg, pageSize: lm, searchText })
      );
      setIsModalVisible(false);
      setEditingId(null);
      form.resetFields();
    } catch (err) {
      const errMsg = err?.message || err?.data?.message || "Save failed";
      message.error(errMsg);
      console.error("Save failed:", err);
    }
  };

  const columns = [
    {
      title: " ",
      dataIndex: "action",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              { key: "update", label: <Button type="text">Update</Button> },
              { key: "delete", label: <Button type="text">Delete</Button> },
            ],
            onClick: (info) => handleAction(info.key, record),
          }}
          trigger={["click"]}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
    { title: "User Type", dataIndex: "userType", key: "userType" },
    {
      title: "Days Before Trip",
      dataIndex: "daysBeforeTrip",
      key: "daysBeforeTrip",
    },
    {
      title: "Refund Percent",
      dataIndex: "refundPercent",
      key: "refundPercent",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (d) => (d ? new Date(d).toLocaleString() : "-"),
    },
  ];

  const handleReload = () => {
    const [pg, lm] = getPaginationInfo();
    dispatch(setQuery({ page: pg, limit: lm }));
    dispatch(fetchCancellationPolicies({ page: pg, pageSize: lm, searchText }));
  };

  const tableChange = (paginationObj, filters, sorter) => {
    const [p, ps] = [paginationObj.current, paginationObj.pageSize];
    const sortField = sorter.field;
    const sortOrder = sorter.order;
    const order =
      sortOrder === "ascend"
        ? "asc"
        : sortOrder === "descend"
        ? "desc"
        : undefined;
    dispatch(setQuery({ page: p, limit: ps, sort: sortField, order }));
    dispatch(
      fetchCancellationPolicies({
        page: p,
        pageSize: ps,
        searchText,
        sort: sortField,
        order,
      })
    );
  };

  return (
    <div>
      <span className="flex md:flex-row flex-col justify-between items-start md:items-end borde border-rose-700">
        <div className="flex flex-col p-6 md:w-[45vw] w-full">
          <h1 className="text-2xl font-bold pb-4">Cancellation Policies</h1>
          <div className="flex">
            <Input
              onChange={searchHandler}
              placeholder="Search"
              value={searchText}
              allowClear
              style={{ borderRadius: "0px 0px 0px 0px" }}
              className=" drop-shadow-sm rounded-r  py-2"
            />
          </div>
        </div>
        <span className="flex ml-6 mb-6 md:mr-6">
          <button
            onClick={handleReload}
            className="
             border border-[var(--color-primary)] py-2 px-3
             text-[var(--color-primary)] rounded mr-4 flex items-center justify-center"
          >
            <ReloadOutlined className=" boder boder-red-900" />
          </button>

          <button
            className="px-4  py-2 border border-[var(--color-primary)] 
            text-white bg-[var(--color-primary)] rounded"
            onClick={() => {
              // open create modal
              setEditingId(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
          >
            <span className="flex flex-row">
              <PlusOutlined />
              <p className="pl-2">Add Policy</p>
            </span>
          </button>
        </span>
      </span>

      {/* Edit modal for updating a cancellation policy */}
      <Modal
        title={
          editingId
            ? "Update Cancellation Policy"
            : "Create Cancellation Policy"
        }
        visible={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingId(null);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Form.Item
            label="User Type"
            name="userType"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="HOST">HOST</Select.Option>
              <Select.Option value="GUEST">GUEST</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Days Before Trip"
            name="daysBeforeTrip"
            rules={[{ required: true }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            label="Refund Percent"
            name="refundPercent"
            rules={[{ required: true }]}
          >
            <Input type="number" />
          </Form.Item>
          {/* Status removed per request */}
          <Form.Item>
            <Space>
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  setEditingId(null);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                Save
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <CommonTable
        rowSelectionType={"checkbox"}
        data={policies}
        columns={columns}
        setSelection={setSelection}
        handlePagination={handlePagination}
        total={pagination.total || 0}
        loadding={loading}
        tableChange={tableChange}
        rowKey={(r) => r?.id || r?._id}
        currentPage={Number(pagination.page) || 1}
        pageSize={Number(pagination.pageSize) || 10}
        onRow={(record) => ({
          style: { cursor: "default" },
        })}
      />
    </div>
  );
};

export default CancellationPoliciesList;

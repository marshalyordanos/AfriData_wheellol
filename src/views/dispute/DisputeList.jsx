import React, { useEffect, useRef, useState } from "react";
import {
  Input,
  Button,
  Tag,
  Dropdown,
  Modal,
  message,
  Select,
  DatePicker,
  Form,
  InputNumber,
} from "antd";
import { ReloadOutlined, MoreOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";

import CommonTable from "../../components/commons/CommonTable";
import DisputeService from "./DisputeService";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser } from "../../redux/auth/authSlice";
import {
  fetchDisputesThunk,
  updateDisputeState,
  disputeQuery,
  disputeList,
} from "./DisputetRedux";

const { confirm } = Modal;

const DisputeList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const delayTimerRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const query = useSelector(disputeQuery);
  const disputesFromStore = useSelector(disputeList);

  const [loading, setLoading] = useState(false);
  const [disputes, setDisputes] = useState([]);
  const [total, setTotal] = useState(0);
  const [localSearch, setLocalSearch] = useState("");
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolveRecord, setResolveRecord] = useState(null);
  const [resolveForm] = Form.useForm();

  const authUser = useSelector(selectCurrentUser);
  const currentUserId = authUser?.user?.id || authUser?.id || null;

  const getPaginationInfo = () => [
    Number(searchParams.get("page") || 1),
    Number(searchParams.get("limit") || 10),
  ];

  const loadDisputes = async (overrides = {}) => {
    setLoading(true);
    try {
      const params = { ...query, ...overrides };
      const { payload } = await dispatch(fetchDisputesThunk(params));
      const list = payload?.data || [];
      setDisputes(list);
      setTotal(
        payload?.pagination?.total || payload?.total || list.length || 0
      );
    } catch (err) {
      console.error(err);
      message.error("Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const [pg, lm] = getPaginationInfo();
    dispatch(updateDisputeState({ page: pg, limit: lm }));
    loadDisputes({ page: pg, limit: lm });
  }, []);

  const handleSearch = (e) => {
    const v = e.target.value;
    setLocalSearch(v);
    clearTimeout(delayTimerRef.current);
    delayTimerRef.current = setTimeout(() => {
      const [pg, lm] = getPaginationInfo();
      dispatch(updateDisputeState({ page: 1, limit: lm, searchText: v || "" }));
      loadDisputes({ page: 1, limit: lm, searchText: v || "" });
    }, 500);
  };

  const handlePagination = (pg, pageSize) => {
    setSearchParams({ page: pg, limit: pageSize });
    dispatch(updateDisputeState({ page: pg, limit: pageSize }));
    loadDisputes({ page: pg, limit: pageSize });
  };

  const confirmAndRun = (title, fn) => {
    confirm({
      title,
      onOk: fn,
      onCancel() {},
    });
  };

  const handleAction = async (action, record) => {
    const id = record.id || record._id;
    if (!id) return;
    if (action === "review") {
      confirmAndRun("Mark dispute as UNDER_REVIEW?", async () => {
        try {
          await DisputeService.reviewDispute({}, id);
          message.success("Dispute marked UNDER_REVIEW");
          loadDisputes({
            page: getPaginationInfo()[0],
            limit: getPaginationInfo()[1],
          });
        } catch (err) {
          console.error(err);
          message.error("Operation failed");
        }
      });
      return;
    }

    if (action === "resolve") {
      // open resolve modal with default refund amount
      setResolveRecord(record);
      resolveForm.setFieldsValue({
        refundAmount: record?.payment?.amount || 0,
        notes: "",
      });
      setResolveModalVisible(true);
      return;
    }

    if (action === "reject") {
      confirmAndRun("Reject dispute?", async () => {
        try {
          await DisputeService.rejectDispute({}, id);
          message.success("Dispute rejected");
          loadDisputes({
            page: getPaginationInfo()[0],
            limit: getPaginationInfo()[1],
          });
        } catch (err) {
          console.error(err);
          message.error("Operation failed");
        }
      });
      return;
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
              { key: "review", label: <Button type="text">Review</Button> },
              { key: "resolve", label: <Button type="text">Resolve</Button> },
              { key: "reject", label: <Button type="text">Reject</Button> },
            ],
            onClick: (info) => {
              try {
                info.domEvent.stopPropagation();
              } catch (e) {}
              handleAction(info.key, record);
            },
          }}
          trigger={["click"]}
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
    {
      title: "Booking ID",
      dataIndex: ["booking", "id"],
      key: "bookingId",
      render: (_, r) => r.booking?.id || r.bookingId || "-",
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      render: (t) => t || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s) => {
        if (!s) return "-";
        const st = String(s).toLowerCase();
        let color = "default";
        if (st.includes("open") || st.includes("under_review"))
          color = "orange";
        else if (st.includes("resolved")) color = "green";
        else if (st.includes("rejected")) color = "red";
        return <Tag color={color}>{s}</Tag>;
      },
    },
    {
      title: "Amount",
      dataIndex: ["payment", "amount"],
      key: "amount",
      render: (a, r) => (a ? `${a} ${r.payment?.currency || ""}` : "-"),
    },
    {
      title: "Payment Status",
      dataIndex: ["payment", "status"],
      key: "paymentStatus",
      render: (s) => (s ? <Tag>{s}</Tag> : "-"),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (d) => (d ? new Date(d).toLocaleString() : "-"),
    },
  ];

  return (
    <div>
      <div className="flex md:flex-row flex-col justify-between items-start md:items-end p-6">
        <div className="flex flex-col md:w-[45vw] w-full">
          <h1 className="text-2xl font-bold pb-4">Disputes</h1>
          <div className="flex gap-3 flex-wrap items-center">
            <Input
              placeholder="Search"
              value={localSearch}
              onChange={handleSearch}
              allowClear
              style={{ borderRadius: "0px 0px 0px 0px" }}
              className=" drop-shadow-sm rounded-r  py-2"
            />

            <Select
              placeholder="Status"
              allowClear
              style={{ width: 160 }}
              onChange={(v) => {
                const filter = v ? { status: v } : {};
                dispatch(updateDisputeState({ page: 1, filter }));
                loadDisputes({ page: 1, filter });
              }}
            >
              <Select.Option value="OPEN">OPEN</Select.Option>
              <Select.Option value="UNDER_REVIEW">UNDER_REVIEW</Select.Option>
              <Select.Option value="RESOLVED">RESOLVED</Select.Option>
              <Select.Option value="REJECTED">REJECTED</Select.Option>
            </Select>

            <DatePicker.RangePicker
              onChange={(dates) => {
                const filter = {};
                if (dates && dates.length === 2) {
                  filter.startDate = dates[0].toISOString();
                  filter.endDate = dates[1].toISOString();
                }
                dispatch(updateDisputeState({ page: 1, filter }));
                loadDisputes({ page: 1, filter });
              }}
            />
          </div>
        </div>
        <div className="flex items-center mt-4 md:mt-0">
          <button
            onClick={() => {
              const [pg, lm] = getPaginationInfo();
              loadDisputes({ page: pg, limit: lm });
              setSearchParams({ page: pg, limit: lm });
            }}
            className="border border-[var(--color-primary)] py-2 px-3 text-[var(--color-primary)] rounded mr-4"
          >
            <ReloadOutlined />
          </button>
        </div>
      </div>

      <CommonTable
        data={disputes}
        columns={columns}
        total={total}
        loading={loading}
        currentPage={query.page}
        pageSize={query.limit}
        rowKey={(r) => r?.id}
        handlePagination={(p, ps) => handlePagination(p, ps)}
        onRow={(record) => ({
          onClick: () => {
            const id = record.id || record._id;
            if (id) navigate(`/dash/disputes/${id}`, { state: record });
          },
          style: { cursor: "pointer" },
        })}
      />
      {/* Resolve Modal */}
      <Modal
        title="Resolve Dispute"
        open={resolveModalVisible}
        onCancel={() => setResolveModalVisible(false)}
        onOk={async () => {
          try {
            const values = await resolveForm.validateFields();
            const payload = {
              adminId: currentUserId,
              refundAmount: values.refundAmount || 0,
              notes: values.notes || "",
            };
            const id = resolveRecord?.id || resolveRecord?._id;
            if (!id) {
              message.error("Invalid dispute selected");
              return;
            }
            await DisputeService.resolveDispute(payload, id);
            message.success("Dispute resolved");
            setResolveModalVisible(false);
            // reload
            const [pg, lm] = getPaginationInfo();
            loadDisputes({ page: pg, limit: lm });
          } catch (err) {
            console.error(err);
            message.error("Operation failed");
          }
        }}
        okText="Resolve"
      >
        <Form form={resolveForm} layout="vertical">
          <Form.Item label="Refund Amount" name="refundAmount">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DisputeList;

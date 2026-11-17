import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Dropdown,
  Input,
  message,
  Modal,
  Select,
  Tag,
  Pagination,
} from "antd";
import RolesService from "../roles/RoleService";
import {
  PlusOutlined,
  EditOutlined,
  SafetyOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {
  Page,
  PageHeader,
  Btn,
  ReloadBtn,
  StatsStrip,
  TableCard,
  PersonCell,
  StatusPill,
  ActivePill,
  TwoLine,
  RowMenu,
  actionColumn,
  EmptyState,
  prettyStatus,
} from "../../components/modern/ModernUI";
import { shortDate, shortTime } from "../../utils/dateFormat";
import CommonTable from "../../components/commons/CommonTable";
import CommonCard from "../../components/commons/CommonCard";
import CommonModal from "../../components/commons/CommonModel";
import StaffService from "./StaffService";
import StaffEdit from "./StaffEdit";
import StaffAddEdit from "./StaffAddEdit";
import { useDispatch, useSelector } from "react-redux";
import { searchStaff, updateStaffState, staffSearchText } from "./StaffRedux";
import { useSearchParams, useNavigate } from "react-router-dom";
import CommonCardSkeleton from "../../components/commons/CommonSkeleton";

const StaffList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const searchText = useSelector(staffSearchText);
  const page = useSelector((state) => state.staff.query.page);
  const limit = useSelector((state) => state.staff.query.limit);
  const [staffData, setStaffData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modeID, setModeID] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const delayTimerRef = useRef(null);

  const getPaginationInfo = () => [
    searchParams.get("page") || 1,
    searchParams.get("limit") || 10,
  ];

  useEffect(() => {
    const [page, limit] = getPaginationInfo();
    dispatch(updateStaffState({ page, limit }));
    searchData();
  }, []);

  async function searchData(val = "") {
    try {
      setLoading(true);
      const { payload } = await dispatch(searchStaff(val));
      setStaffData(payload.data);
      setTotal(payload.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handlePagination = async (p, pageSize) => {
    dispatch(updateStaffState({ page: p, limit: pageSize }));
    await searchData();
  };

  const searchHandler = (e) => {
    const { value } = e.target;
    const [page, limit] = getPaginationInfo();
    dispatch(updateStaffState({ page, limit, searchText: value }));
    clearTimeout(delayTimerRef.current);
    delayTimerRef.current = setTimeout(() => {
      searchData(value);
    }, 500);
  };

  const handleReload = () => searchData();

  const handleToggleActive = async (id, isActive) => {
    try {
      setLoading(true);
      let res;
      if (isActive) {
        res = await StaffService.deactivateStaff(id);
      } else {
        res = await StaffService.activateStaff(id);
      }
      message.success(res?.message || "Staff status updated successfully");
      searchData();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to change staff active status";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const items = (record) => [
    { key: "edit", icon: <EditOutlined />, label: "Edit details" },
    { key: "assignRole", icon: <SafetyOutlined />, label: "Assign role" },
    { type: "divider" },
    {
      key: "toggleActive",
      icon: record.isActive ? <StopOutlined /> : <CheckCircleOutlined />,
      label: record.isActive ? "Deactivate" : "Activate",
      danger: !!record.isActive,
    },
  ];

  const onClick = ({ key, domEvent }, record) => {
    domEvent?.stopPropagation();
    const id = record?._id || record?.id;
    setModeID(id);
    setSelectedRecord(record);
    if (key === "edit") return setIsModalOpen(true);
    if (key === "assignRole") {
      setAssignModalOpen(true);
      fetchRoles();
      return;
    }
    if (key === "toggleActive") handleToggleActive(id, record.isActive);
  };

  const openDetails = (record) => {
    const id = record?._id || record?.id;
    if (id) navigate(`/dash/staff/details/${id}`, { state: record });
  };

  const columns = [
    {
      title: "Staff member",
      dataIndex: "firstName",
      key: "firstName",
      sorter: true,
      render: (_, r) => <PersonCell person={r} sub={r.email} />,
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      sorter: true,
      render: (v) => v || <span className="mp-muted">—</span>,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) =>
        role?.name ? <StatusPill tone="violet">{prettyStatus(role.name)}</StatusPill> : <span className="mp-muted">No role</span>,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      sorter: true,
      render: (v) => <ActivePill active={v} />,
    },
    {
      title: "Joined",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: true,
      render: (d) => <TwoLine main={shortDate(d)} sub={shortTime(d)} />,
    },
    actionColumn((_, r) => <RowMenu items={items(r)} record={r} onClick={onClick} />),
  ];

  // handle table sort and pagination
  const tableChange = (pagination, filters, sorter) => {
    let sortField = sorter.field;
    let sortOrder = sorter.order;
    let order =
      sortOrder === "ascend"
        ? "asc"
        : sortOrder === "descend"
        ? "desc"
        : undefined;
    const [page, limit] = [pagination.current, pagination.pageSize];
    dispatch(updateStaffState({ page, limit, sort: sortField, order }));
    searchData();
  };

  const fetchRoles = async () => {
    try {
      const res = await RolesService.search({ page: 1, limit: 100 });
      setRoles(res.data || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to load roles");
    }
  };

  const handleAssignRole = async () => {
    if (!selectedRoleId || !modeID) {
      message.error("Select a role first");
      return;
    }
    try {
      setAssignSubmitting(true);
      const payload = { userId: modeID, roleId: selectedRoleId };
      const res = await StaffService.assignRoleToStaff(payload);
      message.success(res?.message || "Role assigned successfully");
      setAssignModalOpen(false);
      setSelectedRoleId(null);
      searchData();
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message || "Failed to assign role");
    } finally {
      setAssignSubmitting(false);
    }
  };

  const activeCount = (staffData || []).filter((s) => s.isActive).length;
  const rolesInUse = new Set((staffData || []).map((s) => s.role?.name).filter(Boolean)).size;

  return (
    <Page>
      {isModalOpen && (
        <CommonModal
          width={1000}
          isModalOpen={isModalOpen}
          setIsModalOpen={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setSelectedRecord(null);
              setModeID("");
            }
          }}
        >
          {modeID === "" ? (
            <StaffAddEdit
              key={"staff-add"}
              searchData={searchData}
              setMode={setModeID}
              mode={modeID}
              isModelOpen={isModalOpen}
              setIsModalOpen={setIsModalOpen}
            />
          ) : (
            <StaffEdit
              key={modeID || "staff-edit"}
              userData={
                selectedRecord || staffData.find((u) => u._id === modeID) || {}
              }
              searchData={searchData}
              setMode={setModeID}
              mode={modeID}
              isModelOpen={isModalOpen}
              setIsModalOpen={setIsModalOpen}
            />
          )}
        </CommonModal>
      )}

      <Modal
        title={`Assign Role${
          selectedRecord ? " to " + (selectedRecord.firstName || "") : ""
        }`}
        open={assignModalOpen}
        onCancel={() => {
          setAssignModalOpen(false);
          setSelectedRoleId(null);
        }}
        onOk={handleAssignRole}
        okText="Assign"
        confirmLoading={assignSubmitting}
      >
        <div>
          <Select
            style={{ width: "100%" }}
            placeholder="Select a role"
            value={selectedRoleId}
            onChange={(v) => setSelectedRoleId(v)}
          >
            {roles.map((r) => (
              <Select.Option key={r.id || r._id} value={r.id || r._id}>
                {r.name}
              </Select.Option>
            ))}
          </Select>
        </div>
      </Modal>

      <PageHeader
        eyebrow="People"
        title="Staff"
        subtitle="Admins and operators who manage the platform."
        actions={
          <>
            <ReloadBtn onClick={handleReload} loading={loading} />
            <Btn
              variant="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setIsModalOpen(true);
                setModeID("");
              }}
            >
              Add staff
            </Btn>
          </>
        }
      />

      <StatsStrip
        items={[
          { label: "Total staff", value: total || 0, note: "All accounts", color: "#09234c" },
          { label: "Active", value: activeCount, note: "On this page", color: "#059669" },
          { label: "Inactive", value: staffData.length - activeCount, note: "On this page", color: "#94a3b8" },
          { label: "Roles in use", value: rolesInUse, note: "On this page", color: "#fc6b38" },
        ]}
      />

      <TableCard
        search={{ value: searchText, onChange: searchHandler, placeholder: "Search by name, email or phone" }}
        resultLabel={`${total || 0} staff`}
      >
        <div className="hidden md:block">
          <CommonTable
            data={staffData}
            columns={columns}
            total={total}
            loadding={loading}
            rowKey={(r) => r?._id || r?.id}
            tableChange={tableChange}
            handlePagination={handlePagination}
            currentPage={parseInt(page) || 1}
            pageSize={parseInt(limit) || 10}
            unit="staff"
            onRow={(r) => ({ onClick: () => openDetails(r), style: { cursor: "pointer" } })}
          />
        </div>

        <div className="block md:hidden mp-mlist">
          {loading && Array(4).fill(1).map((_, i) => <CommonCardSkeleton key={i} />)}
          {!loading && staffData && staffData.length > 0
            ? staffData.map((s) => (
                <CommonCard
                  key={s?._id || s?.id}
                  item={s}
                  title={["firstName", "lastName"]}
                  fieldMap={{ email: "Email", phone: "Phone", "role.name": "Role", isActive: "Status" }}
                  actionItems={items(s)}
                  onActionClick={onClick}
                  onCardClick={openDetails}
                />
              ))
            : !loading && <EmptyState title="No staff found" text="Try a different search." />}
          <div className="my-4 flex justify-center">
            <Pagination
              current={parseInt(page) || 1}
              pageSize={parseInt(limit) || 10}
              total={total}
              onChange={handlePagination}
              size="small"
            />
          </div>
        </div>
      </TableCard>
    </Page>
  );
};

export default StaffList;

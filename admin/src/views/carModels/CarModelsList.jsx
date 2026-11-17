// src/views/car-models/CarModelsList.jsx
import React, { useEffect, useState } from "react";
import {
  Button,
  Input,
  Tooltip,
  Card,
  Tag,
  Collapse,
  Empty,
  message,
  Spin,
  Pagination,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, CarOutlined } from "@ant-design/icons";
import CommonTable from "../../components/commons/CommonTable";
import {
  Page,
  PageHeader,
  Btn,
  ReloadBtn,
  StatsStrip,
  TableCard,
  ThumbCell,
  ActivePill,
  TwoLine,
  RowMenu,
  actionColumn,
  EmptyState,
} from "../../components/modern/ModernUI";
import { shortDate, shortTime } from "../../utils/dateFormat";
import { useNavigate } from "react-router-dom";
import CommonModal from "../../components/commons/CommonModel";
import CommonDeleteModal from "../../components/commons/CommonDeleteModal";
import CarModelsEdit from "./CarModelsEdit";
import CarModelsService from "./CarModelsService";

const { Panel } = Collapse;

const CarModelsList = () => {
  const [models, setModels] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState(null);
  const [openModalFor, setOpenModalFor] = useState(null);
  const [brands, setBrands] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();
  const [brandTab, setBrandTab] = useState("__all");

  // ============================
  // FETCH MODELS
  // ============================
  // fetchData accepts optional page/limit overrides so callers can force a specific page
  const fetchData = async (pageArg = page, limitArg = limit) => {
    try {
      setLoading(true);
      const res = await CarModelsService.searchModels({
        page: pageArg,
        limit: limitArg,
        searchText: searchText,
      });

      const list = res?.data || [];
      setModels(list);
      setTotal(res?.total || 0);
      setPage(pageArg);
      setLimit(limitArg);

      // Group by brand name
      const groupedData = list.reduce((acc, model) => {
        const brandName = model.make?.name || "Unknown Brand";
        acc[brandName] = acc[brandName] || [];
        acc[brandName].push(model);
        return acc;
      }, {});
      setGrouped(groupedData);
    } catch (error) {
      console.error(error);
      message.error("Failed to load car models");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load
    fetchData(1, limit);
    // prefetch brands so Add modal can render immediately
    (async () => {
      try {
        const b = await CarModelsService.fetchAllBrands("");
        setBrands(b || []);
      } catch (err) {
        console.error("Failed to prefetch brands", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================
  // DELETE MODEL
  // ============================
  const confirmDelete = (model) => {
    setDeleteTarget(model);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setLoading(true);
      await CarModelsService.deleteModel(deleteTarget.id);
      message.success("Model deleted successfully");
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      message.error("Failed to delete model");
    } finally {
      setLoading(false);
      setDeleteTarget(null);
    }
  };

  // ============================
  // SEARCH FILTER
  // ============================
  const filteredGroups = Object.entries(grouped).reduce(
    (acc, [brand, brandModels]) => {
      const filtered = brandModels.filter(
        (m) =>
          m.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (m.make?.name || "").toLowerCase().includes(searchText.toLowerCase())
      );
      if (filtered.length) acc[brand] = filtered;
      return acc;
    },
    {}
  );

  // ============================
  // MODAL HANDLERS
  // ============================
  const openCreate = () => {
    setEditing(null);
    setOpenModalFor("add");
  };

  const openEdit = (model) => {
    setEditing(model);
    setOpenModalFor("edit");
  };

  // ============================
  // RENDER
  // ============================
  const brandNames = Object.keys(grouped).sort();
  const visible = models.filter((m) => {
    const q = searchText.toLowerCase();
    const okSearch =
      !q || m.name?.toLowerCase().includes(q) || (m.make?.name || "").toLowerCase().includes(q);
    const okBrand = brandTab === "__all" || (m.make?.name || "Unknown Brand") === brandTab;
    return okSearch && okBrand;
  });
  const activeCount = models.filter((m) => m.isActive).length;

  const rowItems = [
    { key: "edit", icon: <EditOutlined />, label: "Edit model" },
    { type: "divider" },
    { key: "delete", icon: <DeleteOutlined />, label: "Delete", danger: true },
  ];
  const onMenu = ({ key }, model) => {
    if (key === "edit") openEdit(model);
    if (key === "delete") confirmDelete(model);
  };

  const columns = [
    {
      title: "Model",
      dataIndex: "name",
      render: (name, m) => (
        <ThumbCell icon={<CarOutlined />} title={name} sub={m.year || m.make?.name} />
      ),
    },
    {
      title: "Brand",
      dataIndex: ["make", "name"],
      render: (v) => v || <span className="mp-muted">—</span>,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (v) => <ActivePill active={v} />,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      render: (d) => <TwoLine main={shortDate(d)} sub={shortTime(d)} />,
    },
    actionColumn((_, m) => <RowMenu items={rowItems} record={m} onClick={onMenu} />),
  ];

  return (
    <Page>
      <PageHeader
        eyebrow="Catalog"
        title="Car models"
        subtitle="Models grouped by brand. Hosts choose from these when listing a car."
        actions={
          <>
            <ReloadBtn onClick={() => fetchData(page, limit)} loading={loading} />
            <Btn variant="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add model
            </Btn>
          </>
        }
      />

      <StatsStrip
        items={[
          { label: "Total models", value: total || 0, note: "In the catalog", color: "#09234c" },
          { label: "Brands", value: brandNames.length, note: "On this page", color: "#fc6b38" },
          { label: "Active", value: activeCount, note: "On this page", color: "#059669" },
          { label: "Inactive", value: models.length - activeCount, note: "On this page", color: "#94a3b8" },
        ]}
      />

      <TableCard
        tabs={[
          { key: "__all", label: "All brands", count: models.length },
          ...brandNames.map((b) => ({ key: b, label: b, count: grouped[b].length })),
        ]}
        activeTab={brandTab}
        onTabChange={setBrandTab}
        search={{
          value: searchText,
          onChange: (e) => setSearchText(e.target.value),
          onPressEnter: () => fetchData(1, limit),
          placeholder: "Search model or brand — press Enter to search all",
        }}
        resultLabel={`${visible.length} shown`}
      >
        <div className="hidden md:block">
          <CommonTable
            data={visible}
            columns={columns}
            rowKey="id"
            loadding={loading}
            total={total}
            currentPage={page}
            pageSize={limit}
            handlePagination={(p, ps) => fetchData(p, ps)}
            unit="models"
            onRow={(m) => ({ onClick: () => navigate(`/dash/models/${m.id}`), style: { cursor: "pointer" } })}
          />
        </div>
        <div className="block md:hidden mp-mlist">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spin />
            </div>
          ) : visible.length === 0 ? (
            <EmptyState title="No car models found" />
          ) : (
            visible.map((m) => (
              <div key={m.id} className="mp-mcard" onClick={() => navigate(`/dash/models/${m.id}`)}>
                <div className="mp-mcard-head">
                  <ThumbCell icon={<CarOutlined />} title={m.name} sub={m.make?.name} />
                  <RowMenu items={rowItems} record={m} onClick={onMenu} />
                </div>
                <div className="mp-mcard-row">
                  <span>Status</span>
                  <ActivePill active={m.isActive} />
                </div>
              </div>
            ))
          )}
          <div className="my-4 flex justify-center">
            <Pagination current={page} pageSize={limit} total={total} onChange={(p, ps) => fetchData(p, ps)} size="small" />
          </div>
        </div>
      </TableCard>

      {openModalFor === "edit" || openModalFor === "add" ? (
        <CommonModal
          width={700}
          isModalOpen={true}
          title={openModalFor === "add" ? "New model" : "Edit model"}
          setIsModalOpen={(open) => {
            if (!open) {
              setOpenModalFor(null);
              setEditing(null);
            }
          }}
        >
          {openModalFor === "add" ? (
            <CarModelsEdit
              key={"model-add"}
              modelId={""}
              initialBrands={brands}
              setIsModalOpen={(open) => {
                if (!open) setOpenModalFor(null);
              }}
              refreshData={fetchData}
            />
          ) : (
            <CarModelsEdit
              key={editing?.id || "model-edit"}
              modelId={editing?.id || ""}
              initialModel={editing}
              setIsModalOpen={(open) => {
                if (!open) {
                  setOpenModalFor(null);
                  setEditing(null);
                }
              }}
              refreshData={fetchData}
            />
          )}
        </CommonModal>
      ) : null}

      {isDeleteModalOpen && (
        <CommonDeleteModal
          isModalOpen={isDeleteModalOpen}
          setIsModalOpen={setIsDeleteModalOpen}
          handleDelete={handleDelete}
          loading={loading}
        >
          This will permanently delete <strong>{deleteTarget?.name || "this model"}</strong>.
        </CommonDeleteModal>
      )}
    </Page>
  );
};

export default CarModelsList;

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
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  CarOutlined,
} from "@ant-design/icons";
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
  return (
    <div className="p-1">
      {/* Header controls */}
      <div className="flex md:flex-row flex-col justify-between items-start md:items-end p-6">
        <div className="flex flex-col md:w-[45vw] w-full">
          <h1 className="text-2xl font-bold pb-4">Car Models</h1>
          <Input
            placeholder="Search model or brand"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={() => fetchData(1, limit)}
            allowClear
            className="drop-shadow-sm py-2"
          />
        </div>

        <div className="flex items-center mt-4 md:mt-0">
          <button
            onClick={() => fetchData(page, limit)}
            className="border border-[var(--color-primary)] py-2 px-3 text-[var(--color-primary)] rounded mr-4 flex items-center justify-center"
          >
            <ReloadOutlined />
          </button>

          <button
            className="px-4 py-2 border border-[var(--color-primary)] text-white bg-[var(--color-primary)] rounded"
            onClick={openCreate}
          >
            <PlusOutlined className="mr-2" /> Add Model
          </button>
        </div>
      </div>

      {/* Loader */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spin size="large" />
        </div>
      ) : Object.keys(filteredGroups).length === 0 ? (
        <Empty description="No car models found" />
      ) : (
        <>
          <Collapse
            bordered={false}
            expandIconPosition="end"
            style={{ background: "transparent" }}
            defaultActiveKey={Object.keys(filteredGroups)} // ✅ all expanded initially
          >
            {Object.entries(filteredGroups).map(([brand, models]) => (
              <Panel
                header={
                  <div className="flex items-center gap-2">
                    <CarOutlined />
                    <span className="font-semibold text-base">{brand}</span>
                    <Tag color="blue">{models.length}</Tag>
                  </div>
                }
                key={brand}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {models.map((model) => (
                    <Card
                      key={model.id}
                      hoverable
                      title={model.name}
                      size="small"
                      onClick={() => navigate(`/dash/models/${model.id}`)}
                      extra={
                        <div
                          className="flex gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Tooltip title="Edit">
                            <Button
                              icon={<EditOutlined />}
                              type="text"
                              onClick={() => openEdit(model)}
                            />
                          </Tooltip>
                          <Tooltip title="Delete">
                            <Button
                              icon={<DeleteOutlined />}
                              type="text"
                              danger
                              onClick={() => confirmDelete(model)} // ✅ show confirmation
                            />
                          </Tooltip>
                        </div>
                      }
                    >
                      <p>
                        <strong>Brand:</strong> {model.make?.name || "N/A"}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        <Tag color={model.isActive ? "green" : "red"}>
                          {model.isActive ? "Active" : "Inactive"}
                        </Tag>
                      </p>
                    </Card>
                  ))}
                </div>
              </Panel>
            ))}
          </Collapse>

          {/* Pagination */}
          <div className="flex justify-end mt-6">
            <Pagination
              current={page}
              pageSize={limit}
              total={total}
              showSizeChanger
              pageSizeOptions={["5", "10", "20", "50"]}
              onChange={(p, ps) => fetchData(p, ps)}
            />
          </div>
        </>
      )}

      {/* Add / Edit Modal (mounted immediately like HostList) */}
      {openModalFor === "edit" || openModalFor === "add" ? (
        <CommonModal
          width={700}
          isModalOpen={true}
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

      {/* ✅ Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <CommonDeleteModal
          isModalOpen={isDeleteModalOpen}
          setIsModalOpen={setIsDeleteModalOpen}
          handleDelete={handleDelete}
          loading={loading}
        >
          <h1 className="text-2xl text-center font-semibold mb-2">
            Are you sure?
          </h1>
          <p className="text-center text-gray-600">
            This will permanently delete{" "}
            <strong>{deleteTarget?.name || "this model"}</strong>.
          </p>
        </CommonDeleteModal>
      )}
    </div>
  );
};

export default CarModelsList;

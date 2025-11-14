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
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();

  // ============================
  // FETCH MODELS
  // ============================
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await CarModelsService.searchModels({
        page: 1,
        limit: 500,
        search: searchText,
      });

      const list = res?.data || [];
      setModels(list);

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
    fetchData();
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
    setEditOpen(true);
  };

  const openEdit = (model) => {
    setEditing(model);
    setEditOpen(true);
  };

  // ============================
  // RENDER
  // ============================
  return (
    <div className="p-6">
      {/* Header controls */}
      <div className="flex justify-between items-center mb-6">
        <Input
          placeholder="Search model or brand"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 250 }}
        />
        <div className="flex gap-3">
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
            style={{
              borderColor: "var(--color-primary)",
              color: "var(--color-primary)",
            }}
          ></Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ backgroundColor: "var(--color-primary)" }}
            onClick={openCreate}
          >
            Add Model
          </Button>
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
      )}

      {/* Add / Edit Modal */}
      {editOpen && (
        <CommonModal
          width={700}
          isModalOpen={editOpen}
          setIsModalOpen={setEditOpen}
        >
          <CarModelsEdit
            modelId={editing?.id || ""}
            setIsModalOpen={setEditOpen}
            refreshData={fetchData}
          />
        </CommonModal>
      )}

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

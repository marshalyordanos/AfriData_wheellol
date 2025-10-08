import React, { useEffect, useState } from "react";
import {
  Input,
  Card,
  Tag,
  Modal,
  Form,
  Select,
  Button,
  message,
  Collapse,
  Tooltip,
  Popconfirm,
  Skeleton,
  Empty,
  Badge,
  Switch,
} from "antd";
import {
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import ModelsService from "./CarModelsService";

const CarModelsList = () => {
  const [models, setModels] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const isEdit = !!editing;
  const [brands, setBrands] = useState([]);
  const [brandLoading, setBrandLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // Group models by brand
  const group = (list) =>
    list.reduce((acc, item) => {
      const brandName = item.make?.name || "Unknown Brand";
      if (!acc[brandName]) acc[brandName] = [];
      acc[brandName].push(item);
      return acc;
    }, {});

  // Fetch models
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await ModelsService.searchModels({
        page: 1,
        limit: 500,
        searchText: "",
      });
      let list = res.data || [];

      if (searchText.trim() !== "") {
        const lower = searchText.toLowerCase();
        list = list.filter(
          (m) =>
            m.name.toLowerCase().includes(lower) ||
            m.make?.name?.toLowerCase().includes(lower)
        );
      }

      setModels(list);
      setGrouped(group(list));
    } catch (e) {
      message.error("Failed to fetch models");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchData(), 400);
    return () => clearTimeout(t);
  }, [searchText]);

  // Open edit modal
  const openEdit = (model) => {
    setEditing(model);
    form.setFieldsValue({
      name: model.name,
      makeId: model.make?.id || null,
      isActive: model.isActive, // ✅ prefill active toggle
    });
    setEditOpen(true);
    if (!brands.length) loadBrands("");
  };

  // Open create modal
  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true }); // ✅ default new models as active
    setEditOpen(true);
    if (!brands.length) loadBrands("");
  };

  // Load brands
  const loadBrands = async (q) => {
    try {
      setBrandLoading(true);
      const list = await ModelsService.fetchAllBrands(q);
      setBrands(list);
    } catch (e) {
      message.error("Failed to fetch brands");
    } finally {
      setBrandLoading(false);
    }
  };

  const handleSearchBrands = (val) => loadBrands(val);

  // ✅ Handle create/update
  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();

      if (editing) {
        console.log("Form values:", values);
        // Update existing model
        const updated = await ModelsService.updateModelFields({
          id: editing.id,
          name: values.name,
          makeId: values.makeId,
          isActive: values.isActive, // ✅ include active flag
        });

        message.success("Model updated");

        const brandObj = brands.find((b) => b.id === values.makeId);
        const updatedWithMake = { ...updated, make: brandObj };

        const newList = models.map((m) =>
          m.id === editing.id ? updatedWithMake : m
        );

        setModels(newList);
        setGrouped(group(newList));
      } else {
        // Create new model
        const created = await ModelsService.createModelFields({
          name: values.name,
          makeId: values.makeId,
          isActive: values.isActive, // ✅ include active flag
        });
        message.success("Model created");

        const brandObj = brands.find((b) => b.id === values.makeId);
        const createdWithMake = { ...created, make: brandObj };

        const newList = [...models, createdWithMake];
        setModels(newList);
        setGrouped(group(newList));
      }

      setEditOpen(false);
    } catch (e) {
      message.error("Failed to save model");
    }
  };

  // Delete model
  const handleDelete = async (model) => {
    try {
      await ModelsService.deleteModel(model.id);
      message.success("Model deleted");

      const newModels = models.filter((m) => m.id !== model.id);
      setModels(newModels);
      setGrouped(group(newModels));
    } catch (err) {
      if (err.response?.status === 400 || err.response?.status === 409) {
        message.error("Cannot delete model: remove dependencies first");
      } else {
        message.error("Failed to delete model");
      }
    }
  };

  // Navigate to detail page
  const goToDetail = (id) => {
    navigate(`/dash/models/${id}`);
  };

  // Collapse panels by brand
  const brandPanels = Object.entries(grouped).map(([brand, items]) => ({
    key: brand,
    label: (
      <div className="flex items-center justify-between w-full pr-2">
        <span className="font-medium">{brand}</span>
        <Badge count={items.length} size="small" />
      </div>
    ),
    children: (
      <div className="grid gap-4 md:grid-cols-4 sm:grid-cols-2 grid-cols-1">
        {items.map((m) => (
          <Card
            key={m.id}
            size="small"
            title={<span className="font-semibold">{m.name}</span>}
            className="model-card shadow-sm hover:shadow-md transition-shadow"
            extra={<Tag color={m.isActive ? "blue" : "red"}>{brand}</Tag>}
            actions={[
              <Tooltip title="Edit" key="edit">
                <EditOutlined
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(m);
                  }}
                />
              </Tooltip>,
              <Popconfirm
                key="del"
                title="Delete model?"
                okType="danger"
                onConfirm={(e) => {
                  e?.stopPropagation();
                  handleDelete(m);
                }}
              >
                <DeleteOutlined
                  className="text-red-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </Popconfirm>,
            ]}
            onClick={() => goToDetail(m.id)}
            style={{ cursor: "pointer" }}
          >
            <div className="text-xs text-gray-500">
              Brand: {brand}
              <br />
              Status: {m.isActive ? "Active ✅" : "Inactive ❌"}
            </div>
          </Card>
        ))}
      </div>
    ),
  }));

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div className="flex flex-col w-full md:w-2/3 lg:w-1/2">
          <h1 className="text-2xl font-bold pb-2">Models</h1>
          <Input
            placeholder="Search model or brand"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>
        <div className="flex items-center gap-3 self-start md:self-end">
          <Tooltip title="Reload">
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchData}
              shape="circle"
            />
          </Tooltip>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add Model
          </Button>
        </div>
      </div>

      {loading && (
        <div className="grid md:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <Skeleton active title={false} paragraph={{ rows: 3 }} />
            </Card>
          ))}
        </div>
      )}

      {!loading && brandPanels.length === 0 && (
        <Empty description="No models" />
      )}

      {!loading && brandPanels.length > 0 && (
        <Collapse
          items={brandPanels}
          defaultActiveKey={brandPanels.slice(0, 3).map((p) => p.key)}
          bordered={false}
          expandIconPosition="end"
        />
      )}

      <Modal
        title={isEdit ? "Edit Model" : "Add Model"}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={handleUpdate}
        okText={isEdit ? "Save" : "Create"}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Model Name"
            name="name"
            rules={[{ required: true, message: "Name required" }]}
          >
            <Input placeholder="Model name" />
          </Form.Item>

          <Form.Item
            label="Brand"
            name="makeId"
            rules={[{ required: true, message: "Brand required" }]}
          >
            <Select
              showSearch
              placeholder="Select brand"
              filterOption={false}
              onSearch={handleSearchBrands}
              loading={brandLoading}
              options={brands.map((b) => ({ label: b.name, value: b.id }))}
            />
          </Form.Item>

          <Form.Item label="Active" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CarModelsList;

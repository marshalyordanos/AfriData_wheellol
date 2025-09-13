import React, { useEffect, useState } from "react";
import {
  Input,
  Spin,
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
} from "antd";
import {
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
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
  const group = (list) =>
    list.reduce((acc, item) => {
      const brandName = item.brand?.name || "Unknown Brand";
      if (!acc[brandName]) acc[brandName] = [];
      acc[brandName].push(item);
      return acc;
    }, {});

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await ModelsService.searchModels({
        page: 1,
        limit: 500,
        searchText,
        sort: "",
        order: "",
      });
      const list = res.data || [];
      setModels(list);
      setGrouped(group(list));
    } catch (e) {
      // ignore
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

  const openEdit = (model) => {
    setEditing(model);
    form.setFieldsValue({ name: model.name, brand_id: model.brand?._id });
    setEditOpen(true);
    if (!brands.length) loadBrands("");
  };
  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setEditOpen(true);
    if (!brands.length) loadBrands("");
  };

  const loadBrands = async (q) => {
    try {
      setBrandLoading(true);
      const list = await ModelsService.fetchAllBrands(q);
      setBrands(list);
    } catch (e) {
    } finally {
      setBrandLoading(false);
    }
  };
  const handleSearchBrands = (val) => loadBrands(val);

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await ModelsService.updateModelFields(editing._id, {
          name: values.name,
          brand_id: values.brand_id,
        });
        message.success("Model updated");
        const patched = models.map((m) =>
          m._id === editing._id
            ? {
                ...m,
                name: values.name,
                brand: {
                  _id: values.brand_id,
                  name:
                    brands.find((b) => b._id === values.brand_id)?.name ||
                    m.brand?.name,
                },
              }
            : m
        );
        setModels(patched);
        setGrouped(group(patched));
      } else {
        const created = await ModelsService.createModelFields({
          name: values.name,
          brand_id: values.brand_id,
        });
        message.success("Model created");
        const newList = [...models, created];
        setModels(newList);
        setGrouped(group(newList));
      }
      setEditOpen(false);
    } catch (e) {
      // ignore
    }
  };

  const handleDelete = async (model) => {
    Modal.confirm({
      title: `Delete model "${model.name}"?`,
      okType: "danger",
      onOk: async () => {
        try {
          await ModelsService.deleteModel(model._id);
          message.success("Deleted");
          const rest = models.filter((m) => m._id !== model._id);
          setModels(rest);
          setGrouped(group(rest));
        } catch (e) {
          message.error("Delete failed");
        }
      },
    });
  };

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
            key={m._id}
            size="small"
            title={<span className="font-semibold">{m.name}</span>}
            className="model-card shadow-sm hover:shadow-md transition-shadow"
            extra={<Tag color="blue">{brand}</Tag>}
            actions={[
              <Tooltip title="Edit" key="edit">
                <EditOutlined onClick={() => openEdit(m)} />
              </Tooltip>,
              <Popconfirm
                key="del"
                title="Delete model?"
                okType="danger"
                onConfirm={() => handleDelete(m)}
              >
                <DeleteOutlined className="text-red-500" />
              </Popconfirm>,
            ]}
          >
            <div className="text-xs text-gray-500">Brand: {brand}</div>
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
            name="brand_id"
            rules={[{ required: true, message: "Brand required" }]}
          >
            <Select
              showSearch
              placeholder="Select brand"
              filterOption={false}
              onSearch={handleSearchBrands}
              loading={brandLoading}
              options={brands.map((b) => ({ label: b.name, value: b._id }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CarModelsList;

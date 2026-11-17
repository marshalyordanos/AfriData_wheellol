// Contract templates: /dash/contracts
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Dropdown, Form, Input, Modal, Select, Spin, Switch, message } from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileAddOutlined,
  FileTextOutlined,
  InboxOutlined,
  MoreOutlined,
  PlusOutlined,
  PrinterOutlined,
  StarFilled,
  StarOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Page, PageHeader, StatusPill, EmptyState, ReloadBtn } from "../../components/modern/ModernUI";
import ContractApi from "./contractApi";
import { renderContract } from "./renderContract";
import { printContract } from "./printContract";
import "./contracts.css";

const thumbHtml = (t) =>
  renderContract({ document: t.document, request: null, contract: { contractNo: "WCR/CRA/001/2026", title: t.title }, mode: "final" });

const START_OPTIONS = [
  { value: "default", title: "WHEELLOL standard agreement", text: "Car rental with driver: 13 articles, Schedule A, signatures. Edit anything." },
  { value: "blank", title: "Blank contract", text: "Only a title, contract details and signatures. Add your own articles." },
  { value: "copy", title: "Copy an existing contract", text: "Start from one of your contracts." },
];

const NewContractModal = ({ open, onClose, templates, onCreated }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const from = Form.useWatch("from", form);
  useEffect(() => {
    if (open) form.setFieldsValue({ title: "", description: "", from: "default", copyId: templates[0]?.id });
  }, [open, form, templates]);
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="New contract"
      okText="Create and edit"
      confirmLoading={saving}
      destroyOnHidden
      onOk={async () => {
        const v = await form.validateFields();
        setSaving(true);
        try {
          const t = await ContractApi.createTemplate({
            title: v.title.trim(),
            description: v.description?.trim() || undefined,
            from: v.from === "copy" ? v.copyId : v.from,
          });
          onCreated(t);
        } catch {
          // toast handled by api interceptor
        } finally {
          setSaving(false);
        }
      }}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item label="Title" name="title" rules={[{ required: true, whitespace: true, message: "Give the contract a title" }]}>
          <Input placeholder="e.g. Long-term NGO agreement" autoFocus maxLength={160} />
        </Form.Item>
        <Form.Item label="Description (optional)" name="description">
          <Input.TextArea autoSize={{ minRows: 2 }} maxLength={500} placeholder="When should the team use it?" />
        </Form.Item>
        <Form.Item name="from" hidden>
          <Input />
        </Form.Item>
        <div className="ct-label">Start from</div>
        <div style={{ marginBottom: 16 }}>
          <div className="flex flex-col gap-2">
            {START_OPTIONS.filter((o) => o.value !== "copy" || templates.length).map((o) => (
              <div
                key={o.value}
                role="radio"
                aria-checked={from === o.value}
                tabIndex={0}
                className={`ct-startopt ${from === o.value ? "is-on" : ""}`}
                onClick={() => form.setFieldsValue({ from: o.value })}
                onKeyDown={(e) => e.key === "Enter" && form.setFieldsValue({ from: o.value })}
              >
                <FileTextOutlined style={{ fontSize: 18, marginTop: 2, color: "var(--c-primary-text)" }} />
                <div>
                  <b>{o.title}</b>
                  <span className="ct-muted ct-small">{o.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {from === "copy" && (
          <Form.Item label="Contract to copy" name="copyId" rules={[{ required: true, message: "Choose a contract" }]}>
            <Select options={templates.map((t) => ({ value: t.id, label: t.title }))} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

const ContractTemplatesPage = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [preview, setPreview] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await ContractApi.listTemplates({ all: true }));
    } catch {
      // toast handled by api interceptor
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const active = rows.filter((t) => t.isActive);
  const visible = showArchived ? rows : active;
  const thumbs = useMemo(() => Object.fromEntries(rows.map((t) => [t.id, thumbHtml(t)])), [rows]);

  const act = async (fn, ok) => {
    try {
      const res = await fn();
      if (ok) message.success(typeof ok === "function" ? ok(res) : ok);
      await load();
      return res;
    } catch {
      return null;
    }
  };

  const menu = (t) => ({
    items: [
      { key: "edit", icon: <EditOutlined />, label: "Edit" },
      { key: "preview", icon: <EyeOutlined />, label: "Preview" },
      { key: "print", icon: <PrinterOutlined />, label: "Print / PDF" },
      { key: "dup", icon: <CopyOutlined />, label: "Duplicate" },
      !t.isDefault && t.isActive && { key: "default", icon: <StarOutlined />, label: "Make default" },
      { type: "divider" },
      t.isActive
        ? !t.isDefault && { key: "archive", icon: <InboxOutlined />, label: "Archive" }
        : { key: "restore", icon: <UndoOutlined />, label: "Restore" },
      !t.isDefault && { key: "delete", icon: <DeleteOutlined />, label: t._count?.contracts ? "Delete (archives: used)" : "Delete", danger: true },
    ].filter(Boolean),
    onClick: ({ key, domEvent }) => {
      domEvent.stopPropagation();
      if (key === "edit") navigate(`/dash/contracts/${t.id}`);
      if (key === "preview") setPreview(t);
      if (key === "print") printContract(thumbs[t.id], t.title);
      if (key === "dup") act(() => ContractApi.duplicateTemplate(t.id), "Contract duplicated");
      if (key === "default") act(() => ContractApi.setDefault(t.id), `“${t.title}” is now the default contract`);
      if (key === "archive") act(() => ContractApi.updateTemplate(t.id, { isActive: false }), "Contract archived");
      if (key === "restore") act(() => ContractApi.updateTemplate(t.id, { isActive: true }), "Contract restored");
      if (key === "delete")
        Modal.confirm({
          title: `Delete “${t.title}”?`,
          content: t._count?.contracts
            ? "It is used by bookings, so it will be archived instead. Contracts already sent stay as they are."
            : "This cannot be undone.",
          okText: t._count?.contracts ? "Archive" : "Delete",
          okButtonProps: { danger: true },
          onOk: () => act(() => ContractApi.deleteTemplate(t.id), (r) => r?.message || "Done"),
        });
    },
  });

  return (
    <Page>
      <PageHeader
        eyebrow="Documents"
        title="Contracts"
        subtitle="Build the contracts you send to customers. Pick one for each booking request, fill it and send it for e-signature."
        actions={
          <>
            <label className="ct-mini" style={{ color: "var(--c-text-3)" }}>
              <Switch size="small" checked={showArchived} onChange={setShowArchived} /> Show archived
            </label>
            <ReloadBtn onClick={load} loading={loading} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setNewOpen(true)}>
              New contract
            </Button>
          </>
        }
      />

      {loading && !rows.length ? (
        <div className="flex justify-center p-16">
          <Spin size="large" />
        </div>
      ) : (
        <div className="ct-grid">
          {visible.map((t) => (
            <article key={t.id} className={`ct-card ${t.isActive ? "" : "is-archived"}`}>
              <div className="ct-ribbon flex gap-1">
                {t.isDefault && (
                  <StatusPill tone="orange">
                    <StarFilled /> Default
                  </StatusPill>
                )}
                {!t.isActive && <StatusPill tone="gray">Archived</StatusPill>}
              </div>
              <div
                className="ct-thumb"
                role="button"
                tabIndex={0}
                aria-label={`Edit ${t.title}`}
                onClick={() => navigate(`/dash/contracts/${t.id}`)}
                onKeyDown={(e) => e.key === "Enter" && navigate(`/dash/contracts/${t.id}`)}
              >
                <div className="ct-thumb-page" dangerouslySetInnerHTML={{ __html: thumbs[t.id] }} />
              </div>
              <div className="ct-card-b">
                <div className="ct-card-t">{t.title}</div>
                {t.description && <div className="ct-card-d">{t.description}</div>}
                <div className="ct-card-meta">
                  <span className="ct-tag">{t.stats?.articles || 0} articles</span>
                  <span className="ct-tag">{t.stats?.clauses || 0} clauses</span>
                  {t.stats?.fields > 0 && <span className="ct-tag">{t.stats.fields} custom fields</span>}
                  {t.stats?.hasSchedule && <span className="ct-tag">Vehicle schedule</span>}
                </div>
              </div>
              <div className="ct-card-f">
                <span>
                  Used in {t._count?.contracts || 0} booking{t._count?.contracts === 1 ? "" : "s"} · edited {dayjs(t.updatedAt).format("DD MMM YYYY")}
                </span>
                <span className="flex gap-1">
                  <Button size="small" onClick={() => navigate(`/dash/contracts/${t.id}`)}>
                    Edit
                  </Button>
                  <Dropdown trigger={["click"]} menu={menu(t)}>
                    <Button size="small" icon={<MoreOutlined />} aria-label="More actions" />
                  </Dropdown>
                </span>
              </div>
            </article>
          ))}
          <button type="button" className="ct-newcard" onClick={() => setNewOpen(true)}>
            <span className="ic">
              <FileAddOutlined />
            </span>
            <b>New contract</b>
            <span className="ct-muted ct-small">Start from the standard agreement or blank</span>
          </button>
        </div>
      )}
      {!loading && !visible.length && <EmptyState title="No contracts yet" text="Create your first contract." />}

      <NewContractModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        templates={active}
        onCreated={(t) => {
          setNewOpen(false);
          message.success("Contract created");
          navigate(`/dash/contracts/${t.id}`);
        }}
      />

      <Modal
        open={!!preview}
        onCancel={() => setPreview(null)}
        title={preview?.title}
        width={900}
        footer={[
          <Button key="p" icon={<PrinterOutlined />} onClick={() => printContract(thumbs[preview.id], preview.title)}>
            Print / PDF
          </Button>,
          <Button key="e" type="primary" icon={<EditOutlined />} onClick={() => navigate(`/dash/contracts/${preview.id}`)}>
            Edit
          </Button>,
        ]}
        destroyOnHidden
      >
        {preview && (
          <div className="ct-canvas" style={{ padding: 16, minHeight: 0, maxHeight: "70vh", overflow: "auto" }}>
            <div
              className="ct-paper ct-preview-paper"
              dangerouslySetInnerHTML={{
                __html: renderContract({ document: preview.document, request: null, contract: { contractNo: "WCR/CRA/001/2026" }, mode: "preview" }),
              }}
            />
          </div>
        )}
      </Modal>
    </Page>
  );
};

export default ContractTemplatesPage;

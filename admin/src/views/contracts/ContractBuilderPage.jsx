// Contract template builder: /dash/contracts/:id
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Input, Modal, Segmented, Select, Spin, Tabs, Tooltip, message } from "antd";
import {
  EditOutlined,
  EyeOutlined,
  PrinterOutlined,
  RedoOutlined,
  SaveOutlined,
  StarFilled,
  UndoOutlined,
  FileWordOutlined,
} from "@ant-design/icons";
import { Page, PageHeader, StatusPill, EmptyState } from "../../components/modern/ModernUI";
import ContractApi from "./contractApi";
import DocumentEditor from "./editor/DocumentEditor";
import { EditorBusProvider } from "./editor/EditorBus";
import { FieldsPanel, Outline, SettingsPanel } from "./editor/Panels";
import { renderContract } from "./renderContract";
import { downloadWord, printContract } from "./printContract";
import RentalRequestService from "../rental-requests/rentalRequestHelpers";
import "./contracts.css";

/** Document state with undo/redo. Quick successive edits (typing) merge into one step. */
export const useDocHistory = (initial) => {
  const [h, setH] = useState({ past: [], present: initial, future: [] });
  const last = useRef(0);
  const set = useCallback((next) => {
    setH((s) => {
      const value = typeof next === "function" ? next(s.present) : next;
      if (value === s.present) return s;
      const now = Date.now();
      const merge = now - last.current < 800 && s.past.length > 0;
      last.current = now;
      return merge
        ? { past: s.past, present: value, future: [] }
        : { past: [...s.past.slice(-80), s.present], present: value, future: [] };
    });
  }, []);
  const undo = useCallback(
    () =>
      setH((s) =>
        s.past.length ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] } : s,
      ),
    [],
  );
  const redo = useCallback(
    () => setH((s) => (s.future.length ? { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) } : s)),
    [],
  );
  const reset = useCallback((value) => {
    last.current = 0;
    setH({ past: [], present: value, future: [] });
  }, []);
  return { doc: h.present, set, undo, redo, reset, canUndo: h.past.length > 0, canRedo: h.future.length > 0 };
};

const isTyping = (el) => el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

const ContractBuilderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tpl, setTpl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState("edit");
  const [meta, setMeta] = useState({ title: "", description: "" });
  const [saved, setSaved] = useState({ doc: null, title: "", description: "" });
  const hist = useDocHistory(null);
  const { doc } = hist;

  // preview data source
  const [bookings, setBookings] = useState([]);
  const [previewId, setPreviewId] = useState("sample");
  const [previewReq, setPreviewReq] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const t = await ContractApi.getTemplate(id);
        setTpl(t);
        hist.reset(t.document);
        setMeta({ title: t.title, description: t.description || "" });
        setSaved({ doc: t.document, title: t.title, description: t.description || "" });
      } catch {
        // toast handled by api interceptor
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const dirty = !!doc && (doc !== saved.doc || meta.title !== saved.title || meta.description !== saved.description);

  const save = useCallback(async () => {
    if (!doc || saving) return;
    if (!meta.title.trim()) {
      message.error("Give the contract a title");
      return;
    }
    setSaving(true);
    try {
      const t = await ContractApi.updateTemplate(id, { title: meta.title.trim(), description: meta.description, document: doc });
      setTpl(t);
      setSaved({ doc, title: meta.title.trim(), description: meta.description });
      message.success("Contract saved");
    } catch {
      // toast handled by api interceptor
    } finally {
      setSaving(false);
    }
  }, [doc, id, meta, saving]);

  // Keyboard: Ctrl/Cmd+S save, Ctrl/Cmd+Z undo, Shift+Ctrl/Cmd+Z / Ctrl+Y redo
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === "s") {
        e.preventDefault();
        save();
      } else if (!isTyping(document.activeElement) && k === "z") {
        e.preventDefault();
        if (e.shiftKey) hist.redo();
        else hist.undo();
      } else if (!isTyping(document.activeElement) && k === "y") {
        e.preventDefault();
        hist.redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save, hist]);

  // Warn before closing the tab with unsaved changes
  useEffect(() => {
    if (!dirty) return undefined;
    const onUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [dirty]);

  // bookings for "preview with"
  useEffect(() => {
    if (mode !== "preview" || bookings.length) return;
    RentalRequestService.list({ page: 1, pageSize: 30 })
      .then((r) => setBookings(r.data || []))
      .catch(() => {});
  }, [mode, bookings.length]);

  useEffect(() => {
    if (previewId === "sample") {
      setPreviewReq(null);
      return;
    }
    RentalRequestService.get(previewId).then(setPreviewReq).catch(() => setPreviewId("sample"));
  }, [previewId]);

  const previewHtml = useMemo(() => {
    if (!doc || mode !== "preview") return "";
    return renderContract({
      document: doc,
      request: previewReq,
      contract: { contractNo: "WCR/CRA/001/2026", title: meta.title },
      mode: "preview",
    });
  }, [doc, mode, previewReq, meta.title]);

  const finalHtml = () =>
    renderContract({ document: doc, request: previewReq, contract: { contractNo: "WCR/CRA/001/2026", title: meta.title }, mode: "final" });

  const goBack = () => {
    if (!dirty) return navigate("/dash/contracts");
    Modal.confirm({
      title: "Leave without saving?",
      content: "Your changes to this contract will be lost.",
      okText: "Leave",
      okButtonProps: { danger: true },
      cancelText: "Stay",
      onOk: () => navigate("/dash/contracts"),
    });
  };

  if (loading) {
    return (
      <Page>
        <div className="flex justify-center p-16">
          <Spin size="large" />
        </div>
      </Page>
    );
  }
  if (!tpl || !doc) {
    return (
      <Page>
        <EmptyState title="Contract not found" text="It may have been deleted." />
      </Page>
    );
  }

  const articles = (doc.blocks || []).filter((b) => b.type === "article").length;

  return (
    <Page>
      <PageHeader
        back={goBack}
        eyebrow="Contract template"
        title={
          <span className="flex items-center gap-3 flex-wrap">
            {meta.title || "Untitled contract"}
            {tpl.isDefault && (
              <StatusPill tone="orange">
                <StarFilled /> Default
              </StatusPill>
            )}
            {!tpl.isActive && <StatusPill tone="gray">Archived</StatusPill>}
          </span>
        }
        subtitle={`${articles} article${articles === 1 ? "" : "s"} · ${(doc.fields || []).length} custom field${(doc.fields || []).length === 1 ? "" : "s"} · used in ${tpl._count?.contracts || 0} booking${tpl._count?.contracts === 1 ? "" : "s"}`}
        actions={
          <>
            <span className={`ct-dirty ${dirty ? "is-dirty" : ""}`}>
              <i /> {dirty ? "Unsaved changes" : "All changes saved"}
            </span>
            <Tooltip title="Undo (Ctrl+Z)">
              <Button icon={<UndoOutlined />} disabled={!hist.canUndo} onClick={hist.undo} aria-label="Undo" />
            </Tooltip>
            <Tooltip title="Redo (Ctrl+Shift+Z)">
              <Button icon={<RedoOutlined />} disabled={!hist.canRedo} onClick={hist.redo} aria-label="Redo" />
            </Tooltip>
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: "edit", icon: <EditOutlined />, label: "Edit" },
                { value: "preview", icon: <EyeOutlined />, label: "Preview" },
              ]}
            />
            <Tooltip title="Print or save as PDF">
              <Button icon={<PrinterOutlined />} onClick={() => printContract(finalHtml(), meta.title)} aria-label="Print" />
            </Tooltip>
            <Tooltip title="Download Word">
              <Button icon={<FileWordOutlined />} onClick={() => downloadWord(finalHtml(), meta.title)} aria-label="Download Word" />
            </Tooltip>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} disabled={!dirty} onClick={save}>
              Save
            </Button>
          </>
        }
      />

      <EditorBusProvider document={doc}>
        <div className="ct-builder">
          <aside className="ct-side ct-side-outline">
            <div className="ct-side-h">Outline</div>
            <Outline document={doc} onChange={hist.set} />
          </aside>

          <div className="ct-canvas">
            {mode === "preview" && (
              <div className="ct-toolbar" style={{ maxWidth: 820, margin: "0 auto 16px" }}>
                <span className="ct-muted ct-small">Preview with</span>
                <Select
                  showSearch
                  optionFilterProp="label"
                  style={{ minWidth: 280 }}
                  value={previewId}
                  onChange={setPreviewId}
                  options={[
                    { value: "sample", label: "Sample booking (example data)" },
                    ...bookings.map((b) => ({ value: b.id, label: `${b.trackingCode} · ${b.contactName}` })),
                  ]}
                />
                <span className="grow" />
                <span className="ct-muted ct-small">
                  <span className="ct-chip">field</span> = filled from data · <span className="wlc-missing">empty</span> = needs a value
                </span>
              </div>
            )}
            {mode === "edit" ? (
              <div style={{ "--pa": doc.settings?.accent || "#09234c" }}>
                <DocumentEditor document={doc} onChange={hist.set} />
              </div>
            ) : (
              <div className="ct-paper ct-preview-paper" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            )}
          </div>

          <aside className="ct-side">
            <Tabs
              defaultActiveKey="fields"
              size="small"
              items={[
                { key: "fields", label: "Fields", children: <FieldsPanel document={doc} onChange={hist.set} /> },
                { key: "settings", label: "Settings", children: <SettingsPanel document={doc} onChange={hist.set} /> },
                {
                  key: "about",
                  label: "About",
                  children: (
                    <div className="ct-panel">
                      <section className="ct-panel-sec">
                        <label className="ct-label" style={{ marginTop: 0 }}>
                          Title
                        </label>
                        <Input value={meta.title} maxLength={160} onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))} />
                        <label className="ct-label">Description (for admins)</label>
                        <Input.TextArea
                          autoSize={{ minRows: 3 }}
                          maxLength={500}
                          value={meta.description}
                          onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))}
                          placeholder="When should this contract be used?"
                        />
                      </section>
                      <section className="ct-panel-sec ct-muted ct-small">
                        Tips: click any text in the contract to edit it. Use <b>Insert field</b> or the Fields tab to add data from the
                        booking. Drag items in the Outline to reorder. Press <b>Ctrl+S</b> to save.
                      </section>
                    </div>
                  ),
                },
              ]}
            />
          </aside>
        </div>
      </EditorBusProvider>
    </Page>
  );
};

export default ContractBuilderPage;

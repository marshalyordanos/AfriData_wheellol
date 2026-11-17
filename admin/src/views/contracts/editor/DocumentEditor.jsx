// The contract canvas: an A4 "paper" with editable blocks (title, details,
// articles with numbered clauses, paragraphs, vehicle schedule, signatures,
// page breaks). Used by the template builder and per-booking contract editing.
import React, { useMemo, useState } from "react";
import { Checkbox, Dropdown, Modal, Popconfirm, Segmented, Switch, Tooltip } from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BookOutlined,
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import RichText from "./RichText";
import FieldInput from "./FieldInput";
import { BLOCK_TYPES, LIBRARY_CATEGORIES, articleFromLibrary, articleLibrary, newBlock } from "../articleLibrary";
import { SCHEDULE_COLUMNS, SCHEDULE_COLUMN_ORDER, uid } from "../contractFields";

const TYPE_LABEL = Object.fromEntries(BLOCK_TYPES.map((t) => [t.type, t.label]));

const cloneBlock = (b) => {
  const c = JSON.parse(JSON.stringify(b));
  c.id = uid("b");
  if (c.clauses) c.clauses = c.clauses.map((x) => ({ ...x, id: uid("c") }));
  if (c.rows) c.rows = c.rows.map((x) => ({ ...x, id: uid("r") }));
  return c;
};

const moveItem = (list, from, to) => {
  if (to < 0 || to >= list.length) return list;
  const next = list.slice();
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
};

/** Article numbers as they will print (signatures count when numbered). */
export const articleNumbers = (blocks = []) => {
  let n = 0;
  const map = {};
  blocks.forEach((b) => {
    if (b.type === "article" && b.numbered !== false) map[b.id] = ++n;
    if (b.type === "signatures" && b.numbered !== false && b.title) map[b.id] = ++n;
  });
  return map;
};

export const blockTitle = (b, num) => {
  if (b.type === "article") return `${num ? `${num}. ` : ""}${b.title || "Untitled article"}`;
  if (b.type === "signatures") return `${num ? `${num}. ` : ""}${b.title || "Signatures"}`;
  if (b.type === "header") return b.title || "Title";
  if (b.type === "schedule") return b.title || "Vehicle schedule";
  if (b.type === "text") {
    const t = String(b.html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return t ? `${t.slice(0, 38)}${t.length > 38 ? "…" : ""}` : "Paragraph";
  }
  return TYPE_LABEL[b.type] || b.type;
};

/* ------------------------------------------------------------------ insert bar */
const InsertBar = ({ onAdd, onLibrary, big }) => {
  const items = [
    ...BLOCK_TYPES.map((t) => ({
      key: t.type,
      label: (
        <div className="ct-menu-item">
          <b>{t.label}</b>
          <span>{t.hint}</span>
        </div>
      ),
    })),
    { type: "divider" },
    {
      key: "library",
      icon: <BookOutlined />,
      label: (
        <div className="ct-menu-item">
          <b>Article from library…</b>
          <span>Fuel, insurance, cancellation, deposit…</span>
        </div>
      ),
    },
  ];
  return (
    <Dropdown
      trigger={["click"]}
      menu={{ items, onClick: ({ key }) => (key === "library" ? onLibrary() : onAdd(key)) }}
    >
      {big ? (
        <button type="button" className="ct-addbig">
          <PlusOutlined /> Add article or block
        </button>
      ) : (
        <div className="ct-insert-bar" role="button" tabIndex={0} aria-label="Insert block here">
          <span className="ct-insert-line" />
          <span className="ct-insert-plus">
            <PlusOutlined />
          </span>
        </div>
      )}
    </Dropdown>
  );
};

/* ------------------------------------------------------------------ library modal */
export const LibraryModal = ({ open, onClose, onAdd }) => {
  const [cat, setCat] = useState("All");
  const [picked, setPicked] = useState([]);
  const list = articleLibrary.filter((a) => cat === "All" || a.category === cat);
  const toggle = (k) => setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  return (
    <Modal
      open={open}
      onCancel={() => {
        setPicked([]);
        onClose();
      }}
      title="Article library"
      width={760}
      okText={picked.length ? `Add ${picked.length} article${picked.length > 1 ? "s" : ""}` : "Add"}
      okButtonProps={{ disabled: !picked.length }}
      onOk={() => {
        onAdd(articleLibrary.filter((a) => picked.includes(a.key)).map(articleFromLibrary));
        setPicked([]);
      }}
      destroyOnHidden
    >
      <p className="ct-muted" style={{ marginTop: 0 }}>
        Ready-made articles for car rental contracts. Pick one or more; you can edit every word after adding them.
      </p>
      <Segmented options={["All", ...LIBRARY_CATEGORIES]} value={cat} onChange={setCat} style={{ marginBottom: 14 }} />
      <div className="ct-lib">
        {list.map((a) => (
          <label key={a.key} className={`ct-lib-item ${picked.includes(a.key) ? "is-on" : ""}`}>
            <Checkbox checked={picked.includes(a.key)} onChange={() => toggle(a.key)} />
            <div style={{ minWidth: 0 }}>
              <div className="ct-lib-title">
                {a.title} <span className="ct-tag">{a.category}</span>
              </div>
              <div className="ct-lib-text">
                {[a.intro, ...(a.clauses || [])]
                  .filter(Boolean)
                  .map((h) => h.replace(/<[^>]*>/g, "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, "[$1]"))
                  .join(" ")
                  .slice(0, 220)}
                …
              </div>
            </div>
          </label>
        ))}
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------------ block bodies */
const HeaderBody = ({ b, set }) => (
  <div className="ct-headblk">
    <FieldInput className="ct-in-company" value={b.company} onChange={(v) => set({ company: v })} placeholder="Company line" />
    <FieldInput className="ct-in-title" value={b.title} onChange={(v) => set({ title: v })} placeholder="CONTRACT TITLE" />
    <FieldInput className="ct-in-sub" value={b.subtitle} onChange={(v) => set({ subtitle: v })} placeholder="Subtitle (e.g. customer name)" />
    <label className="ct-mini">
      <Switch size="small" checked={b.showLogo !== false} onChange={(v) => set({ showLogo: v })} /> Show company logo (set it in
      Settings)
    </label>
  </div>
);

const DetailsBody = ({ b, set }) => {
  const rows = b.rows || [];
  const setRows = (next) => set({ rows: next });
  return (
    <div className="ct-details">
      {rows.map((r, i) => (
        <div key={r.id} className="ct-details-row">
          <FieldInput value={r.label} placeholder="Label" onChange={(v) => setRows(rows.map((x) => (x.id === r.id ? { ...x, label: v } : x)))} />
          <FieldInput value={r.value} placeholder="Value or {{field}}" onChange={(v) => setRows(rows.map((x) => (x.id === r.id ? { ...x, value: v } : x)))} />
          <span className="ct-rowtools">
            <button type="button" className="ct-ib" disabled={!i} onClick={() => setRows(moveItem(rows, i, i - 1))} aria-label="Move up">
              <ArrowUpOutlined />
            </button>
            <button type="button" className="ct-ib" onClick={() => setRows(rows.filter((x) => x.id !== r.id))} aria-label="Remove row">
              <CloseOutlined />
            </button>
          </span>
        </div>
      ))}
      <button type="button" className="ct-link" onClick={() => setRows([...rows, { id: uid("r"), label: "", value: "" }])}>
        <PlusOutlined /> Add row
      </button>
    </div>
  );
};

const ArticleBody = ({ b, set, num, active, setActive }) => {
  const numbered = b.numbered !== false;
  const clauses = b.clauses || [];
  const setClauses = (next) => set({ clauses: next });
  const k = (part) => `${b.id}:${part}`;
  const addClause = (at = clauses.length) => {
    const c = { id: uid("c"), html: "" };
    const next = clauses.slice();
    next.splice(at, 0, c);
    setClauses(next);
    setActive(k(`c:${c.id}`));
  };
  const showIntro = !!b.intro || active === k("intro");
  const showOutro = !!b.outro || active === k("outro");
  return (
    <div className="ct-art">
      <div className="ct-art-h">
        {numbered && <span className="ct-art-n">{num}.</span>}
        <FieldInput className="ct-in-art" value={b.title} onChange={(v) => set({ title: v })} placeholder="ARTICLE TITLE" />
      </div>
      {showIntro && (
        <RichText
          value={b.intro}
          onChange={(v) => set({ intro: v })}
          active={active === k("intro")}
          onActivate={() => setActive(k("intro"))}
          onDeactivate={() => setActive(null)}
          placeholder="Introduction (optional)"
          className="ct-rt-intro"
        />
      )}
      <ol className="ct-clauses">
        {clauses.map((c, i) => (
          <li key={c.id} className="ct-clause">
            <span className="ct-clause-n">{numbered ? `${num}.${i + 1}` : "•"}</span>
            <div className="ct-clause-b">
              <RichText
                value={c.html}
                onChange={(v) => setClauses(clauses.map((x) => (x.id === c.id ? { ...x, html: v } : x)))}
                active={active === k(`c:${c.id}`)}
                onActivate={() => setActive(k(`c:${c.id}`))}
                onDeactivate={() => setActive(null)}
                placeholder="Write the clause…"
              />
            </div>
            <span className="ct-rowtools">
              <Tooltip title="Move up">
                <button type="button" className="ct-ib" disabled={!i} onClick={() => setClauses(moveItem(clauses, i, i - 1))}>
                  <ArrowUpOutlined />
                </button>
              </Tooltip>
              <Tooltip title="Move down">
                <button type="button" className="ct-ib" disabled={i === clauses.length - 1} onClick={() => setClauses(moveItem(clauses, i, i + 1))}>
                  <ArrowDownOutlined />
                </button>
              </Tooltip>
              <Tooltip title="Add clause below">
                <button type="button" className="ct-ib" onClick={() => addClause(i + 1)}>
                  <PlusOutlined />
                </button>
              </Tooltip>
              <Tooltip title="Delete clause">
                <button type="button" className="ct-ib is-danger" onClick={() => setClauses(clauses.filter((x) => x.id !== c.id))}>
                  <DeleteOutlined />
                </button>
              </Tooltip>
            </span>
          </li>
        ))}
      </ol>
      {showOutro && (
        <RichText
          value={b.outro}
          onChange={(v) => set({ outro: v })}
          active={active === k("outro")}
          onActivate={() => setActive(k("outro"))}
          onDeactivate={() => setActive(null)}
          placeholder="Closing text (optional)"
        />
      )}
      <div className="ct-art-actions">
        <button type="button" className="ct-link" onClick={() => addClause()}>
          <PlusOutlined /> Clause
        </button>
        {!showIntro && (
          <button type="button" className="ct-link" onClick={() => setActive(k("intro"))}>
            <PlusOutlined /> Intro text
          </button>
        )}
        {!showOutro && (
          <button type="button" className="ct-link" onClick={() => setActive(k("outro"))}>
            <PlusOutlined /> Closing text
          </button>
        )}
        <label className="ct-mini" style={{ marginLeft: "auto" }}>
          <Switch size="small" checked={numbered} onChange={(v) => set({ numbered: v })} /> Numbered
        </label>
      </div>
    </div>
  );
};

const TextBody = ({ b, set, active, setActive }) => (
  <RichText
    value={b.html}
    onChange={(v) => set({ html: v })}
    active={active === `${b.id}:text`}
    onActivate={() => setActive(`${b.id}:text`)}
    onDeactivate={() => setActive(null)}
    placeholder="Write a paragraph…"
  />
);

const ScheduleBody = ({ b, set, active, setActive }) => {
  const cols = b.columns || [];
  const showIntro = !!b.intro || active === `${b.id}:intro`;
  return (
    <div className="ct-sched">
      {showIntro && (
        <RichText
          value={b.intro}
          onChange={(v) => set({ intro: v })}
          active={active === `${b.id}:intro`}
          onActivate={() => setActive(`${b.id}:intro`)}
          onDeactivate={() => setActive(null)}
          placeholder="Text above the table (optional)"
        />
      )}
      <FieldInput className="ct-in-sched" value={b.title} onChange={(v) => set({ title: v })} placeholder="Schedule A" />
      <div className="ct-sched-table" role="table" aria-label="Vehicle schedule preview">
        <div className="ct-sched-row is-head" style={{ gridTemplateColumns: `repeat(${Math.max(cols.length, 1)}, minmax(0, 1fr))` }}>
          {cols.map((c) => (
            <span key={c}>{SCHEDULE_COLUMNS[c]?.label}</span>
          ))}
        </div>
        <div className="ct-sched-row" style={{ gridTemplateColumns: `repeat(${Math.max(cols.length, 1)}, minmax(0, 1fr))` }}>
          {cols.map((c) => (
            <span key={c} className="ct-muted">
              {c === "no" ? "1" : "…"}
            </span>
          ))}
        </div>
        <div className="ct-sched-note">One row per car in the booking. Drivers, plates and prices are filled when preparing the contract.</div>
      </div>
      <div className="ct-sched-cols">
        <span className="ct-mini">Columns:</span>
        {SCHEDULE_COLUMN_ORDER.map((c) => (
          <Checkbox
            key={c}
            checked={cols.includes(c)}
            onChange={(e) =>
              set({
                columns: e.target.checked
                  ? SCHEDULE_COLUMN_ORDER.filter((x) => x === c || cols.includes(x))
                  : cols.filter((x) => x !== c),
              })
            }
          >
            {SCHEDULE_COLUMNS[c].label}
          </Checkbox>
        ))}
      </div>
      <div className="ct-art-actions">
        {!showIntro && (
          <button type="button" className="ct-link" onClick={() => setActive(`${b.id}:intro`)}>
            <PlusOutlined /> Text above table
          </button>
        )}
        <label className="ct-mini" style={{ marginLeft: "auto" }}>
          <Switch size="small" checked={b.showTotals !== false} onChange={(v) => set({ showTotals: v })} /> VAT & totals rows
        </label>
      </div>
    </div>
  );
};

const PartyEditor = ({ p = {}, onChange, title }) => {
  const set = (patch) => onChange({ ...p, ...patch });
  return (
    <div className="ct-party">
      <div className="ct-party-h">{title}</div>
      <FieldInput value={p.label} onChange={(v) => set({ label: v })} placeholder="FOR THE LESSOR" />
      <FieldInput value={p.org} onChange={(v) => set({ org: v })} placeholder="Organisation" />
      <FieldInput value={p.name} onChange={(v) => set({ name: v })} placeholder="Name (or {{field}})" addonBefore="Name" />
      <FieldInput value={p.position} onChange={(v) => set({ position: v })} placeholder="Position" addonBefore="Position" />
    </div>
  );
};

const SignaturesBody = ({ b, set, num, active, setActive }) => (
  <div className="ct-art">
    <div className="ct-art-h">
      {b.numbered !== false && b.title && <span className="ct-art-n">{num}.</span>}
      <FieldInput className="ct-in-art" value={b.title} onChange={(v) => set({ title: v })} placeholder="SIGNATURES" />
    </div>
    <RichText
      value={b.intro}
      onChange={(v) => set({ intro: v })}
      active={active === `${b.id}:intro`}
      onActivate={() => setActive(`${b.id}:intro`)}
      onDeactivate={() => setActive(null)}
      placeholder="Text above the signatures (optional)"
    />
    <div className="ct-parties">
      <PartyEditor title="Lessor (company)" p={b.lessor} onChange={(v) => set({ lessor: v })} />
      <PartyEditor title="Lessee (customer) — signs online" p={b.lessee} onChange={(v) => set({ lessee: v })} />
    </div>
    <div className="ct-art-actions">
      <span className="ct-mini">The customer's e-signature appears in the lessee box after signing.</span>
      <label className="ct-mini" style={{ marginLeft: "auto" }}>
        <Switch size="small" checked={b.numbered !== false} onChange={(v) => set({ numbered: v })} /> Numbered
      </label>
    </div>
  </div>
);

/* ------------------------------------------------------------------ editor */
const DocumentEditor = ({ document, onChange }) => {
  const [active, setActive] = useState(null);
  const [libraryAt, setLibraryAt] = useState(null);
  const blocks = document?.blocks || [];
  const numbers = useMemo(() => articleNumbers(blocks), [blocks]);

  const setBlocks = (next) => onChange({ ...document, blocks: next });
  const patchBlock = (id, patch) => setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const insertAt = (index, list) => {
    const next = blocks.slice();
    next.splice(index, 0, ...list);
    setBlocks(next);
    const first = list[0];
    if (first) {
      if (first.type === "article" && first.clauses?.[0] && list.length === 1) setActive(`${first.id}:c:${first.clauses[0].id}`);
      if (first.type === "text") setActive(`${first.id}:text`);
      setTimeout(() => window.document.getElementById(`blk-${first.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
    }
  };

  return (
    <div className="ct-paper ct-paper-edit" onKeyDown={(e) => e.key === "Escape" && setActive(null)}>
      <InsertBar onAdd={(t) => insertAt(0, [newBlock(t)])} onLibrary={() => setLibraryAt(0)} />
      {blocks.map((b, i) => {
        const set = (patch) => patchBlock(b.id, patch);
        const common = { b, set, num: numbers[b.id], active, setActive };
        return (
          <React.Fragment key={b.id}>
            <div id={`blk-${b.id}`} className={`ct-block ct-block-${b.type} ${active?.startsWith(b.id) ? "is-active" : ""}`}>
              <div className="ct-block-tag">{TYPE_LABEL[b.type] || b.type}</div>
              <div className="ct-block-tools">
                <Tooltip title="Move up">
                  <button type="button" className="ct-ib" disabled={!i} onClick={() => setBlocks(moveItem(blocks, i, i - 1))}>
                    <ArrowUpOutlined />
                  </button>
                </Tooltip>
                <Tooltip title="Move down">
                  <button type="button" className="ct-ib" disabled={i === blocks.length - 1} onClick={() => setBlocks(moveItem(blocks, i, i + 1))}>
                    <ArrowDownOutlined />
                  </button>
                </Tooltip>
                <Tooltip title="Duplicate">
                  <button type="button" className="ct-ib" onClick={() => insertAt(i + 1, [cloneBlock(b)])}>
                    <CopyOutlined />
                  </button>
                </Tooltip>
                <Popconfirm
                  title={`Delete this ${(TYPE_LABEL[b.type] || "block").toLowerCase()}?`}
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => setBlocks(blocks.filter((x) => x.id !== b.id))}
                >
                  <button type="button" className="ct-ib is-danger" aria-label="Delete block">
                    <DeleteOutlined />
                  </button>
                </Popconfirm>
              </div>
              {b.type === "header" && <HeaderBody {...common} />}
              {b.type === "details" && <DetailsBody {...common} />}
              {b.type === "article" && <ArticleBody {...common} />}
              {b.type === "text" && <TextBody {...common} />}
              {b.type === "schedule" && <ScheduleBody {...common} />}
              {b.type === "signatures" && <SignaturesBody {...common} />}
              {b.type === "pageBreak" && <div className="ct-pagebreak">Page break — the next block starts on a new page</div>}
            </div>
            {i < blocks.length - 1 && <InsertBar onAdd={(t) => insertAt(i + 1, [newBlock(t)])} onLibrary={() => setLibraryAt(i + 1)} />}
          </React.Fragment>
        );
      })}
      <div style={{ marginTop: 18 }}>
        <InsertBar big onAdd={(t) => insertAt(blocks.length, [newBlock(t)])} onLibrary={() => setLibraryAt(blocks.length)} />
      </div>
      <LibraryModal
        open={libraryAt !== null}
        onClose={() => setLibraryAt(null)}
        onAdd={(list) => {
          insertAt(libraryAt ?? blocks.length, list);
          setLibraryAt(null);
        }}
      />
    </div>
  );
};

export default DocumentEditor;

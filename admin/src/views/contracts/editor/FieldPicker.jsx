// "Insert field" button: searchable list of database / custom fields.
import React, { useState } from "react";
import { Input, Popover } from "antd";
import { DatabaseOutlined, SearchOutlined } from "@ant-design/icons";
import { useEditorBus } from "./EditorBus";

export const FieldList = ({ onPick, autoFocus, maxHeight = 320 }) => {
  const bus = useEditorBus();
  const [q, setQ] = useState("");
  // not memoised: custom fields can change while the panel is open
  const needle = q.trim().toLowerCase();
  const groups = bus
      .groups()
      .map((g) => ({
        ...g,
        fields: g.fields.filter((f) => !needle || f.label.toLowerCase().includes(needle) || f.key.toLowerCase().includes(needle)),
      }))
      .filter((g) => g.fields.length);

  return (
    <div className="ct-fieldlist">
      <Input
        allowClear
        autoFocus={autoFocus}
        prefix={<SearchOutlined style={{ color: "var(--c-text-4)" }} />}
        placeholder="Search fields"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="ct-fieldlist-scroll" style={{ maxHeight }}>
        {groups.map((g) => (
          <div key={g.key} className="ct-fieldgroup">
            <div className="ct-fieldgroup-h">{g.label}</div>
            {g.fields.map((f) => (
              <button
                key={f.key}
                type="button"
                className="ct-fieldrow"
                onMouseDown={(e) => e.preventDefault() /* keep the editor's cursor */}
                onClick={() => onPick(f.key)}
                title={`Insert {{${f.key}}}`}
              >
                <span className="ct-fieldrow-l">{f.label}</span>
                <span className="ct-fieldrow-s">{f.sample}</span>
              </button>
            ))}
          </div>
        ))}
        {!groups.length && <div className="ct-muted" style={{ padding: 12 }}>No field matches “{q}”</div>}
      </div>
    </div>
  );
};

const FieldPicker = ({ onPick, label = "Insert field" }) => {
  const [open, setOpen] = useState(false);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="bottomLeft"
      arrow={false}
      destroyOnHidden
      content={
        <div style={{ width: 320 }}>
          <FieldList
            autoFocus
            onPick={(k) => {
              onPick(k);
              setOpen(false);
            }}
          />
        </div>
      }
    >
      <button type="button" className="ct-insert" onMouseDown={(e) => e.preventDefault()}>
        <DatabaseOutlined /> {label}
      </button>
    </Popover>
  );
};

export default FieldPicker;

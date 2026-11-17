// Click-to-edit rich text. Shows formatted text with {{fields}} as chips;
// becomes a Quill editor while active (only one editor is mounted at a time).
import React, { useEffect, useId, useMemo, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { escapeHtml } from "../renderContract";
import { useEditorBus } from "./EditorBus";
import FieldPicker from "./FieldPicker";

const TOOLBAR = [
  ["bold", "italic", "underline"],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ align: [] }],
  ["link", "clean"],
];
const FORMATS = ["bold", "italic", "underline", "list", "bullet", "align", "link", "indent"];

const isEmpty = (html) => !html || !String(html).replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim();

/** html with {{key}} replaced by chips showing the field name. */
export const chipify = (html, label) =>
  String(html || "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => `<span class="ct-chip" data-key="${k}">${escapeHtml(label(k))}</span>`);

const RichText = ({ value, onChange, placeholder = "Click to write…", active, onActivate, onDeactivate, className = "", minimal }) => {
  const bus = useEditorBus();
  const quillRef = useRef(null);
  const lastRange = useRef(null);
  const id = useId();
  const valueRef = useRef(value);
  valueRef.current = value;

  const modules = useMemo(() => ({ toolbar: minimal ? false : TOOLBAR, clipboard: { matchVisual: false } }), [minimal]);

  const insert = (text) => {
    const q = quillRef.current?.getEditor();
    if (!q) return;
    const range = lastRange.current || { index: q.getLength() - 1, length: 0 };
    if (range.length) q.deleteText(range.index, range.length, "user");
    q.insertText(range.index, text, "user");
    q.setSelection(range.index + text.length, 0, "user");
    lastRange.current = { index: range.index + text.length, length: 0 };
  };

  useEffect(() => {
    if (!active) return undefined;
    const q = quillRef.current?.getEditor();
    if (q) {
      q.focus();
      const len = q.getLength();
      q.setSelection(len, 0);
      lastRange.current = { index: len - 1, length: 0 };
      q.on("selection-change", (r) => {
        if (r) lastRange.current = r;
      });
    }
    bus.setTarget({ id, insert });
    return () => bus.clearTarget(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active) {
    return (
      <div
        className={`ct-rt-view ${isEmpty(value) ? "is-empty" : ""} ${className}`}
        role="button"
        tabIndex={0}
        onClick={onActivate}
        onKeyDown={(e) => (e.key === "Enter" ? onActivate?.() : null)}
        dangerouslySetInnerHTML={{ __html: isEmpty(value) ? escapeHtml(placeholder) : chipify(value, bus.label) }}
      />
    );
  }

  return (
    <div
      className={`ct-rt-edit ${className}`}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onDeactivate?.();
        }
      }}
    >
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ""}
        modules={modules}
        formats={FORMATS}
        placeholder={placeholder}
        onChange={(html, _delta, source) => {
          if (source !== "user") return;
          const next = isEmpty(html) ? "" : html;
          if (next !== valueRef.current) onChange(next);
        }}
      />
      <div className="ct-rt-bar">
        <FieldPicker onPick={(key) => insert(`{{${key}}}`)} />
        <button type="button" className="ct-link" onClick={onDeactivate}>
          Done
        </button>
      </div>
    </div>
  );
};

export default RichText;

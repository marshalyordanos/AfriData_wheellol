// Plain text input that can also receive {{fields}} from the Fields panel.
import React, { useId, useRef } from "react";
import { Input } from "antd";
import { useEditorBus } from "./EditorBus";

const FieldInput = ({ value, onChange, className = "", textarea, ...rest }) => {
  const bus = useEditorBus();
  const id = useId();
  const ref = useRef(null);
  const latest = useRef(value);
  latest.current = value;

  const el = () => (textarea ? ref.current?.resizableTextArea?.textArea : ref.current?.input);

  const insert = (text) => {
    const node = el();
    const v = latest.current || "";
    const start = node?.selectionStart ?? v.length;
    const end = node?.selectionEnd ?? v.length;
    const next = v.slice(0, start) + text + v.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      const n = el();
      if (n) {
        n.focus();
        n.setSelectionRange(start + text.length, start + text.length);
      }
    });
  };

  const Comp = textarea ? Input.TextArea : Input;
  return (
    <Comp
      ref={ref}
      value={value}
      className={`ct-input ${className}`}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => bus.setTarget({ id, insert })}
      {...rest}
    />
  );
};

export default FieldInput;

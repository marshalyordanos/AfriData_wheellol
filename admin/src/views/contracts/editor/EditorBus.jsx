// Lets the Fields panel insert {{field}} into whichever text box was used last
// (a rich-text clause or a plain input like an article title).
import React, { createContext, useContext, useMemo, useRef } from "react";
import { FIELD_GROUPS, customFieldGroup, fieldLabel } from "../contractFields";

const Ctx = createContext(null);

export const EditorBusProvider = ({ document, children }) => {
  const target = useRef(null); // { id, insert(text) }
  const docRef = useRef(document);
  docRef.current = document;
  const value = useMemo(
    () => ({
      setTarget: (t) => {
        target.current = t;
      },
      clearTarget: (id) => {
        if (target.current?.id === id) target.current = null;
      },
      hasTarget: () => !!target.current,
      insert: (text) => {
        if (!target.current) return false;
        target.current.insert(text);
        return true;
      },
      label: (key) => fieldLabel(key, docRef.current),
      groups: () => {
        const custom = customFieldGroup(docRef.current);
        return custom.fields.length ? [custom, ...FIELD_GROUPS] : FIELD_GROUPS;
      },
    }),
    [],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useEditorBus = () =>
  useContext(Ctx) || {
    setTarget: () => {},
    clearTarget: () => {},
    hasTarget: () => false,
    insert: () => false,
    label: (k) => k,
    groups: () => FIELD_GROUPS,
  };

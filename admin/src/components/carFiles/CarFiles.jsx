// Car photos (6 fixed slots + extras) and car documents (from the rental
// agreement, art. 3.2 / 5.2). Everything is optional.
// Used by the admin "Add / edit car" form and the supplier car editor.
// The keys and the form fields match car_back/src/common/car-files.ts.
import React, { useEffect, useRef } from "react";
import { message, Tooltip } from "antd";
import {
  CameraOutlined,
  CheckCircleFilled,
  DeleteOutlined,
  EyeOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  PlusOutlined,
  SwapOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import "./carFiles.css";

/* Old 6 slots (before 2026-11-18):
export const PHOTO_SLOTS = [
  { key: "front", label: "Front", hint: "Whole front with the plate" },
  { key: "back", label: "Back", hint: "Whole back with the plate" },
  { key: "left", label: "Left side", hint: "Full left side" },
  { key: "right", label: "Right side", hint: "Full right side" },
  { key: "insideFront", label: "Inside – front", hint: "Dashboard and front seats" },
  { key: "insideBack", label: "Inside – back", hint: "Back seats" },
];
*/
// The 15 photos of the WheeL LOL Vehicle Photo Guide (same keys as car-files.ts).
export const PHOTO_SLOTS = [
  { key: "front", label: "1 · Front", hint: "Whole car and the plate" },
  { key: "back", label: "2 · Back", hint: "Whole car and the plate" },
  { key: "left", label: "3 · Left side", hint: "Driver's side, front to back" },
  { key: "right", label: "4 · Right side", hint: "Other side, front to back" },
  { key: "doorFrontLeft", label: "5 · Front-left door", hint: "Driver's door, closed" },
  { key: "doorBackLeft", label: "6 · Back-left door", hint: "Behind the driver, closed" },
  { key: "doorFrontRight", label: "7 · Front-right door", hint: "Passenger's door, closed" },
  { key: "doorBackRight", label: "8 · Back-right door", hint: "Behind the passenger, closed" },
  { key: "plateFront", label: "9 · Front plate", hint: "Close up, easy to read" },
  { key: "plateBack", label: "10 · Back plate", hint: "Close up, easy to read" },
  { key: "insideFront", label: "11 · Dashboard and km", hint: "Steering wheel and km number" },
  { key: "seatDriver", label: "12 · Driver's seat", hint: "Seat and floor" },
  { key: "seatPassenger", label: "13 · Passenger seat", hint: "Seat and floor" },
  { key: "insideBack", label: "14 · Back seat", hint: "The whole back seat" },
  { key: "boot", label: "15 · Rear seats and boot", hint: "Last seats or cargo space" },
];
// Cars saved before photoSlots existed: their first 6 photos were in this order.
const LEGACY_SLOT_KEYS = ["front", "back", "left", "right", "insideFront", "insideBack"];

/* Old list (before 2026-11-18):
export const CAR_DOCUMENTS = [
  { key: "libre", label: "Vehicle registration (Libre)", am: "ሊብሬ" },
  { key: "insurance", label: "Insurance certificate", am: "ኢንሹራንስ" },
  { key: "inspection", label: "Annual inspection (Bolo)", am: "ቦሎ" },
  { key: "businessLicense", label: "Business licence", am: "ንግድ ፈቃድ" },
  { key: "vatCertificate", label: "VAT registration certificate", am: "የቫት ምዝገባ" },
  { key: "driverLicense", label: "Driver's licence", am: "መንጃ ፈቃድ" },
];
*/
// Photos 16–20 of the Vehicle Photo Guide + 2 papers from the rental agreement.
// Same keys as car_back/src/common/car-files.ts. All optional.
export const CAR_DOCUMENTS = [
  { key: "libre", label: "16 · Libre (ownership book)", am: "ሊብሬ" },
  { key: "inspection", label: "17 · Bolo (yearly inspection)", am: "ቦሎ" },
  { key: "insurance", label: "18 · Insurance", am: "ኢንሹራንስ" },
  { key: "driverLicense", label: "19 · Driver licence – front", am: "መንጃ ፈቃድ (ፊት)" },
  { key: "driverLicenseBack", label: "20 · Driver licence – back", am: "መንጃ ፈቃድ (ጀርባ)" },
  { key: "businessLicense", label: "Business licence", am: "ንግድ ፈቃድ" },
  { key: "vatCertificate", label: "VAT registration certificate", am: "የቫት ምዝገባ" },
];

// export const MAX_PHOTOS = 10;
export const MAX_PHOTOS = 20; // 15 guide photos + extras
const MAX_FILE_MB = 10;

const isPdf = (d) => /pdf$/i.test(d?.file?.type || "") || /\.pdf($|\?)/i.test(d?.url || d?.name || "");
const tooBig = (f) => f.size > MAX_FILE_MB * 1024 * 1024;
const newKey = () => `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/* ------------------------------------------------------------------ state */
export const emptyCarFiles = () => ({ slots: {}, extras: [], docs: {} });

/** Saved car → editor state. Old cars (no photoSlots): first 6 photos = the slots. */
export const carFilesFromCar = (car) => {
  const state = emptyCarFiles();
  if (!car) return state;
  const photos = car.photos || [];
  const saved = car.photoSlots && typeof car.photoSlots === "object" ? car.photoSlots : null;
  PHOTO_SLOTS.forEach((s) => {
    const li = LEGACY_SLOT_KEYS.indexOf(s.key);
    const url = saved ? saved[s.key] : li >= 0 ? photos[li] : null;
    if (url) state.slots[s.key] = { url };
  });
  const inSlots = new Set(Object.values(state.slots).map((p) => p.url));
  state.extras = photos.filter((u) => u && !inSlots.has(u)).map((url) => ({ key: url, url }));
  const docs = car.documents && typeof car.documents === "object" ? car.documents : {};
  CAR_DOCUMENTS.forEach((d) => {
    if (docs[d.key]?.url) state.docs[d.key] = { url: docs[d.key].url, name: docs[d.key].name };
  });
  if (!state.docs.inspection && car.technicalInspectionCertificateUrl) {
    state.docs.inspection = { url: car.technicalInspectionCertificateUrl, name: "Inspection certificate" };
  }
  return state;
};

/** Add the files + the JSON description to a FormData (photos[], documentFiles[]). */
export const appendCarFiles = (fd, state) => {
  let p = 0;
  let d = 0;
  const slotOut = {};
  PHOTO_SLOTS.forEach((s) => {
    const v = state.slots[s.key];
    if (!v) slotOut[s.key] = "";
    else if (v.file) {
      fd.append("photos", v.file);
      slotOut[s.key] = `new:${p++}`;
    } else slotOut[s.key] = v.url;
  });
  const extraOut = state.extras.map((x) => {
    if (!x.file) return x.url;
    fd.append("photos", x.file);
    return `new:${p++}`;
  });
  const docOut = {};
  CAR_DOCUMENTS.forEach((doc) => {
    const v = state.docs[doc.key];
    if (!v) docOut[doc.key] = "";
    else if (v.file) {
      fd.append("documentFiles", v.file);
      docOut[doc.key] = `new:${d++}`;
    } else docOut[doc.key] = v.url;
  });
  fd.append("photoSlots", JSON.stringify(slotOut));
  fd.append("extraPhotos", JSON.stringify(extraOut));
  fd.append("documents", JSON.stringify(docOut));
};

export const countCarFiles = (state) => ({
  slots: PHOTO_SLOTS.filter((s) => state.slots[s.key]).length,
  photos: PHOTO_SLOTS.filter((s) => state.slots[s.key]).length + state.extras.length,
  docs: CAR_DOCUMENTS.filter((d) => state.docs[d.key]).length,
});

/** Free object URLs when the editor goes away */
const useRevokeOnUnmount = (state) => {
  const ref = useRef(state);
  ref.current = state;
  useEffect(
    () => () => {
      const s = ref.current;
      [...Object.values(s.slots), ...s.extras, ...Object.values(s.docs)].forEach((x) => x?.preview && URL.revokeObjectURL(x.preview));
    },
    []
  );
};

/* ------------------------------------------------------------------ photos */
const PhotoTile = ({ slot, value, onPick, onRemove }) => {
  const input = useRef(null);
  const pick = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return message.error("Choose a photo (JPG or PNG)");
    if (tooBig(file)) return message.error(`The photo is bigger than ${MAX_FILE_MB} MB`);
    onPick(file);
  };
  const onDrop = (e) => {
    e.preventDefault();
    pick(e.dataTransfer.files?.[0]);
  };
  return (
    <div
      className={`cf-tile ${value ? "is-filled" : "is-empty"}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {value ? (
        <>
          <img src={value.url || value.preview} alt={slot.label} />
          <span className="cf-tile-label">
            <CheckCircleFilled /> {slot.label}
            {value.file ? <em>new</em> : null}
          </span>
          <div className="cf-tile-tools">
            <Tooltip title="Replace">
              <button type="button" onClick={() => input.current?.click()} aria-label={`Replace ${slot.label} photo`}>
                <SwapOutlined />
              </button>
            </Tooltip>
            <Tooltip title="Remove">
              <button type="button" className="is-danger" onClick={onRemove} aria-label={`Remove ${slot.label} photo`}>
                <DeleteOutlined />
              </button>
            </Tooltip>
          </div>
        </>
      ) : (
        <button type="button" className="cf-tile-empty" onClick={() => input.current?.click()}>
          <span className="cf-tile-ic">
            <CameraOutlined />
          </span>
          <b>{slot.label}</b>
          <span>{slot.hint}</span>
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
};

export const CarPhotosEditor = ({ value, onChange }) => {
  useRevokeOnUnmount(value);
  const counts = countCarFiles(value);
  const room = MAX_PHOTOS - counts.photos;

  const setSlot = (key, file) => {
    const old = value.slots[key];
    if (old?.preview) URL.revokeObjectURL(old.preview);
    onChange({ ...value, slots: { ...value.slots, [key]: file ? { file, preview: URL.createObjectURL(file) } : null } });
  };
  const addExtras = (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    e.target.value = "";
    const ok = files.filter((f) => !tooBig(f));
    if (ok.length < files.length) message.warning(`Photos bigger than ${MAX_FILE_MB} MB were skipped`);
    if (ok.length > room) message.warning(`Up to ${MAX_PHOTOS} photos — ${room} more can be added`);
    onChange({
      ...value,
      extras: [...value.extras, ...ok.slice(0, Math.max(0, room)).map((file) => ({ key: newKey(), file, preview: URL.createObjectURL(file) }))],
    });
  };
  const removeExtra = (key) => {
    const x = value.extras.find((e) => e.key === key);
    if (x?.preview) URL.revokeObjectURL(x.preview);
    onChange({ ...value, extras: value.extras.filter((e) => e.key !== key) });
  };

  return (
    <div className="cf">
      <div className="cf-head">
        <span className="cf-count">
          <b>{counts.slots}</b> of {PHOTO_SLOTS.length} photos
        </span>
        <div className="cf-bar">
          <span style={{ width: `${(counts.slots / PHOTO_SLOTS.length) * 100}%` }} />
        </div>
        <span className="cf-optional">Optional</span>
      </div>
      <div className="cf-grid">
        {PHOTO_SLOTS.map((s) => (
          <PhotoTile
            key={s.key}
            slot={s}
            value={value.slots[s.key]}
            onPick={(f) => setSlot(s.key, f)}
            onRemove={() => setSlot(s.key, null)}
          />
        ))}
      </div>

      <div className="cf-sub">More photos {value.extras.length ? `(${value.extras.length})` : ""}</div>
      <div className="cf-grid cf-grid-sm">
        {value.extras.map((x) => (
          <div key={x.key} className="cf-tile is-filled">
            <img src={x.url || x.preview} alt="Extra" />
            {x.file && (
              <span className="cf-tile-label">
                <em>new</em>
              </span>
            )}
            <div className="cf-tile-tools">
              <Tooltip title="Remove">
                <button type="button" className="is-danger" onClick={() => removeExtra(x.key)} aria-label="Remove photo">
                  <DeleteOutlined />
                </button>
              </Tooltip>
            </div>
          </div>
        ))}
        {room > 0 && (
          <label className="cf-tile cf-add">
            <PlusOutlined />
            <span>Add photos</span>
            <input type="file" accept="image/*" multiple hidden onChange={addExtras} />
          </label>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ documents */
const DocRow = ({ doc, value, onPick, onRemove, readOnly }) => {
  const input = useRef(null);
  const pick = (file) => {
    if (!file) return;
    if (!(file.type.startsWith("image/") || file.type === "application/pdf")) return message.error("Choose a photo or a PDF");
    if (tooBig(file)) return message.error(`The file is bigger than ${MAX_FILE_MB} MB`);
    onPick(file);
  };
  const href = value?.url || value?.preview;
  const pdf = value && isPdf(value);
  return (
    <div
      className={`cf-doc ${value ? "is-done" : ""}`}
      onDragOver={(e) => !readOnly && e.preventDefault()}
      onDrop={(e) => {
        if (readOnly) return;
        e.preventDefault();
        pick(e.dataTransfer.files?.[0]);
      }}
    >
      <span className="cf-doc-ic">
        {value && !pdf && href ? <img src={href} alt="" /> : pdf ? <FilePdfOutlined /> : <FileImageOutlined />}
      </span>
      <div className="cf-doc-main">
        <b>{doc.label}</b>
        <span>
          {value ? (
            <>
              <CheckCircleFilled className="cf-ok" /> {value.file ? `${value.file.name} · new` : value.name || (pdf ? "PDF" : "Added")}
            </>
          ) : (
            <>{doc.am} · not added</>
          )}
        </span>
      </div>
      <div className="cf-doc-tools">
        {value && href && (
          <Tooltip title="Open">
            <a className="cf-ib" href={href} target="_blank" rel="noreferrer" aria-label={`Open ${doc.label}`}>
              <EyeOutlined />
            </a>
          </Tooltip>
        )}
        {!readOnly && (value ? (
          <>
            <Tooltip title="Replace">
              <button type="button" className="cf-ib" onClick={() => input.current?.click()} aria-label={`Replace ${doc.label}`}>
                <SwapOutlined />
              </button>
            </Tooltip>
            <Tooltip title="Remove">
              <button type="button" className="cf-ib is-danger" onClick={onRemove} aria-label={`Remove ${doc.label}`}>
                <DeleteOutlined />
              </button>
            </Tooltip>
          </>
        ) : (
          <button type="button" className="cf-upload" onClick={() => input.current?.click()}>
            <UploadOutlined /> Upload
          </button>
        ))}
      </div>
      {!readOnly && (
        <input
          ref={input}
          type="file"
          accept="image/*,application/pdf"
          hidden
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      )}
    </div>
  );
};

export const CarDocumentsEditor = ({ value, onChange, readOnly = false }) => {
  const counts = countCarFiles(value);
  const setDoc = (key, file) => {
    const old = value.docs[key];
    if (old?.preview) URL.revokeObjectURL(old.preview);
    onChange?.({
      ...value,
      docs: { ...value.docs, [key]: file ? { file, name: file.name, preview: URL.createObjectURL(file) } : null },
    });
  };
  return (
    <div className="cf">
      <div className="cf-head">
        <span className="cf-count">
          <b>{counts.docs}</b> of {CAR_DOCUMENTS.length} documents
        </span>
        <div className="cf-bar">
          <span style={{ width: `${(counts.docs / CAR_DOCUMENTS.length) * 100}%` }} />
        </div>
        {!readOnly && <span className="cf-optional">Optional · photo or PDF</span>}
      </div>
      <div className="cf-docs">
        {CAR_DOCUMENTS.map((d) => (
          <DocRow
            key={d.key}
            doc={d}
            value={value.docs[d.key]}
            readOnly={readOnly}
            onPick={(f) => setDoc(d.key, f)}
            onRemove={() => setDoc(d.key, null)}
          />
        ))}
      </div>
    </div>
  );
};

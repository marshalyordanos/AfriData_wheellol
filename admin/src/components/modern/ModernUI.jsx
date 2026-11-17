import React from "react";
import { Input, Dropdown, Tooltip } from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  CloseOutlined,
  MoreOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "./modern.css";

/* ============================================================
   Tokens
   ============================================================ */
export const ACCENTS = {
  orange: { c: "#fc6b38", s: "#fff1ea" },
  navy: { c: "#1d4f91", s: "#eaf1fb" },
  indigo: { c: "#4f46e5", s: "#eef2ff" },
  amber: { c: "#d97706", s: "#fef6e4" },
  red: { c: "#dc2626", s: "#fdecec" },
  rose: { c: "#e11d48", s: "#fdebf0" },
  green: { c: "#059669", s: "#e7f8f1" },
  sky: { c: "#0284c7", s: "#e8f5fc" },
  violet: { c: "#7c3aed", s: "#f3edff" },
  gray: { c: "#94a3b8", s: "#f1f5f9" },
};

/* ============================================================
   Page shell + header
   ============================================================ */
export const Page = ({ children, className = "" }) => (
  <div className={`mp ${className}`}>{children}</div>
);

export const PageHeader = ({ eyebrow, title, subtitle, actions, back }) => {
  const navigate = useNavigate();
  return (
    <div className="mp-header">
      <div className="flex items-start gap-3 min-w-0">
        {back && (
          <button
            className="mp-btn mp-btn-icon"
            aria-label="Go back"
            onClick={() =>
              typeof back === "function" ? back() : typeof back === "string" ? navigate(back) : navigate(-1)
            }
          >
            <ArrowLeftOutlined />
          </button>
        )}
        <div className="min-w-0">
          {eyebrow && <div className="mp-eyebrow">{eyebrow}</div>}
          <h1 className="mp-title">{title}</h1>
          {subtitle && <p className="mp-subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
};

export const Btn = ({ variant = "default", icon, children, className = "", ...rest }) => (
  <button
    className={`mp-btn ${variant === "primary" ? "mp-btn-primary" : ""} ${
      variant === "danger" ? "mp-btn-danger" : ""
    } ${!children ? "mp-btn-icon" : ""} ${className}`}
    {...rest}
  >
    {icon}
    {children}
  </button>
);

export const ReloadBtn = ({ onClick, loading }) => (
  <Tooltip title="Refresh">
    <button className="mp-btn mp-btn-icon" aria-label="Refresh" onClick={onClick}>
      <ReloadOutlined spin={!!loading} />
    </button>
  </Tooltip>
);

/* ============================================================
   Stats
   ============================================================ */
export const StatCard = ({ label, value, icon: Icon, accent = "orange", foot, percent, active, onClick, extra }) => {
  const a = ACCENTS[accent] || ACCENTS.orange;
  return (
    <div
      className={`mp-stat ${onClick ? "is-clickable" : ""} ${active ? "is-active" : ""}`}
      style={{ "--mp-accent": a.c, "--mp-accent-soft": a.s }}
      onClick={onClick}
    >
      <div className="mp-stat-top">
        <span className="mp-stat-label">{label}</span>
        {Icon && (
          <span className="mp-stat-icon">
            <Icon />
          </span>
        )}
      </div>
      <div className="mp-stat-value">{value}</div>
      {extra && <div style={{ position: "relative", zIndex: 1, marginTop: 10 }}>{extra}</div>}
      {(foot || typeof percent === "number") && (
        <div className="mp-stat-foot">
          {typeof percent === "number" && (
            <span className="mp-stat-bar">
              <span style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
            </span>
          )}
          {foot && <span>{foot}</span>}
        </div>
      )}
    </div>
  );
};

/** Bordered horizontal strip of numbers — the design's summary row. */
export const StatsStrip = ({ items = [] }) => (
  <section className="mp-strip" aria-label="Summary">
    {items.map((s) => (
      <div
        key={s.label}
        className={`mp-strip-item ${s.onClick ? "is-clickable" : ""} ${s.active ? "is-active" : ""}`}
        onClick={s.onClick}
      >
        <div className="mp-strip-label">
          <span className="mp-dot" style={{ background: s.color || "#09234c" }} />
          {s.label}
        </div>
        <div className="mp-strip-value">{s.value ?? 0}</div>
        {s.note && <div className="mp-strip-note">{s.note}</div>}
      </div>
    ))}
  </section>
);

/* ============================================================
   Table card: tabs + toolbar + chips + content + footer
   ============================================================ */
export const TableCard = ({
  tabs,
  activeTab,
  onTabChange,
  search,
  filters,
  right,
  chips,
  onClearChips,
  resultLabel,
  children,
  footer,
}) => {
  const activeChips = (chips || []).filter(Boolean);
  return (
    <section className="mp-card mp-tcard">
      {tabs && tabs.length > 0 && (
        <div className="mp-tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={String(t.key)}
              role="tab"
              aria-selected={activeTab === t.key}
              className={`mp-tab ${activeTab === t.key ? "is-active" : ""}`}
              onClick={() => onTabChange && onTabChange(t.key)}
            >
              {t.label}
              {t.count !== undefined && t.count !== null && (
                <span className="mp-tab-count">{t.count}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {(search || filters || right) && (
        <div className="mp-toolbar">
          {search && (
            <div className="mp-grow">
              <Input
                prefix={<SearchOutlined />}
                placeholder={search.placeholder || "Search"}
                value={search.value}
                onChange={search.onChange}
                onPressEnter={search.onPressEnter}
                allowClear
              />
            </div>
          )}
          {filters}
          {right && <div className="mp-toolbar-right">{right}</div>}
        </div>
      )}

      {(activeChips.length > 0 || resultLabel) && (
        <div className="mp-chips">
          {activeChips.length > 0 && <span className="mp-chips-label">Filtered by</span>}
          {activeChips.map((c) => (
            <span key={c.k} className="mp-fchip">
              <span className="k">{c.k}:</span> <b>{c.v}</b>
              {c.onRemove && (
                <button aria-label={`Remove ${c.k} filter`} onClick={c.onRemove}>
                  <CloseOutlined />
                </button>
              )}
            </span>
          ))}
          {activeChips.length > 0 && onClearChips && (
            <button className="mp-link" onClick={onClearChips}>
              Clear all
            </button>
          )}
          <span style={{ flex: 1 }} />
          {resultLabel && <span className="mp-chips-label">{resultLabel}</span>}
        </div>
      )}

      {children}
      {footer}
    </section>
  );
};

/* ============================================================
   Pills, avatars, cells
   ============================================================ */
const STATUS_TONE = (s) => {
  const v = String(s || "").toLowerCase();
  if (!v) return "gray";
  if (v.includes("cancel") || v.includes("fail") || v.includes("declin") || v.includes("reject") || v === "inactive" || v.includes("expired"))
    return "red";
  if (v.includes("complete") || v.includes("paid") || v === "success" || v.includes("succe") || v === "active" || v.includes("approved") || v.includes("resolved") || v.includes("verified"))
    return "green";
  if (v.includes("pending") || v.includes("await") || v === "new" || v.includes("unpaid") || v.includes("partial") || v.includes("review") || v.includes("open"))
    return "amber";
  if (v.includes("confirm") || v.includes("progress") || v.includes("assigned") || v.includes("ongoing") || v.includes("processing"))
    return "blue";
  if (v.includes("refund")) return "gray";
  return "violet";
};

export const prettyStatus = (s) => {
  if (s === null || s === undefined || s === "") return "N/A";
  return String(s)
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

export const StatusPill = ({ status, tone, children }) => (
  <span className={`mp-pill mp-pill-${tone || STATUS_TONE(status)}`}>
    {children || prettyStatus(status)}
  </span>
);

export const ActivePill = ({ active, on = "Active", off = "Inactive" }) => (
  <StatusPill tone={active ? "green" : "gray"}>{active ? on : off}</StatusPill>
);

const AVATAR_COLORS = [
  ["#fff1ea", "#c2410c"],
  ["#eaf1fb", "#1d4f91"],
  ["#e7f8f1", "#047857"],
  ["#f3edff", "#6d28d9"],
  ["#fef6e4", "#b45309"],
  ["#e8f5fc", "#0369a1"],
  ["#fdebf0", "#be123c"],
];

export const initialsOf = (name = "") =>
  String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "?";

export const Avatar = ({ name = "", src, size = 32 }) => {
  const clean = String(name || "").trim();
  const idx = [...clean].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const [bg, fg] = AVATAR_COLORS[idx];
  if (src)
    return (
      <img
        src={src}
        alt=""
        className="mp-avatar"
        style={{ width: size, height: size, objectFit: "cover" }}
      />
    );
  return (
    <span
      className="mp-avatar"
      style={{ background: bg, color: fg, width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initialsOf(clean)}
    </span>
  );
};

export const fullName = (p) => (p ? `${p.firstName || ""} ${p.lastName || ""}`.trim() : "");

export const PersonCell = ({ person, name, sub, src }) => {
  const n = name || fullName(person);
  if (!n) return <span className="mp-muted">—</span>;
  const s = sub !== undefined ? sub : person?.phone || person?.phoneNumber || person?.email;
  return (
    <div className="mp-cell">
      <Avatar name={n} src={src || person?.profilePhoto} />
      <div className="min-w-0">
        <div className="mp-cell-main">{n}</div>
        {s && <div className="mp-cell-sub">{s}</div>}
      </div>
    </div>
  );
};

/** Square icon/thumbnail + title + subtitle. */
export const ThumbCell = ({ icon, img, title, sub, wide }) => (
  <div className="mp-cell">
    {img ? (
      <img src={img} alt="" className={`mp-thumb ${wide ? "is-wide" : ""}`} />
    ) : (
      <span className={`mp-thumb ${wide ? "is-wide" : ""}`}>{icon}</span>
    )}
    <div className="min-w-0">
      <div className="mp-cell-main">{title || "—"}</div>
      {sub && <div className="mp-cell-sub">{sub}</div>}
    </div>
  </div>
);

export const TwoLine = ({ main, sub, align }) => (
  <div style={{ textAlign: align }}>
    <div className="mp-cell-main" style={{ fontWeight: 500 }}>
      {main ?? "—"}
    </div>
    {sub && <div className="mp-cell-sub">{sub}</div>}
  </div>
);

/** The "…" menu used at the end of table rows. items: [{key,label,icon,danger}] */
export const RowMenu = ({ items, onClick, record }) => (
  <div onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex" }}>
    <Dropdown
      menu={{
        items,
        onClick: (info) => {
          info?.domEvent?.stopPropagation();
          onClick && onClick(info, record);
        },
      }}
      trigger={["click"]}
      placement="bottomRight"
    >
      <button className="mp-iconbtn" aria-label="More actions">
        <MoreOutlined />
      </button>
    </Dropdown>
  </div>
);

/** Standard action column placed at the END of a table. */
export const actionColumn = (render) => ({
  title: "",
  dataIndex: "__actions",
  key: "__actions",
  fixed: "right",
  width: 64,
  align: "right",
  render,
});

/* ============================================================
   Generic card + detail building blocks
   ============================================================ */
export const Card = ({ title, subtitle, extra, children, bodyClass = "mp-card-body", className = "", style }) => (
  <div className={`mp-card ${className}`} style={style}>
    {(title || extra) && (
      <div className="mp-card-head">
        <div className="min-w-0">
          {title && <div className="mp-card-title">{title}</div>}
          {subtitle && <div className="mp-card-sub">{subtitle}</div>}
        </div>
        {extra}
      </div>
    )}
    <div className={bodyClass}>{children}</div>
  </div>
);

/** label/value grid for detail pages. items: [{label, value, span}] */
export const InfoGrid = ({ items = [], cols = 2 }) => (
  <dl className="mp-info" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
    {items.filter(Boolean).map((it, i) => (
      <div key={i} className="mp-info-item" style={it.span ? { gridColumn: `span ${it.span}` } : undefined}>
        <dt>{it.label}</dt>
        <dd>{it.value === null || it.value === undefined || it.value === "" ? "—" : it.value}</dd>
      </div>
    ))}
  </dl>
);

export const KeyValueList = ({ rows = [] }) => (
  <div className="mp-kv">
    {rows.filter(Boolean).map((r, i) => (
      <div key={i} className={`mp-kv-row ${r.strong ? "is-strong" : ""}`}>
        <span>{r.label}</span>
        <span>{r.value ?? "—"}</span>
      </div>
    ))}
  </div>
);

export const EmptyState = ({ icon, title = "Nothing here yet", text }) => (
  <div className="mp-empty">
    {icon && <div className="mp-empty-icon">{icon}</div>}
    <div className="mp-empty-title">{title}</div>
    {text && <div>{text}</div>}
  </div>
);

/** Form section with numbered header (booking form style). */
export const FormSection = ({ num, title, subtitle, extra, children }) => (
  <section className="mp-fsec">
    <div className="mp-fsec-h">
      {num !== undefined && <span className="mp-num">{num}</span>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2>{title}</h2>
        {subtitle && <div className="mp-card-sub">{subtitle}</div>}
      </div>
      {extra}
    </div>
    <div className="mp-fsec-b">{children}</div>
  </section>
);


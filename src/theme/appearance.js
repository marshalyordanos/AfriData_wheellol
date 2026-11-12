/* ------------------------------------------------------------------
   Appearance: light/dark mode, accent colour and sidebar style.
   One source of truth → CSS variables on <html> + the antd theme.
   ------------------------------------------------------------------ */
import { theme as antdTheme } from "antd/es";

export const STORAGE_KEY = "wheellol:appearance";

export const DEFAULTS = { mode: "light", accent: "orange", sidebar: "light", density: "comfortable" };

/** base = charts/rings/fills, strong = buttons (white text ≥ 4.5:1), hover = pressed */
export const ACCENT_PRESETS = {
  orange: { label: "Wheellol orange", base: "#fc6b38", strong: "#c2410c", hover: "#9a3412" },
  blue: { label: "Ocean blue", base: "#3b82f6", strong: "#1d4ed8", hover: "#1e40af" },
  emerald: { label: "Emerald", base: "#10b981", strong: "#047857", hover: "#065f46" },
  violet: { label: "Violet", base: "#8b5cf6", strong: "#6d28d9", hover: "#5b21b6" },
  rose: { label: "Rose", base: "#f43f5e", strong: "#be123c", hover: "#9f1239" },
  teal: { label: "Teal", base: "#14b8a6", strong: "#0f766e", hover: "#115e59" },
  amber: { label: "Amber", base: "#f59e0b", strong: "#b45309", hover: "#92400e" },
  navy: { label: "Wheellol navy", base: "#2f5ea8", strong: "#09234c", hover: "#061a39" },
};

export const SIDEBAR_STYLES = {
  light: { label: "Light", sub: "Same as the page" },
  navy: { label: "Navy", sub: "Wheellol brand navy" },
  dark: { label: "Charcoal", sub: "Dark, high contrast" },
  accent: { label: "Accent", sub: "Your accent colour" },
};

export const MODES = {
  light: { label: "Light" },
  dark: { label: "Dark" },
  system: { label: "System" },
};

const NEUTRALS = {
  light: {
    bg: "#ffffff",
    surface: "#ffffff",
    elevated: "#ffffff",
    subtle: "#f8fafc",
    muted: "#f1f5f9",
    border: "#eceef2",
    borderStrong: "#e2e6ec",
    borderHover: "#cbd5e1",
    text: "#0f172a",
    text2: "#475569",
    text3: "#64748b",
    text4: "#94a3b8",
    glass: "rgba(255,255,255,.92)",
    shadow: "rgba(15,23,42,.08)",
  },
  dark: {
    bg: "#0b0f17",
    surface: "#111722",
    elevated: "#161d2a",
    subtle: "#161d2a",
    muted: "#1c2433",
    border: "#212a3a",
    borderStrong: "#2a3446",
    borderHover: "#3a465c",
    text: "#e8ecf3",
    text2: "#b6c0cf",
    text3: "#8c97a9",
    text4: "#677285",
    glass: "rgba(17,23,34,.88)",
    shadow: "rgba(0,0,0,.45)",
  },
};

/* --- tiny colour helpers --- */
const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgbToHex = (r, g, b) =>
  "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
/** mix(a, b, t): t=0 → a, t=1 → b */
export const mix = (a, b, t) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(...A.map((v, i) => v + (B[i] - v) * t));
};
export const rgba = (hex, alpha) => `rgba(${hexToRgb(hex).join(",")},${alpha})`;

export const resolveMode = (mode) => {
  if (mode !== "system") return mode;
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch (e) {
    return "light";
  }
};

/** Everything the CSS and antd need, as plain colour values. */
export const buildPalette = (settings) => {
  const s = { ...DEFAULTS, ...settings };
  const mode = resolveMode(s.mode);
  const n = NEUTRALS[mode];
  const a = ACCENT_PRESETS[s.accent] || ACCENT_PRESETS.orange;
  const dark = mode === "dark";

  const primary = {
    base: a.base,
    strong: a.strong,
    hover: a.hover,
    // readable accent text on the page background
    text: dark ? mix(a.base, "#ffffff", 0.25) : a.strong,
    soft: dark ? mix(n.surface, a.base, 0.16) : mix("#ffffff", a.base, 0.08),
    soft2: dark ? mix(n.surface, a.base, 0.3) : mix("#ffffff", a.base, 0.22),
    ring: rgba(a.base, dark ? 0.28 : 0.15),
    ringStrong: rgba(a.base, 0.55),
  };

  // Sidebar
  let side;
  if (s.sidebar === "navy" || s.sidebar === "dark" || s.sidebar === "accent") {
    const bg = s.sidebar === "navy" ? "#09234c" : s.sidebar === "dark" ? "#0b0f17" : a.strong;
    const onAccent = s.sidebar === "accent";
    side = {
      bg,
      border: rgba("#ffffff", 0.08),
      text: rgba("#ffffff", 0.78),
      text2: rgba("#ffffff", 0.55),
      hover: rgba("#ffffff", 0.08),
      activeBg: onAccent ? rgba("#ffffff", 0.18) : rgba(a.base, 0.2),
      activeText: onAccent ? "#ffffff" : mix(a.base, "#ffffff", 0.35),
      strong: "#ffffff",
      card: rgba("#ffffff", 0.06),
      mark: onAccent ? rgba("#ffffff", 0.16) : rgba("#ffffff", 0.1),
    };
  } else {
    side = {
      bg: n.surface,
      border: n.border,
      text: n.text2,
      text2: n.text3,
      hover: n.subtle,
      activeBg: primary.soft,
      activeText: primary.text,
      strong: n.text,
      card: "transparent",
      mark: "#09234c",
    };
  }

  return { mode, dark, n, primary, side, settings: s };
};

/** Write the palette to CSS variables on <html>. */
export const applyPalette = (p) => {
  const root = document.documentElement;
  const vars = {
    "--c-bg": p.n.bg,
    "--c-surface": p.n.surface,
    "--c-elevated": p.n.elevated,
    "--c-subtle": p.n.subtle,
    "--c-muted": p.n.muted,
    "--c-border": p.n.border,
    "--c-border-strong": p.n.borderStrong,
    "--c-border-hover": p.n.borderHover,
    "--c-text": p.n.text,
    "--c-text-2": p.n.text2,
    "--c-text-3": p.n.text3,
    "--c-text-4": p.n.text4,
    "--c-glass": p.n.glass,
    "--c-shadow": p.n.shadow,
    "--c-primary": p.primary.base,
    "--c-primary-strong": p.primary.strong,
    "--c-primary-hover": p.primary.hover,
    "--c-primary-text": p.primary.text,
    "--c-primary-soft": p.primary.soft,
    "--c-primary-soft-2": p.primary.soft2,
    "--c-primary-ring": p.primary.ring,
    "--c-primary-ring-strong": p.primary.ringStrong,
    // legacy names used across the older pages
    "--color-primary": p.primary.base,
    "--color-primary-strong": p.primary.strong,
    "--side-bg": p.side.bg,
    "--side-border": p.side.border,
    "--side-text": p.side.text,
    "--side-text-2": p.side.text2,
    "--side-hover": p.side.hover,
    "--side-active-bg": p.side.activeBg,
    "--side-active-text": p.side.activeText,
    "--side-strong": p.side.strong,
    "--side-card": p.side.card,
    "--side-mark": p.side.mark,
  };
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  root.dataset.theme = p.mode;
  root.dataset.sidebar = p.settings.sidebar;
  root.dataset.density = p.settings.density;
  root.style.colorScheme = p.mode;
};

/** antd theme for the palette. */
export const buildAntdTheme = (p) => {
  const { n, primary, dark } = p;
  const compact = p.settings.density === "compact";
  return {
    algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: primary.strong,
      colorLink: primary.text,
      colorLinkHover: primary.base,
      colorInfo: dark ? "#60a5fa" : "#1d4f91",
      colorSuccess: "#059669",
      colorWarning: "#d97706",
      colorError: dark ? "#f97066" : "#d92d20",
      colorText: n.text,
      colorTextSecondary: n.text2,
      colorTextTertiary: n.text3,
      colorTextQuaternary: n.text4,
      colorTextPlaceholder: n.text4,
      colorBorder: dark ? n.borderStrong : "#dfe3ea",
      colorBorderSecondary: n.border,
      colorBgLayout: n.bg,
      colorBgContainer: n.surface,
      colorBgElevated: n.elevated,
      colorBgContainerDisabled: n.subtle,
      colorFillAlter: n.subtle,
      fontFamily: '"DM Sans", system-ui, -apple-system, sans-serif',
      fontSize: 14,
      borderRadius: 12,
      borderRadiusSM: 8,
      borderRadiusLG: 16,
      controlHeight: compact ? 38 : 44,
      controlHeightSM: compact ? 30 : 34,
      controlHeightLG: compact ? 44 : 50,
      controlPaddingHorizontal: 14,
      controlOutline: primary.ring,
      controlOutlineWidth: 4,
      controlItemBgActive: primary.soft,
      controlItemBgHover: n.subtle,
    },
    components: {
      Button: { fontWeight: 600, primaryShadow: `0 6px 16px -8px ${rgba(primary.strong, 0.7)}`, paddingInline: 18 },
      Input: {
        paddingInline: 14,
        paddingBlock: compact ? 7 : 10,
        hoverBorderColor: n.borderHover,
        activeBorderColor: primary.base,
        activeShadow: `0 0 0 4px ${primary.ring}`,
        errorActiveShadow: "0 0 0 4px rgba(240,68,56,0.12)",
        addonBg: n.subtle,
      },
      InputNumber: {
        paddingInline: 14,
        hoverBorderColor: n.borderHover,
        activeBorderColor: primary.base,
        activeShadow: `0 0 0 4px ${primary.ring}`,
        handleWidth: 26,
      },
      Select: {
        hoverBorderColor: n.borderHover,
        activeBorderColor: primary.base,
        activeOutlineColor: primary.ring,
        optionSelectedBg: primary.soft,
        optionSelectedColor: primary.text,
        optionActiveBg: n.subtle,
        optionHeight: 38,
        optionPadding: "9px 12px",
        multipleItemBg: n.muted,
        multipleItemHeight: compact ? 26 : 30,
        showArrowPaddingInlineEnd: 34,
      },
      DatePicker: {
        hoverBorderColor: n.borderHover,
        activeBorderColor: primary.base,
        activeShadow: `0 0 0 4px ${primary.ring}`,
        cellHoverBg: n.subtle,
        cellActiveWithRangeBg: primary.soft,
        cellRangeBorderColor: primary.soft2,
        paddingInline: 14,
      },
      Form: {
        labelColor: dark ? n.text2 : "#334155",
        labelFontSize: 13,
        itemMarginBottom: compact ? 14 : 20,
        verticalLabelPadding: "0 0 7px",
        labelRequiredMarkColor: primary.strong,
      },
      Checkbox: { borderRadiusSM: 5 },
      Switch: { colorPrimary: primary.strong, colorPrimaryHover: primary.hover },
      Upload: { actionsColor: n.text2 },
      Pagination: { itemActiveBg: dark ? primary.strong : "#09234c", itemSize: 34 },
      Table: {
        headerBg: n.subtle,
        headerColor: n.text3,
        rowHoverBg: dark ? n.subtle : "#fbfcfe",
        borderColor: n.border,
        cellPaddingBlock: compact ? 10 : 16,
      },
      Modal: { borderRadiusLG: 18, contentBg: n.surface, headerBg: n.surface },
      Drawer: { colorBgElevated: n.surface },
      Tabs: { inkBarColor: primary.base, itemSelectedColor: n.text, itemHoverColor: n.text },
      Menu: { itemBorderRadius: 10 },
      Card: { borderRadiusLG: 16 },
      Segmented: { itemSelectedBg: dark ? n.borderStrong : "#ffffff", trackBg: n.muted },
    },
  };
};

export const loadSettings = () => {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {}) };
  } catch (e) {
    return { ...DEFAULTS };
  }
};

export const saveSettings = (s) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (e) {
    /* private mode */
  }
};

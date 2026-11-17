import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./components/modern/modern.css";
import "./components/modern/fields.css";
import "./theme/theme.css";
import AppearanceProvider from "./theme/AppearanceProvider";
import { applyPalette, buildPalette, loadSettings } from "./theme/appearance";

import { store } from "./redux/stor.js";
import { Provider } from "react-redux";
import { setup } from "./api/api.js";
import { BrowserRouter } from "react-router-dom";

// paint the saved theme before React renders (no light flash in dark mode)
applyPalette(buildPalette(loadSettings()));
requestAnimationFrame(() => document.documentElement.classList.add("theme-ready"));

/* Old fixed theme — replaced by src/theme/appearance.js (buildAntdTheme),
   which builds the same tokens for light/dark and any accent colour.
const theme = {
  token: {
    colorPrimary: "#c2410c",
    colorLink: "#c2410c",
    colorInfo: "#1d4f91",
    colorSuccess: "#059669",
    colorWarning: "#d97706",
    colorError: "#d92d20",
    colorText: "#0f172a",
    colorTextSecondary: "#475569",
    colorTextTertiary: "#64748b",
    colorBorder: "#dfe3ea",
    colorTextPlaceholder: "#94a3b8",
    colorBgContainerDisabled: "#f8fafc",
    colorBorderSecondary: "#eef0f4",
    colorBgLayout: "#ffffff",
    fontFamily: '"DM Sans", system-ui, -apple-system, sans-serif',
    fontSize: 14,
    borderRadius: 12,
    borderRadiusSM: 8,
    borderRadiusLG: 16,
    controlHeight: 44,
    controlHeightSM: 34,
    controlHeightLG: 50,
    controlPaddingHorizontal: 14,
    controlOutline: "rgba(252,107,56,0.15)",
    controlOutlineWidth: 4,
    controlItemBgActive: "#fff4ef",
    controlItemBgHover: "#f8fafc",
  },
  components: {
    Button: { fontWeight: 600, primaryShadow: "0 6px 16px -8px rgba(194,65,12,.7)", paddingInline: 18 },
    Input: {
      paddingInline: 14,
      paddingBlock: 10,
      hoverBorderColor: "#c3cad6",
      activeBorderColor: "#fc6b38",
      activeShadow: "0 0 0 4px rgba(252,107,56,0.15)",
      errorActiveShadow: "0 0 0 4px rgba(240,68,56,0.12)",
      addonBg: "#f8fafc",
    },
    InputNumber: {
      paddingInline: 14,
      hoverBorderColor: "#c3cad6",
      activeBorderColor: "#fc6b38",
      activeShadow: "0 0 0 4px rgba(252,107,56,0.15)",
      handleWidth: 26,
    },
    Select: {
      hoverBorderColor: "#c3cad6",
      activeBorderColor: "#fc6b38",
      activeOutlineColor: "rgba(252,107,56,0.15)",
      optionSelectedBg: "#fff4ef",
      optionSelectedColor: "#9a3412",
      optionActiveBg: "#f8fafc",
      optionHeight: 38,
      optionPadding: "9px 12px",
      multipleItemBg: "#f1f5f9",
      multipleItemHeight: 30,
      showArrowPaddingInlineEnd: 34,
    },
    DatePicker: {
      hoverBorderColor: "#c3cad6",
      activeBorderColor: "#fc6b38",
      activeShadow: "0 0 0 4px rgba(252,107,56,0.15)",
      cellHoverBg: "#f8fafc",
      cellActiveWithRangeBg: "#fff4ef",
      cellRangeBorderColor: "#fdc9b2",
      paddingInline: 14,
    },
    Form: {
      labelColor: "#334155",
      labelFontSize: 13,
      itemMarginBottom: 20,
      verticalLabelPadding: "0 0 7px",
      labelRequiredMarkColor: "#c2410c",
    },
    Checkbox: { borderRadiusSM: 5 },
    Switch: { colorPrimary: "#c2410c", colorPrimaryHover: "#9a3412" },
    Upload: { actionsColor: "#475569" },
    Pagination: { itemActiveBg: "#09234c", itemSize: 34 },
    Table: { headerBg: "#f8fafc", headerColor: "#64748b", rowHoverBg: "#fbfcfe", borderColor: "#eef0f4" },
    Modal: { borderRadiusLG: 18 },
    Tabs: { inkBarColor: "#fc6b38", itemSelectedColor: "#0f172a", itemHoverColor: "#0f172a" },
    Menu: { itemBorderRadius: 10 },
    Card: { borderRadiusLG: 16 },
    Segmented: { itemSelectedBg: "#ffffff", trackBg: "#f1f5f9" },
  },
};
*/

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <BrowserRouter>
      <AppearanceProvider>
        <App />
      </AppearanceProvider>
    </BrowserRouter>
  </Provider>
);

setup(store);

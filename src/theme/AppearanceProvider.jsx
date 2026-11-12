import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ConfigProvider } from "antd";
import {
  DEFAULTS,
  applyPalette,
  buildAntdTheme,
  buildPalette,
  loadSettings,
  saveSettings,
} from "./appearance";
import AppearanceDrawer from "./AppearanceDrawer";

const Ctx = createContext(null);

export const useAppearance = () => useContext(Ctx);

export const AppearanceProvider = ({ children }) => {
  const [settings, setSettings] = useState(loadSettings);
  const [open, setOpen] = useState(false);
  const [systemDark, setSystemDark] = useState(() => {
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch (e) {
      return false;
    }
  });

  // follow the OS when mode = system
  useEffect(() => {
    let mq;
    try {
      mq = window.matchMedia("(prefers-color-scheme: dark)");
    } catch (e) {
      return undefined;
    }
    const on = (e) => setSystemDark(e.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);

  const palette = useMemo(() => buildPalette(settings), [settings, systemDark]);
  const antdTheme = useMemo(() => buildAntdTheme(palette), [palette]);

  useEffect(() => {
    applyPalette(palette);
    saveSettings(settings);
  }, [palette]);

  const value = useMemo(
    () => ({
      settings,
      palette,
      isDark: palette.dark,
      update: (patch) => setSettings((s) => ({ ...s, ...patch })),
      reset: () => setSettings({ ...DEFAULTS }),
      openSettings: () => setOpen(true),
      closeSettings: () => setOpen(false),
    }),
    [settings, palette]
  );

  return (
    <Ctx.Provider value={value}>
      <ConfigProvider theme={antdTheme}>
        {children}
        <AppearanceDrawer open={open} onClose={() => setOpen(false)} />
      </ConfigProvider>
    </Ctx.Provider>
  );
};

export default AppearanceProvider;

import React from "react";
import { Drawer } from "antd";
import { Check, Monitor, Moon, Sun, RotateCcw, X } from "lucide-react";
import { useAppearance } from "./AppearanceProvider";
import { ACCENT_PRESETS, MODES, SIDEBAR_STYLES, buildPalette } from "./appearance";
import "./appearance.css";

const MODE_ICON = { light: Sun, dark: Moon, system: Monitor };

/** Small picture of the app with a given set of settings. */
const MiniApp = ({ settings }) => {
  const p = buildPalette(settings);
  return (
    <span className="ap-mini" style={{ background: p.n.bg, borderColor: p.n.border }} aria-hidden>
      <span className="ap-mini-side" style={{ background: p.side.bg, borderColor: p.side.border }}>
        <i style={{ background: p.side.activeBg }} />
        <i style={{ background: p.side.hover === "transparent" ? p.n.subtle : p.side.text2, opacity: 0.35 }} />
        <i style={{ background: p.side.text2, opacity: 0.35 }} />
      </span>
      <span className="ap-mini-main">
        <span className="ap-mini-line" style={{ background: p.n.text, width: "52%" }} />
        <span className="ap-mini-card" style={{ background: p.n.surface, borderColor: p.n.border }}>
          <span className="ap-mini-line" style={{ background: p.n.text3, width: "70%" }} />
          <span className="ap-mini-btn" style={{ background: p.primary.strong }} />
        </span>
      </span>
    </span>
  );
};

const Section = ({ title, hint, children }) => (
  <section className="ap-sec">
    <div className="ap-sec-h">
      <h3>{title}</h3>
      {hint && <p>{hint}</p>}
    </div>
    {children}
  </section>
);

const AppearanceDrawer = ({ open, onClose }) => {
  const { settings, update, reset } = useAppearance();
  const isDefault =
    settings.mode === "light" && settings.accent === "orange" && settings.sidebar === "light" && settings.density === "comfortable";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={400}
      placement="right"
      closable={false}
      className="ap-drawer"
      styles={{ body: { padding: 0 } }}
    >
      <div className="ap-head">
        <div>
          <div className="ap-eyebrow">Settings</div>
          <h2>Appearance</h2>
          <p>Changes apply right away and are saved on this browser.</p>
        </div>
        <button className="ap-x" onClick={onClose} aria-label="Close settings">
          <X size={18} />
        </button>
      </div>

      <div className="ap-body">
        <Section title="Mode" hint="System follows your computer's light or dark setting.">
          <div className="ap-grid ap-grid-3" role="radiogroup" aria-label="Mode">
            {Object.entries(MODES).map(([k, m]) => {
              const Icon = MODE_ICON[k];
              const on = settings.mode === k;
              return (
                <button
                  key={k}
                  role="radio"
                  aria-checked={on}
                  className={`ap-tile ${on ? "is-on" : ""}`}
                  onClick={() => update({ mode: k })}
                >
                  {k === "system" ? (
                    <span className="ap-split">
                      <MiniApp settings={{ ...settings, mode: "light" }} />
                      <MiniApp settings={{ ...settings, mode: "dark" }} />
                    </span>
                  ) : (
                    <MiniApp settings={{ ...settings, mode: k }} />
                  )}
                  <span className="ap-tile-label">
                    <Icon size={14} /> {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Accent colour" hint="Used for buttons, links, highlights and charts.">
          <div className="ap-swatches" role="radiogroup" aria-label="Accent colour">
            {Object.entries(ACCENT_PRESETS).map(([k, a]) => {
              const on = settings.accent === k;
              return (
                <button
                  key={k}
                  role="radio"
                  aria-checked={on}
                  aria-label={a.label}
                  title={a.label}
                  className={`ap-swatch ${on ? "is-on" : ""}`}
                  style={{ "--sw": a.strong, "--sw2": a.base }}
                  onClick={() => update({ accent: k })}
                >
                  <span>{on && <Check size={16} strokeWidth={3} />}</span>
                </button>
              );
            })}
          </div>
          <div className="ap-current">{ACCENT_PRESETS[settings.accent]?.label}</div>
        </Section>

        <Section title="Sidebar" hint="Colour of the menu on the left.">
          <div className="ap-grid ap-grid-2" role="radiogroup" aria-label="Sidebar style">
            {Object.entries(SIDEBAR_STYLES).map(([k, sdb]) => {
              const on = settings.sidebar === k;
              return (
                <button
                  key={k}
                  role="radio"
                  aria-checked={on}
                  className={`ap-tile ap-tile-row ${on ? "is-on" : ""}`}
                  onClick={() => update({ sidebar: k })}
                >
                  <MiniApp settings={{ ...settings, sidebar: k }} />
                  <span className="ap-tile-text">
                    <b>{sdb.label}</b>
                    <em>{sdb.sub}</em>
                  </span>
                  {on && <Check size={16} className="ap-tick" />}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Density" hint="Compact fits more rows on the screen.">
          <div className="ap-seg" role="radiogroup" aria-label="Density">
            {[
              ["comfortable", "Comfortable"],
              ["compact", "Compact"],
            ].map(([k, label]) => (
              <button
                key={k}
                role="radio"
                aria-checked={settings.density === k}
                className={settings.density === k ? "is-on" : ""}
                onClick={() => update({ density: k })}
              >
                {label}
              </button>
            ))}
          </div>
        </Section>
      </div>

      <div className="ap-foot">
        <button className="mp-btn" onClick={reset} disabled={isDefault}>
          <RotateCcw size={15} /> Reset to default
        </button>
        <button className="mp-btn mp-btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </Drawer>
  );
};

export default AppearanceDrawer;

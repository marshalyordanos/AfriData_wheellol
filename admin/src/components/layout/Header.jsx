import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AutoComplete, Dropdown, Tooltip, message } from "antd";
import { Menu as MenuIcon, ArrowLeft, Bell, Search, Moon, Sun, Palette } from "lucide-react";
import { useAppearance } from "../../theme/AppearanceProvider";
import { logout, selectCurrentUser } from "../../redux/auth/authSlice";
import authService from "../../api/auth.service";
import NotificationsList from "../../views/notification/NotificationList";
import {
  fetchNotifications,
  markAllNotificationsRead,
  selectUnreadCount,
} from "../../views/notification/NotificationRedux";
import { Avatar } from "../modern/ModernUI";
import { getNavGroups, normalizeRole, titleForPath } from "./navConfig";
import "../modern/modern.css";

const LayoutHeader = ({ collapsed, collapsed2, setCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const unreadCount = useSelector((state) => selectUnreadCount(state));
  const [notifOpen, setNotifOpen] = useState(false);
  const [q, setQ] = useState("");
  const searchRef = useRef(null);
  const { isDark, update: updateAppearance, openSettings } = useAppearance();

  // keep the back-navigation history the app already relies on
  useEffect(() => {
    let history = JSON.parse(localStorage.getItem("keyPath") || "[]");
    history = history.filter((item) => typeof item === "string");
    if (history[history.length - 1] !== location.pathname) {
      history.push(location.pathname);
      localStorage.setItem("keyPath", JSON.stringify(history));
    }
  }, [location.pathname]);

  // ⌘K / Ctrl+K focuses the quick search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const u = currentUser?.user || currentUser || {};
  const currentUserId = u.id || (JSON.parse(localStorage.getItem("user") || "{}") || {}).id || null;
  const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || "Admin";
  const role = (normalizeRole(currentUser) || "admin").replace(/_/g, " ");
  const pageTitle = titleForPath(location.pathname, currentUser);
  const isRoot = location.pathname.replace(/\/$/, "") === "/dash";

  const handleBack = () => {
    let history = JSON.parse(localStorage.getItem("keyPath") || "[]");
    if (history.length <= 1) return navigate("/dash");
    history.pop();
    let prev = history[history.length - 1];
    while (prev === "/login") {
      history.pop();
      prev = history[history.length - 1];
    }
    localStorage.setItem("keyPath", JSON.stringify(history));
    navigate(prev || "/dash");
  };

  const handleProfileAction = ({ key }) => {
    if (key === "logout") {
      authService.logout();
      dispatch(logout());
      message.success("You have been logged out");
      setTimeout(() => navigate("/login"), 300);
    } else if (key === "change_password") {
      navigate("/dash/change-password");
    } else if (key === "appearance") {
      openSettings();
    } else if (key === "profile") {
      navigate(`/dash/profile/${u.id || u._id || "me"}`);
    }
  };

  /* Quick navigation: search the pages you have access to */
  const options = useMemo(() => {
    const all = getNavGroups(currentUser).flatMap((g) =>
      g.items.map((i) => ({ ...i, group: g.group }))
    );
    const s = q.trim().toLowerCase();
    return all
      .filter((i) => !s || i.label.toLowerCase().includes(s) || i.group.toLowerCase().includes(s))
      .map((i) => ({
        value: i.to,
        label: (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 0" }}>
            <span style={{ color: "var(--c-text-3)", display: "inline-grid" }}>{i.icon}</span>
            <span style={{ flex: 1, fontWeight: 500 }}>{i.label}</span>
            <span style={{ fontSize: 12, color: "var(--c-text-3)" }}>{i.group}</span>
          </div>
        ),
      }));
  }, [q, currentUser]);

  return (
    <>
      <header className="app-top">
        {collapsed2 && (
          <button
            className="app-ib"
            aria-label="Open menu"
            onClick={() => setCollapsed && setCollapsed(!collapsed)}
          >
            <MenuIcon size={18} />
          </button>
        )}
        {!isRoot && (
          <button className="app-ib" aria-label="Go back" onClick={handleBack}>
            <ArrowLeft size={18} />
          </button>
        )}
        <div style={{ minWidth: 0 }} className="hidden md:block">
          <div style={{ fontSize: 12.5, color: "var(--c-text-3)" }}>Wheellol</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--c-text)", whiteSpace: "nowrap" }}>
            {pageTitle}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div className="app-search" style={{ position: "relative" }}>
          <Search size={16} className="app-search-ico" />
          <AutoComplete
            ref={searchRef}
            value={q}
            options={options}
            style={{ width: "100%" }}
            onSearch={setQ}
            onSelect={(to) => {
              setQ("");
              navigate(to);
              searchRef.current?.blur();
            }}
            placeholder="Jump to a page…"
            popupMatchSelectWidth
          />
          <span className="app-kbd">⌘ K</span>
        </div>

        <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
          <button
            className="app-ib"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => updateAppearance({ mode: isDark ? "light" : "dark" })}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </Tooltip>

        <Tooltip title="Appearance">
          <button className="app-ib" aria-label="Appearance settings" onClick={openSettings}>
            <Palette size={18} />
          </button>
        </Tooltip>

        <button
          className="app-ib"
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
          onClick={() => {
            // The panel loads the list itself; items are marked read when opened
            // (old behaviour marked everything read on open — removed).
            setNotifOpen(true);
          }}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
        </button>

        <span className="app-divider" />

        <Dropdown
          menu={{
            items: [
              { key: "profile", label: "Profile" },
              { key: "change_password", label: "Change password" },
              { key: "appearance", label: "Appearance" },
              { type: "divider" },
              { key: "logout", label: "Sign out", danger: true },
            ],
            onClick: handleProfileAction,
          }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <button className="app-me">
            <Avatar name={name} src={u.profilePhoto} size={36} />
            <span className="app-me-text">
              <span className="app-me-name">{name}</span>
              <span className="app-me-role">{role}</span>
            </span>
          </button>
        </Dropdown>
      </header>

      <NotificationsList open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
};

export default LayoutHeader;

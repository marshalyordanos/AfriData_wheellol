import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Tooltip, message } from "antd";
import { LogOut, Palette } from "lucide-react";
import { useAppearance } from "../../theme/AppearanceProvider";
import Logo from "../../assets/icon orange.svg";
import { logout, selectCurrentUser } from "../../redux/auth/authSlice";
import authService from "../../api/auth.service";
import { Avatar } from "../modern/ModernUI";
import { getNavGroups, isActivePath, normalizeRole } from "./navConfig";
import "../modern/modern.css";

const Sidebar = ({ collapsed, inDrawer = false, onNavigate }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { openSettings } = useAppearance();

  if (collapsed && !inDrawer) return null;

  const groups = getNavGroups(user);
  const u = user?.user || user || {};
  const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || "Admin";
  const role = (normalizeRole(user) || "admin").replace(/_/g, " ");

  const doLogout = () => {
    authService.logout();
    dispatch(logout());
    message.success("You have been logged out");
    setTimeout(() => navigate("/login"), 300);
  };

  return (
    <aside className={`app-side ${inDrawer ? "in-drawer" : ""}`}>
      <div className="app-brand" onClick={() => navigate("/dash")}>
        <span className="app-brand-mark">
          <img src={Logo} alt="" />
        </span>
        <span>
          <span className="app-brand-name" style={{ display: "block" }}>
            Wheellol
          </span>
          <span className="app-brand-sub">Admin console</span>
        </span>
      </div>

      <nav className="app-nav" aria-label="Main">
        {groups.map((g) => (
          <React.Fragment key={g.group}>
            <div className="app-nav-group">{g.group}</div>
            {g.items.map((it) => (
              <NavLink
                key={it.key}
                to={it.to}
                end={it.exact}
                onClick={onNavigate}
                className={() => (isActivePath(location.pathname, it) ? "is-active" : "")}
              >
                <span className="ico">{it.icon}</span>
                <span>{it.label}</span>
              </NavLink>
            ))}
          </React.Fragment>
        ))}
      </nav>

      <div className="app-user">
        <Avatar name={name} src={u.profilePhoto} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="app-user-name">{name}</div>
          <div className="app-user-role">{role}</div>
        </div>
        <Tooltip title="Appearance">
          <button className="mp-iconbtn" style={{ border: "none" }} aria-label="Appearance settings" onClick={() => { openSettings(); onNavigate && onNavigate(); }}>
            <Palette size={16} />
          </button>
        </Tooltip>
        <Tooltip title="Sign out">
          <button className="mp-iconbtn" style={{ border: "none" }} aria-label="Sign out" onClick={doLogout}>
            <LogOut size={16} />
          </button>
        </Tooltip>
      </div>
    </aside>
  );
};

export default Sidebar;

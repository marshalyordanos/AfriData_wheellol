import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../redux/auth/authSlice";
import { getNavGroups, isActivePath } from "./navConfig";
import "../modern/modern.css";

/* Phone navigation: the first five pages from the sidebar. */
const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectCurrentUser);
  const items = getNavGroups(user)
    .flatMap((g) => g.items)
    .slice(0, 5);

  return (
    <nav className="app-bottom" aria-label="Quick navigation">
      {items.map((it) => (
        <button
          key={it.key}
          className={isActivePath(location.pathname, it) ? "is-active" : ""}
          onClick={() => navigate(it.to)}
        >
          <span className="i">{it.icon}</span>
          {it.label.split(" ")[0]}
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;

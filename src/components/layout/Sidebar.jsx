import { Menu } from "antd";
import Sider from "antd/es/layout/Sider";
import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  DashboardOutlined,
  UserOutlined,
  IdcardOutlined,
  MessageOutlined,
  CreditCardOutlined,
  WarningOutlined,
  LockOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { FaUserTie, FaCar } from "react-icons/fa";
import { SiBrandfolder, SiBookstack } from "react-icons/si";
import { PiCubeFill } from "react-icons/pi";
import styled from "styled-components";
// import Logo from "../../assets/logo1.png";
import Logo from "../../assets/LogoOrange.png";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../redux/auth/authSlice";

const rootSubmenuKeys = ["sub1", "sub2", "sub4"];

const Sidebar = ({ collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useSelector(selectCurrentUser);

  const keys = JSON.parse(localStorage.getItem("keyPath"));
  const [openKeys, setOpenKeys] = useState(keys ? keys[keys.length - 1] : []);
  const [current, setCurrent] = useState(["dashboard"]);
  const [items, setItems] = useState([]);

  const path = location.pathname;

  // Helper to create a menu item
  function getItem(label, key, icon, children, type, disabled = false) {
    return { key, icon, children, label, type, disabled };
  }

  // Handle clicking on a menu item
  const onClick = (e) => {
    setCurrent([e.key]);
    navigate(e.key);
    setOpenKeys(e.keyPath);
    const y = JSON.parse(localStorage.getItem("keyPath")) || [];
    localStorage.setItem("keyPath", JSON.stringify([...y, e.keyPath]));
  };

  // Handle submenu open
  const onOpenChange = (keys) => {
    const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
    if (latestOpenKey && rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
      setOpenKeys(keys);
    } else {
      setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
    }
  };

  // Sync sidebar with current path
  useEffect(() => {
    const p = path.toLowerCase();
    let sel = "";
    if (p.startsWith("/dash/host")) sel = "host";
    else if (p.startsWith("/dash/staff")) sel = "staff";
    else if (p.startsWith("/dash/cars")) sel = "cars";
    else if (p.startsWith("/dash/cartypes")) sel = "cartypes";
    else if (p.startsWith("/dash/gust")) sel = "gust";
    else if (p.startsWith("/dash/brands")) sel = "brands";
    else if (p.startsWith("/dash/models")) sel = "models";
    else if (p.startsWith("/dash/cancellation-policies"))
      sel = "cancellation-policies";
    else if (p.startsWith("/dash/bookings")) sel = "bookings";
    else if (p.startsWith("/dash/payments")) sel = "payments";
    else if (p.startsWith("/dash/disputes")) sel = "disputes";
    else if (p.startsWith("/dash/messages")) sel = "messages";
    else if (p.startsWith("/dash/permissions")) sel = "permissions";
    else if (p.startsWith("/dash/roles")) sel = "roles";
    else if (p === "/dash" || p === "/dash/") sel = "/dash";
    else sel = "dashboard";

    setCurrent(sel ? [sel] : []);
    const y = JSON.parse(localStorage.getItem("keyPath")) || [];
    setOpenKeys(y ? y[y.length - 1] : []);
  }, [path]);

  // Generate menu items based on role
  useEffect(() => {
    const normalizeRole = (u) => {
      if (!u) return null;
      if (typeof u === "string") return u.toLowerCase();
      if (u.role) {
        if (typeof u.role === "string") return u.role.toLowerCase();
        if (u.role.name) return String(u.role.name).toLowerCase();
      }
      if (u.user) return normalizeRole(u.user);
      return null;
    };

    const role = normalizeRole(user) || "superadmin";

    // All possible menu items
    const allItems = [
      getItem(
        <p className="text-gray-400">{t("OVERVIEW")}</p>,
        "dashboard",
        null,
        null,
        null,
        true
      ),
      getItem(t("Dashboard"), "/dash", <DashboardOutlined />),
      getItem("Cars", "cars", <FaCar />),
      getItem("Staffs", "staff", <IdcardOutlined />),
      getItem("Hosts", "host", <FaUserTie />),
      getItem("Guests", "gust", <UserOutlined />),
      getItem("Bookings", "bookings", <SiBookstack />),
      getItem("Payments", "payments", <CreditCardOutlined />),
      getItem("Disputes", "disputes", <WarningOutlined />),
      getItem("Messages", "messages", <MessageOutlined />),
      getItem("Brands", "brands", <SiBrandfolder />),
      getItem("CarTypes", "cartypes", <SiBrandfolder />),
      getItem("Cancellation Policies", "cancellation-policies", <PiCubeFill />),
      getItem("Models", "models", <PiCubeFill />),
      getItem("Permissions", "permissions", <LockOutlined />),
      getItem("Roles", "roles", <SafetyOutlined />),
    ];

    let visibleItems = allItems;

    if (role === "superadmin" || role === "staff") {
      // Admin sees everything except Messages
      visibleItems = allItems.filter((item) => item.key !== "messages");
    } else if (role === "host") {
      // Host sees only these
      const allowedKeys = [
        "/dash",
        "cars",
        "bookings",
        "payments",
        "messages",
        "dashboard",
      ];
      visibleItems = allItems.filter((item) => allowedKeys.includes(item.key));
    }

    setItems(visibleItems);
  }, [user]);

  return (
    <SidebarStyle
      width={250}
      style={{
        height: "100vh",
        position: "fixed",
        display: collapsed && "none",
        backgroundColor: "white",
        zIndex: 110,
      }}
      trigger={null}
      collapsible
      collapsed={collapsed}
    >
      {/* Logo Section */}
      <div
        className="flex justify-center items-center"
        style={{
          width: 249,
          height: 100,
          background: "var(--color-secondary)",
        }}
      >
        <NavLink
          to={"/dash"}
          className="flex justify-center items-center gap-1"
        >
          <img src={Logo} className="h-20" alt="Logo" />
        </NavLink>
      </div>

      {/* Menu Section */}
      <div className="sidebar__menus">
        <Menu
          theme="dark"
          onClick={onClick}
          style={{ backgroundColor: "var(--color-secondary)" }}
          openKeys={openKeys}
          onOpenChange={onOpenChange}
          selectedKeys={current}
          mode="inline"
          items={items}
        />
      </div>
    </SidebarStyle>
  );
};

const SidebarStyle = styled(Sider)`
  .sidebar__menus {
    overflow: auto;
    overflow-x: hidden;
    height: calc(100vh - 100px);
    scrollbar-width: thin;
    scrollbar-color: var(--color-primary) #f1f1f1;
    background-color: var(--color-secondary);
  }

  .sidebar__menus::-webkit-scrollbar {
    width: 8px;
  }

  .sidebar__menus::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  .sidebar__menus::-webkit-scrollbar-thumb {
    background-color: #c4c4c4;
    border-radius: 4px;
  }

  .sidebar__menus::-webkit-scrollbar-thumb:hover {
    background-color: #d8d8d8;
  }

  .ant-menu-sub {
    background-color: transparent !important;
  }

  .ant-menu-item {
    color: white !important;
  }

  .ant-menu-item-selected {
    background-color: var(--color-primary) !important;
    color: white !important;
  }

  span {
    font-size: 13px !important;
    color: white !important;
  }

  .ant-menu-item-selected span {
    color: white !important;
  }
`;

export default Sidebar;

import { Menu } from "antd";
import Sider from "antd/es/layout/Sider";
import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { FaUserTie } from "react-icons/fa";

import styled from "styled-components";
import Logo from "../../assets/logo1.png";
import { FaCar } from "react-icons/fa";
import { SiBrandfolder } from "react-icons/si";
import { SiBookstack } from "react-icons/si";
import { TbTruckDelivery } from "react-icons/tb"; // icon for Vehicle Types
import { PiCubeFill } from "react-icons/pi"; // distinct icon for Models

import { useTranslation } from "react-i18next";

const rootSubmenuKeys = ["sub1", "sub2", "sub4"];
const Sidebar = ({ collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const keys = JSON.parse(localStorage.getItem("keyPath"));
  const [openKeys, setOpenKeys] = useState(keys ? keys[keys.length - 1] : []);
  const path = location.pathname;
  const [current, setCurrent] = useState(["dashboard"]);
  const [items, setItems] = useState([]);
  const { t, i18n } = useTranslation();

  const onClick = (e) => {
    console.log("click ", e);
    setCurrent(e.key);

    navigate(e.key);
    setOpenKeys(e.keyPath);

    const y = JSON.parse(localStorage.getItem("keyPath")) || [];

    localStorage.setItem("keyPath", JSON.stringify([...y, e.keyPath]));
  };

  const onOpenChange = (keys) => {
    const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);

    if (latestOpenKey && rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
      setOpenKeys(keys);
    } else {
      setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
    }
  };
  useEffect(() => {
    getItems();
  }, []);
  useEffect(() => {
    const x = [...path.split("/")];
    console.log("ppppppppppppp", x);
    setCurrent(x.length > 2 ? x[x.length - 1] : "");
    const y = JSON.parse(localStorage.getItem("keyPath")) || [];

    setOpenKeys(y ? y[y.length - 1] : []);
  }, [path]);

  function getItem(
    label,
    key,
    icon,
    children,
    type,
    disabled = false,
    style = {}
  ) {
    return {
      key,
      icon,
      children,
      label,
      type,
      disabled,
      style,
    };
  }
  const getItems = async () => {
    const items2 = [
      getItem(
        <p className="text-gray-400">{t("OVERVIEW")}</p>,
        "dashboard",
        null,
        null,
        null,
        true
      ),

      getItem(t("Dashboard"), "/dash", <DashboardOutlined />),

      getItem(t("Users"), "user", <UserOutlined />),
  getItem("Host", "host", <FaUserTie />),
      getItem("Cars", "cars", <FaCar />),

      getItem("Brands", "brands", <SiBrandfolder />),
      getItem("Models", "models", <PiCubeFill />),
      getItem("Vehicle Types", "vehicle-types", <TbTruckDelivery />),
      getItem("Bookings", "bookings", <SiBookstack />),
      getItem("Permissions", "permissions", <UserOutlined />),
      getItem("Roles", "roles", <TeamOutlined />),
    ];

    setItems(items2);
  };

  return (
    <SidebarStyle
      width={250}
      style={{
        height: "100vh",
        // border: "1px solid gray",
        // borderRadius: "0px 40px 40px 0",
        position: "fixed",

        display: collapsed && "none",
        backgroundColor: "white",
        zIndex: 110,
      }}
      trigger={null}
      collapsible
      collapsed={collapsed}
    >
      <div className="demo-logo-vertical" />
      <div
        className="flex  justify-center items-center"
        style={{
          width: 249,
          height: 100,
          background: "white",
          borderRadius: "0px 40px 0 0",
        }}
      >
        <NavLink
          to={"/home"}
          className={"flex  justify-center items-center gap-1"}
        >
          <img
            src={Logo}
            color="white"
            className=" h-20    text-black border-red-800"
            alt="MK Logo"
          />
          <p className="text-2xl font-black tracking-wide text-green-500">
            AFRICAR
          </p>{" "}
        </NavLink>
      </div>
      <div className="sidebar__menus">
        <Menu
          theme={"dark"}
          onClick={onClick}
          style={{
            backgroundColor: "transparent",
          }}
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
  /* .sidebar__menus {
    overflow: auto;
    overflow-x: hidden;
    height: calc(100vh - 100px);
    scrollbar-width: normal;
    scrollbar-color: red green;
  } */

  /* *********************************** scroller bar *********************************** */

  .sidebar__menus {
    overflow: auto;
    overflow-x: hidden;
    height: calc(100vh - 100px);

    /* Firefox */
    scrollbar-width: thin;
    scrollbar-color: #3bb66e #f1f1f1;
  }

  /* Chrome, Edge, and Safari */
  .sidebar__menus::-webkit-scrollbar {
    width: 8px;
  }

  .sidebar__menus::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  .sidebar__menus::-webkit-scrollbar-thumb {
    background-color: #c4c4c4;
    border-radius: 4px;
    /* border: 2px solid #f1f1f1; */
  }

  .sidebar__menus::-webkit-scrollbar-thumb:hover {
    background-color: #d8d8d8;
  }
  /* ************************************ scroller bar *********************************** */

  .ant-menu-sub {
    background-color: transparent !important;
  }

  .ant-menu-item {
    color: black !important;
  }
  .ant-menu-item-selected {
    background-color: #3bb66e !important;
    color: wheat !important;
  }
  span {
    font-size: 13px !important;
    color: black !important;
  }
  .ant-menu-item-selected span {
    color: wheat !important;
  }
`;

export default Sidebar;

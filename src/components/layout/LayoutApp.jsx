import React, { useEffect, useState } from "react";

import styled from "styled-components";
import { Layout, theme } from "antd";
import { debounce } from "lodash";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import LayoutHeader from "./Header";
import SideDrawer from "../../utils/SideDrawer";
import BottomNav from "./BottomNav";
const { Content } = Layout;
const LayoutApp = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [collapsed2, setCollapsed2] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  console.log("Sidebar------------------");
  useEffect(() => {
    const handleWindowResize = debounce(() => {
      const isMobile = window.innerWidth < 900;
      setCollapsed(isMobile);
      setCollapsed2(isMobile);
    }, 200);

    window.addEventListener("resize", handleWindowResize);

    handleWindowResize();

    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  const location = useLocation();
  // Close the mobile drawer/sidebar when navigation happens
  useEffect(() => {
    try {
      if (window.innerWidth < 900) {
        setCollapsed(true);
        setCollapsed2(true);
      }
    } catch (err) {}
  }, [location.pathname]);

  return (
    <LayoutContainer>
      {/* {collapsed2 ? (
        <SideDrawer open={!collapsed} setOpen={setCollapsed}>
          <Sidebar collapsed={collapsed} />
        </SideDrawer>
      ) : (
        <Sidebar collapsed={collapsed} />
      )} */}

      {collapsed2 ? (
        <>
          {/* Remove drawer show bottom nav instead */}
          <SideDrawer open={!collapsed} setOpen={setCollapsed}>
            <Sidebar collapsed={collapsed} />
          </SideDrawer>{" "}
          {/* hide sidebar entirely */}
          <BottomNav />
        </>
      ) : (
        <Sidebar collapsed={collapsed} />
      )}

      <Layout style={{ marginLeft: collapsed2 ? 0 : collapsed ? 0 : 250 }}>
        <LayoutHeader
          open={openDrawer}
          setOpen={setOpenDrawer}
          setCollapsed={setCollapsed}
          collapsed={collapsed}
          collapsed2={collapsed2}
        />

        <Content
          style={{
            padding: "10px 0 2px 0",
            background: " #F9F9F9",
            overflowY: "auto",
            height: "max-content",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </LayoutContainer>
  );
};

const LayoutContainer = styled(Layout)`
  height: 100vh;
`;

export default LayoutApp;

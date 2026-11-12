import React, { useEffect, useState } from "react";
import { Drawer } from "antd";
import { debounce } from "lodash";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import LayoutHeader from "./Header";
import BottomNav from "./BottomNav";
import "../modern/modern.css";

const SIDEBAR_W = 260;

const LayoutApp = () => {
  // collapsed  = drawer closed (mobile) ; collapsed2 = mobile mode
  const [collapsed, setCollapsed] = useState(false);
  const [collapsed2, setCollapsed2] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onResize = debounce(() => {
      const isMobile = window.innerWidth < 900;
      setCollapsed(isMobile);
      setCollapsed2(isMobile);
    }, 150);
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 900) setCollapsed(true);
  }, [location.pathname]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--c-bg)" }}>
      {collapsed2 ? (
        <>
          <Drawer
            open={!collapsed}
            onClose={() => setCollapsed(true)}
            placement="left"
            width={SIDEBAR_W}
            closable={false}
            styles={{ body: { padding: 0 } }}
          >
            <Sidebar inDrawer onNavigate={() => setCollapsed(true)} />
          </Drawer>
          <BottomNav />
        </>
      ) : (
        <Sidebar />
      )}

      <div
        style={{
          marginLeft: collapsed2 ? 0 : SIDEBAR_W,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--c-bg)",
        }}
      >
        <LayoutHeader collapsed={collapsed} collapsed2={collapsed2} setCollapsed={setCollapsed} />
        <main style={{ flex: 1, paddingBottom: collapsed2 ? 72 : 0, minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LayoutApp;

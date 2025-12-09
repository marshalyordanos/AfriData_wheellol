import React from "react";
import styled from "styled-components";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Layout, Button, Dropdown, Avatar, Space, message, Badge } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ArrowLeftOutlined,
  DownOutlined,
  GlobalOutlined,
  BellOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { WrenchScrewdriverIcon } from "@heroicons/react/24/solid";
import { logout, selectCurrentUser } from "../../redux/auth/authSlice";
import authService from "../../api/auth.service";
import { useTranslation } from "react-i18next";
import NotificationsList from "../../views/notification/NotificationList";
import {
  fetchNotifications,
  markAllNotificationsRead,
  selectUnreadCount,
} from "../../views/notification/NotificationRedux";
import Logo from "../../assets/icon orange.svg";
import { useEffect } from "react";

const { Header } = Layout;

const LayoutHeader = ({ collapsed, collapsed2, setCollapsed }) => {


  const location = useLocation();

  useEffect(() => {
    let history = JSON.parse(localStorage.getItem("keyPath") || "[]");

    history = history.filter((item) => typeof item === "string");
    // Prevent duplicates
    if (history[history.length - 1] !== location.pathname) {
      history.push(location.pathname);
      localStorage.setItem("keyPath", JSON.stringify(history));
    }
  }, [location.pathname]);



  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const unreadCount = useSelector((state) => selectUnreadCount(state));
  const { t, i18n } = useTranslation();

  const [notifOpen, setNotifOpen] = React.useState(false);

  const currentUserId =
    currentUser?.id ||
    currentUser?.user?.id ||
    (JSON.parse(localStorage.getItem("user") || "{}") || {}).id ||
    null;

 const handleBack = () => {
   let history = JSON.parse(localStorage.getItem("keyPath") || "[]");

   if (history.length <= 1) {
     navigate("/dash");
     return;
   }

   // Remove current page
   history.pop();

   // Get previous page
   let prev = history[history.length - 1];

   // Skip /login if it's the previous page
   while (prev === "/login") {
     history.pop();
     prev = history[history.length - 1];
   }

   // Update history
   localStorage.setItem("keyPath", JSON.stringify(history));

   // Navigate to previous valid page
   if (prev) {
     navigate(prev);
   } else {
     navigate("/dash");
   }
 };


  //  Language change
  const handleLocaleChange = ({ key }) => {
    const langCode = key === "oromic" ? "OR" : key === "amharic" ? "AM" : "EN";
    i18n.changeLanguage(langCode);
    localStorage.setItem("locale", langCode);
    message.success(`Language changed to ${langCode.toUpperCase()}`);
  };

  //  Profile menu actions
  const handleProfileAction = ({ key }) => {
    if (key === "logout") {
      authService.logout();
      dispatch(logout());
      message.success("You have been logged out");
      setTimeout(() => navigate("/login"), 300);
    } else if (key === "change_password") {
      navigate("/dash/change-password");
    } else if (key === "profile") {
      const uid =
        currentUser?.user?.id || currentUser?.id || currentUser?._id || "me";
      navigate(`/dash/profile/${uid}`);
    }
  };

  // Admin dropdown items
  const adminMenuItems = [
    { key: "users", label: t("User") },
    { key: "roles", label: t("Role") },
    { key: "permissions", label: t("Permission") },
    { key: "settings", label: t("Setting") },
  ];

  //  Language menu items
  const languageItems = [
    { key: "oromic", label: "Afaan Oromo" },
    { key: "english", label: "English" },
    { key: "amharic", label: "Amharic" },
  ];

  //  Profile dropdown items
  const profileMenuItems = [
    { key: "profile", label: "Profile" },
    { key: "change_password", label: "Change Password" },
    { key: "logout", label: "Logout" },
  ];

  return (
    <Header
      style={{
        padding: 0,
        background: "#F9F9F9",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <HeaderContainer>
        {/* Mobile-centered logo */}
        <div className="mobile-logo" onClick={() => navigate("/dash")}>
          <img
            src={Logo}
            alt="logo"
            style={{
              width: "40px",
              left: "50%",
              transform: "translateX(27%)",
              height: "auto",
            }}
          />
        </div>

        {/* Left Controls */}
        <div className="left-controls">
          <Button
            type="text"
            icon={
              collapsed2 ? (
                collapsed ? (
                  <MenuUnfoldOutlined
                    style={{ color: "var(--color-primary)" }}
                  />
                ) : (
                  <MenuFoldOutlined style={{ color: "var(--color-primary)" }} />
                )
              ) : null
            }
            onClick={() => setCollapsed && setCollapsed(!collapsed)}
            style={{
              fontSize: 16,
              width: 64,
              height: 30,
              display: collapsed2 ? undefined : "none",
            }}
          />

          <Button
            type="text"
            icon={
              <ArrowLeftOutlined style={{ color: "var(--color-primary)" }} />
            }
            onClick={handleBack}
            style={{ fontSize: 16, width: 64, height: 34 }}
          />
        </div>

        {/* Right Controls */}
        <div className="right-controls">
          {/*  Language Selector */}
          {/* <Dropdown
            menu={{ items: languageItems, onClick: handleLocaleChange }}
            trigger={["click"]}
          >
            <GlobalOutlined style={{ cursor: "pointer", fontSize: 18 }} />
          </Dropdown> */}

          {/*  Notifications &  Profile */}
          <div className="notif-profile">
            <Badge count={unreadCount} size="small">
              <Button
                type="text"
                icon={
                  <BellOutlined
                    style={{ fontSize: 18, color: "var(--color-primary)" }}
                  />
                }
                onClick={async () => {
                  setNotifOpen(true);
                  dispatch(fetchNotifications({ userid: currentUserId }));

                  if (currentUserId) {
                    try {
                      await dispatch(markAllNotificationsRead(currentUserId));
                    } catch (err) {
                      console.error(
                        "Failed to mark all notifications read",
                        err
                      );
                    }
                  }
                }}
              />
            </Badge>

            <Dropdown
              menu={{ items: profileMenuItems, onClick: handleProfileAction }}
              trigger={["click"]}
            >
              <span className="header__right">
                <Avatar
                  size={40}
                  src={
                    currentUser?.user?.profilePhoto ||
                    currentUser?.profilePhoto ||
                    null
                  }
                  icon={
                    <UserOutlined style={{ color: "var(--color-primary)" }} />
                  }
                />
                {/* <span style={{ color: "black", marginLeft: 8 }}>
                  {currentUser?.firstName} {currentUser?.lastName}
                </span> */}
              </span>
            </Dropdown>
          </div>
        </div>
      </HeaderContainer>

      {/*  Notifications Drawer */}
      <NotificationsList open={notifOpen} onClose={() => setNotifOpen(false)} />
    </Header>
  );
};

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
  background-color: var(--color-secondary);
  border-bottom: 1px solid lightgray;
  padding: 0 16px;

  .left-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .right-controls {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .admin-dropdown {
    background: white;
    border-radius: 8px;
    padding: 4px 8px;
  }

  .notif-profile {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header__right {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  /* Mobile centered logo */
  .mobile-logo {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: block;
    cursor: pointer;
    height: 48px;
    width: auto;
  }

  .mobile-logo img {
    height: 40px;
    width: auto;
    object-fit: contain;
  }

  /* hide mobile logo on medium+ screens */
  @media (min-width: 768px) {
    .mobile-logo {
      display: none;
    }
  }
`;

export default LayoutHeader;

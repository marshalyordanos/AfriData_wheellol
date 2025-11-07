import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
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
  selectUnreadCount,
} from "../../views/notification/NotificationRedux";

const { Header } = Layout;

const LayoutHeader = ({ collapsed, collapsed2, setCollapsed }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const unreadCount = useSelector((state) => selectUnreadCount(state));

  const { t, i18n } = useTranslation();

  const [notifOpen, setNotifOpen] = React.useState(false);

  const currentUserId =
    currentUser?.id || currentUser?.userId || currentUser?.user?.id || null;

  const handleBack = () => {
    navigate(-1);
    const pathHistory = JSON.parse(localStorage.getItem("keyPath"));
    if (Array.isArray(pathHistory)) {
      pathHistory.pop();
      localStorage.setItem("keyPath", JSON.stringify(pathHistory));
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
                onClick={() => {
                  setNotifOpen(true);
                  if (currentUserId)
                    dispatch(fetchNotifications({ userid: currentUserId }));
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
`;

export default LayoutHeader;

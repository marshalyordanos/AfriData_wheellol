import { WrenchScrewdriverIcon } from "@heroicons/react/24/solid";
import {
  Avatar,
  Button,
  Dropdown,
  Layout,
  Space,
  message,
  Typography,
  theme,
} from "antd";
import React from "react";
import styled from "styled-components";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  DownOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectCurrentUser } from "../../redux/auth/authSlice";
import authService from "../../api/auth.service";
import { useTranslation } from "react-i18next";
const { Header } = Layout;

const LayoutHeader = ({
  collapsed,
  collapsed2,
  setCollapsed,
  setOpen,
  open,
}) => {
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const onClick = ({ key }) => {
    navigate(key);
  };
  const { t, i18n } = useTranslation();

  const onClick2 = ({ key }) => {
    if (key == "oromic") {
      i18n.changeLanguage("OR");
      localStorage.setItem("locale", "OR");
    } else if (key == "amharic") {
      i18n.changeLanguage("AM");
      localStorage.setItem("locale", "AM");
    } else {
      // alert("EN");
      i18n.changeLanguage("EN");
      localStorage.setItem("locale", "EN");
    }
    window.location.reload();
  };

const onClickProfile = ({ key }) => {
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


  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const items = [
    {
      key: "users",
      label: t("User"),
    },
    {
      //   key: 'access_controls',
      //   label: 'Access Controls',
      // },
      // {
      //   key: 'groups',
      //   label: 'Group',
      // },
      // {
      key: "roles",
      label: t("Role"),
    },
    {
      key: "permissions",
      label: t("Permission"),
    },
    {
      key: "settings",
      label: t("Setting"),
    },
  ];
  const items2 = [
    {
      key: "oromic",
      label: "Afaan oromo",
    },
    {
      key: "english",
      label: "English",
    },
    {
      key: "amharic",
      label: "Amharic",
    },
  ];
  const profiles = [
    {
      key: "profile",
      label: "Profile",
    },
    {
      key: "change_password",
      label: "Change Password",
    },
    {
      key: "logout",
      label: "Logout",
    },
  ];

  return (
    <Header
      style={{
        padding: 0,
        background: " #F9F9F9",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <HeaderStyle>
        <div className=" max-h-[40px] flex items-center ">
          <Button
            type="text"
            icon={
              collapsed2 ? (
                collapsed ? (
                  <MenuUnfoldOutlined style={{ color: "black" }} />
                ) : (
                  <MenuFoldOutlined style={{ color: "black" }} />
                )
              ) : (
                ""
              )
            }
            onClick={() => {
              setCollapsed(!collapsed);
            }}
            style={{
              fontSize: "16px",
              width: 64,
              height: 30,
              display: collapsed2 ? "" : "none",
            }}
          />

          <Button
            type="text"
            icon={<ArrowLeftOutlined style={{ color: "black" }} />}
            onClick={() => {
              navigate(-1);
              const y = JSON.parse(localStorage.getItem("keyPath"));
              if (Array.isArray(y)) {
                y.pop();
                localStorage.setItem("keyPath", JSON.stringify(y));
              }
            }}
            style={{
              fontSize: "16px",
              width: 64,
              height: 34,
            }}
          />
        </div>

        <div className="  flex items-center gap-5 mr-5 ">
          <div>
            <p className=" ">
              <Dropdown
                onOpenChange={() => console.log("onOpenChange")}
                menu={{
                  items: items2,
                  onClick: (value) => onClick2(value),
                  selectable: true,
                  defaultSelectedKeys: ["3"],
                }}
                className="bg-white px-5 py-4 max-h-[50px]"
                trigger={["click"]}
              >
                <GlobalOutlined />
              </Dropdown>
            </p>
          </div>
          {currentUser?.isSystemAdmin ? (
            <div className="max-h-[50px] flex items-center bg-white px-4 rounded-lg ">
              <Dropdown
                onOpenChange={() => console.log("onOpenChange")}
                menu={{
                  items,
                  onClick,
                  selectable: true,
                  defaultSelectedKeys: ["3"],
                }}
                trigger={["click"]}
              >
                <span className="header__right">
                  <WrenchScrewdriverIcon className="h-5 w-5 text-gray-700" />

                  <Space>
                    <p className="text-black">{t("System_Admin")}</p>
                    <DownOutlined />
                  </Space>

                  {/* */}
                </span>
              </Dropdown>
            </div>
          ) : (
            ""
          )}
          <div className="max-h-[50px] flex items-center bg-white px-4 rounded-lg ">
            <Dropdown
              onOpenChange={() => console.log("onOpenChange")}
              menu={{
                items: profiles,
                onClick: (value) => onClickProfile(value),
              }}
              trigger={["click"]}
            >
              <span className="header__right">
                <Avatar
                  size={45}
                  src={
                    currentUser?.user?.profilePhoto ||
                    currentUser?.profilePhoto ||
                    null
                  }
                  icon={<UserOutlined />}
                />

                <p className="text-black">{currentUser?.fullName}</p>
              </span>
            </Dropdown>
          </div>
        </div>
      </HeaderStyle>
    </Header>
  );
};

const HeaderStyle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* border: 1px solid; */
  height: 70px;
  background-color: white;
  border-bottom: 1px solid lightgray;
  .header_right_con {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-right: 20px;
    gap: 20px;
    padding: 0;

    /* color: #2b2b2b; */
  }
  .header__right {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  }
`;

export default LayoutHeader;

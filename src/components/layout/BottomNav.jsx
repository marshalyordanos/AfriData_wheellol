import React from "react";
import styled from "styled-components";
import {
  HomeOutlined,
  UserOutlined,
  MessageOutlined,
  CarOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";
import { SiBrandfolder, SiBookstack } from "react-icons/si";

import { useNavigate, useLocation } from "react-router-dom";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const buttons = [
    { icon: <HomeOutlined />, path: "/dash" },
    { icon: <SiBookstack />, path: "/dash/bookings" },
    { icon: <MessageOutlined />, path: "/dash/messages" },
    { icon: <CarOutlined />, path: "/dash/cars" },
    { icon: <CreditCardOutlined />, path: "/dash/payments" },
  ];

  return (
    <NavContainer>
      {buttons.map((btn, idx) => {
        const isActive = location.pathname === btn.path;
        return (
          <NavButton
            key={idx}
            onClick={() => navigate(btn.path)}
            $active={isActive}
          >
            {btn.icon}
          </NavButton>
        );
      })}
    </NavContainer>
  );
};

const NavContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: var(--color-secondary);
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 1px solid lightgray;
  z-index: 2000;
`;

const NavButton = styled.button`
  background: none;
  border: none;
  color: ${(props) => (props.$active ? "var(--color-primary)" : "white")};
  font-size: 22px;
  transition: color 0.3s ease;
`;

export default BottomNav;

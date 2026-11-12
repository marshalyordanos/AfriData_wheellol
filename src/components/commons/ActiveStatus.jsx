import React from "react";
import { ActivePill } from "../modern/ModernUI";

const ActiveStatus = ({ isActive }) => <ActivePill active={!!isActive} />;

export default ActiveStatus;

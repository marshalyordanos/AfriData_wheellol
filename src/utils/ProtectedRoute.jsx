import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../redux/auth/authSlice";

const ProtectedRoute = () => {
  const user = useSelector(selectCurrentUser);
  const userInLocalStorage = !!localStorage.getItem("user");
  if (user || userInLocalStorage) {
    return <Outlet />;
  }
  // return <Outlet />;
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;




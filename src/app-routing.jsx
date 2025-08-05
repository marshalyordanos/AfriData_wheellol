// import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PageNotFound from "./utils/PageNotFound";
import ProtectedRoute from "./utils/ProtectedRoute";
import LayoutRouting from "./LayoutRouting";
import LoginPage from "./views/auth/LoginPage";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "./redux/auth/authSlice";
// import { Button, Result } from "antd";
// import ChangePassword from "./views/auth/ChangePassword";

const AppRoute = () => {
  const user = useSelector(selectCurrentUser);
  // const user = "lkkkkkkkkk";
  console.log(user);
  return (
    <div>
      <Routes>
        <Route path="/login" element={<LoginPage />} />


        <Route element={<ProtectedRoute />}>
            <Route path="/dash/*" element={<LayoutRouting />} />
        </Route>
    
        <Route
        path="/"
        element={<Navigate to={user ? "/dash" : "/login"} />}
      />
        

       <Route path="*" element={<PageNotFound/>} />
      </Routes>
    </div>
  );
};

export default AppRoute;

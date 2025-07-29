import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./utils/ProtectedRoute";

import LayoutRouting from "./LayoutRouting";
import LoginPage from "./views/auth/LoginPage";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "./redux/auth/authSlice";
import { Button, Result } from "antd";
import ChangePassword from "./views/auth/ChangePassword";

const AppRoute = () => {
  const user = useSelector(selectCurrentUser);
  console.log(user);
  return (
    <div>
      <Routes>
        {!user && (
          <Route element={<ProtectedRoute />}>
            <Route element={<Navigate to="/login" />} path="/" />

            <Route path="/dash/*" element={<LayoutRouting />} />
          </Route>
        )}

        {user && (
          <>
            <Route element={<Navigate to="/login" />} path="/" />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/dash" element={<Navigate to="/login" />} />

            <Route path="/signup" element={<div>Signup</div>} />
          </>
        )}

        <Route
          path="*"
          element={
            <div>
              <Result
                status="403"
                title="403"
                subTitle="Sorry, you are not authorized to access this page."
                extra={
                  <Button className="bg-green-600 text-white hover:text-white active:text-white">
                    Back Home
                  </Button>
                }
              />
            </div>
          }
        />
      </Routes>
    </div>
  );
};

export default AppRoute;

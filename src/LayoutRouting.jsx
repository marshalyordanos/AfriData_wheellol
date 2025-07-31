import React from "react";
import { Route, Routes } from "react-router-dom";
import LayoutApp from "./components/layout/LayoutApp";
// import UsersList from "./views/users/UsersList";
// import UsersDetail from "./views/users/UsersDetails";

import DashboardPage from "./views/Dashboard/DashboardPage";
import ChangePassword from "./views/auth/ChangePassword";

const LayoutRouting = () => {
  return (
    <Routes>
      <Route element={<LayoutApp />}>
        <Route index element={<DashboardPage />} />
        {/* <Route path="users" element={<UsersList />} />
        <Route path="users/:id" element={<UsersDetail />} /> */}

        <Route path="/change-password" element={<ChangePassword />} />

        <Route path="*" element={<h1>Books</h1>} />
      </Route>
    </Routes>
  );
};

export default LayoutRouting;

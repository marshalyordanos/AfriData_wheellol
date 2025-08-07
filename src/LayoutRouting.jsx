import React from "react";
import { Route, Routes } from "react-router-dom";
import LayoutApp from "./components/layout/LayoutApp";
import BrandList from "./views/brand/BrandList";
import BrandDetail from "./views/brand/BrandDetails";

import DashboardPage from "./views/Dashboard/DashboardPage";
import ChangePassword from "./views/auth/ChangePassword";

import UserList from "./views/user/UserList";
import UserAddEdit from "./views/user/UserAddEdit";
import UserDetails from "./views/user/UserDetails";
const LayoutRouting = () => {
  return (
    <Routes>
      <Route element={<LayoutApp />}>
        <Route index element={<DashboardPage />} />

        <Route path="brand" element={<BrandList />} />
        <Route path="brand/:id" element={<BrandDetail />} />
         
        <Route path="users" element={<UserList />} />
        <Route path="users/new" element={<UserAddEdit />} />
        <Route path="users/edit/:id" element={<UserAddEdit />} />
        <Route path="users/:id" element={<UserDetails />} />

        <Route path="/change-password" element={<ChangePassword />} />

        <Route path="*" element={<h1>Page Not Found Inside Dashboard</h1>} />
      </Route>
    </Routes>
  );
};

export default LayoutRouting;

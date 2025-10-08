import React from "react";
import { Route, Routes } from "react-router-dom";
import LayoutApp from "./components/layout/LayoutApp";
import PermissionList from "./views/permissions/PermissionList";
import RoleList from "./views/roles/RoleList";
import BrandsList from "./views/brands/BrandsList";
import BrandsDetail from "./views/brands/BrandsDetails";

import DashboardPage from "./views/Dashboard/DashboardPage";
import ChangePassword from "./views/auth/ChangePassword";
import UserList from "./views/user/UserList";
import UserDetail from "./views/user/UserDetails";
import CarModelsList from "./views/carModels/CarModelsList";
import CarModelsDetails from "./views/carModels/CarModelsDetails";
import CarsList from "./views/cars/CarsList";
import CarsDetails from "./views/cars/CarsDetails";
import BookingList from "./views/bookings/BookingList";
import VehicleTypesList from "./views/vehicleTypes/VehicleTypesList";
import BrandModelsList from "./views/brands/BrandModelsList";

const LayoutRouting = () => {
  return (
    <Routes>
      <Route element={<LayoutApp />}>
        <Route index element={<DashboardPage />} />
        <Route path="" element={<DashboardPage />} />

        <Route path="brands" element={<BrandsList />} />
        <Route path="brands/:brandId/models" element={<BrandModelsList />} />

        <Route path="brands/:id" element={<BrandsDetail />} />

        <Route path="user" element={<UserList />} />
        <Route path="user/:id" element={<UserDetail />} />

        <Route path="models" element={<CarModelsList />} />
        <Route path="models/:id" element={<CarModelsDetails />} />

        <Route path="cars" element={<CarsList />} />
        <Route path="cars/details/:id" element={<CarsDetails />} />
        <Route path="bookings" element={<BookingList />} />
        <Route path="vehicle-types" element={<VehicleTypesList />} />

        <Route path="permissions" element={<PermissionList />} />
        <Route path="roles" element={<RoleList />} />

        <Route path="/change-password" element={<ChangePassword />} />

        <Route path="*" element={<h1>Page Not Found Inside Dashboard</h1>} />
      </Route>
    </Routes>
  );
};

export default LayoutRouting;

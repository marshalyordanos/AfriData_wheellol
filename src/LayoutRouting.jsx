import React from "react";
import { Route, Routes } from "react-router-dom";
import LayoutApp from "./components/layout/LayoutApp";
import BrandsList from "./views/brands/BrandsList";
import BrandsDetail from "./views/brands/BrandsDetails";

import DashboardPage from "./views/Dashboard/DashboardPage";
import ChangePassword from "./views/auth/ChangePassword";
import UserList from "./views/user/UserList";
import UserDetail from "./views/user/UserDetails";
import CategorysList from "./views/categorys/CategorysList";
import CategorysDetail from "./views/categorys/CategorysDetails";
import CarsList from "./views/cars/CarsList";
<<<<<<< HEAD
import CarsDetail from "./views/cars/CarsDetails";
import BookingList from "./views/bookings/BookingList";
=======
import CarsDetails from "./views/cars/CarsDetails";
>>>>>>> 68809b21eefdc9db75b921cb55cc3729f18b9e3e

const LayoutRouting = () => {
  return (
    <Routes>
      <Route element={<LayoutApp />}>
        <Route index element={<DashboardPage />} />
        <Route path="" element={<DashboardPage />} />

        <Route path="brands" element={<BrandsList />} />
        <Route path="brands/:id" element={<BrandsDetail />} />

        <Route path="user" element={<UserList />} />
        <Route path="user/:id" element={<UserDetail />} />
        <Route path="categories" element={<CategorysList />} />
        <Route path="categories/:id" element={<CategorysDetail />} />

        <Route path="cars" element={<CarsList />} />
<<<<<<< HEAD
        <Route path="cars/:id" element={<CarsDetail />} />
        <Route path="bookings" element={<BookingList />} />
=======
        <Route path="cars/details/:id" element={<CarsDetails />} />
>>>>>>> 68809b21eefdc9db75b921cb55cc3729f18b9e3e

        <Route path="/change-password" element={<ChangePassword />} />

        <Route path="*" element={<h1>Page Not Found Inside Dashboard</h1>} />
      </Route>
    </Routes>
  );
};

export default LayoutRouting;

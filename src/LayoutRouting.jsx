import React, { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import LayoutApp from "./components/layout/LayoutApp";
import PermissionList from "./views/permissions/PermissionList";
import RoleList from "./views/roles/RoleList";
import BrandsList from "./views/brands/BrandsList";
import BrandsDetail from "./views/brands/BrandsDetails";

import DashboardPage from "./views/Dashboard/DashboardPage";
import ChangePassword from "./views/auth/ChangePassword";
import ProfileDetails from "./views/profile/ProfileDetails";
import HostList from "./views/host/HostList";
import HostDetail from "./views/host/HostDetails";

import CarModelsList from "./views/carModels/CarModelsList";
import CarModelsDetails from "./views/carModels/CarModelsDetails";
import CarsList from "./views/cars/CarsList";
import CarsDetails from "./views/cars/CarsDetails";
import BookingList from "./views/bookings/BookingList";
import BookingDetails from "./views/bookings/BookingDetails";
import PaymentList from "./views/payment/PaymentList";
import PaymentDetails from "./views/payment/PaymentDetails";
import DisputeList from "./views/dispute/DisputeList";
import DisputeDetails from "./views/dispute/DisputeDetails";
import VehicleTypesList from "./views/vehicleTypes/VehicleTypesList";
import BrandModelsList from "./views/brands/BrandModelsList";
import CarInsurancePage from "./views/cars/CarInsurancePage";
import StaffList from "./views/staff/StaffList";
import StaffDetail from "./views/staff/StaffDetails";
import GustList from "./views/gust/GustList";
import GustDetail from "./views/gust/GustDetails";
import GuestReview from "./views/gust/Review";
import HostReview from "./views/host/Review";
import CartReview from "./views/cars/Review";
import ChatsList from "./views/messages/ChatsList";
import ChatDetails from "./views/messages/ChatDetails";

import CartypesList from "./views/cartypes/CartypesList";
import CartypesDetail from "./views/cartypes/CartypesDetails";

import api from "./api/api";
import { useDispatch } from "react-redux";
import { setSummary } from "./redux/auth/authSlice";
const LayoutRouting = () => {
  const dispatch = useDispatch();

  const fetchSummary = async () => {
    try {
      const res = await api.get("users/summary");
      console.log("res.d:", res.data);

      dispatch(setSummary(res.data?.data));
    } catch (error) {
      console.error("fetchSummary: ", error);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <Routes>
      <Route element={<LayoutApp />}>
        <Route index element={<DashboardPage />} />
        <Route path="" element={<DashboardPage />} />

        <Route path="brands" element={<BrandsList />} />
        <Route path="brands/:brandId/models" element={<BrandModelsList />} />

        <Route path="brands/:id" element={<BrandsDetail />} />

        <Route path="cartypes" element={<CartypesList />} />
        {/* <Route path="cartypes/:id" element={<CartypesDetail />} /> */}

        <Route path="host" element={<HostList />} />
        <Route path="host/details/:id" element={<HostDetail />} />

        <Route path="staff" element={<StaffList />} />
        <Route path="staff/details/:id" element={<StaffDetail />} />

        <Route path="models" element={<CarModelsList />} />
        <Route path="models/:id" element={<CarModelsDetails />} />

        <Route path="cars" element={<CarsList />} />
        <Route path="cars/details/:id" element={<CarsDetails />} />
        <Route path="/cars/:carId/insurance" element={<CarInsurancePage />} />

        <Route path="bookings" element={<BookingList />} />
        <Route path="bookings/:id" element={<BookingDetails />} />
        <Route path="payments" element={<PaymentList />} />
        <Route path="payments/:id" element={<PaymentDetails />} />

        <Route path="disputes" element={<DisputeList />} />
        <Route path="disputes/:id" element={<DisputeDetails />} />

        <Route path="messages" element={<ChatsList />} />
        <Route path="messages/:id" element={<ChatDetails />} />
        <Route path="profile/:id" element={<ProfileDetails />} />
        <Route path="vehicle-types" element={<VehicleTypesList />} />

        <Route path="permissions" element={<PermissionList />} />
        <Route path="roles" element={<RoleList />} />

        <Route path="/change-password" element={<ChangePassword />} />

        <Route path="gust" element={<GustList />} />
        <Route path="gust/details/:id" element={<GustDetail />} />
        <Route path="gust/reviews/:id" element={<GuestReview />} />
        <Route path="host/reviews/:id" element={<HostReview />} />
        <Route path="cars/reviews/:id" element={<CartReview />} />

        <Route path="*" element={<h1>Page Not Found Inside Dashboard</h1>} />
      </Route>
    </Routes>
  );
};

export default LayoutRouting;

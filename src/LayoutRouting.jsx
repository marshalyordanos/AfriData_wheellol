import React, { useEffect, useMemo } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, setSummary } from "./redux/auth/authSlice";
import {
  fetchNotifications,
  fetchUnreadNotifications,
} from "./views/notification/NotificationRedux";
import LayoutApp from "./components/layout/LayoutApp";
import SocketService from "./services/socketService";
import { notification } from "antd";
import { BellOutlined } from "@ant-design/icons";
import {
  fetchChatsForUser,
  fetchMessagesForBooking,
} from "./views/messages/MessageRedux";
import { upsertChat } from "./views/messages/MessageRedux";

import api from "./api/api";

// Pages
import DashboardPage from "./views/Dashboard/DashboardPage";

import BrandsList from "./views/brands/BrandsList";
import BrandsDetail from "./views/brands/BrandsDetails";
import BrandModelsList from "./views/brands/BrandModelsList";

import HostList from "./views/host/HostList";
import HostDetail from "./views/host/HostDetails";

import StaffList from "./views/staff/StaffList";
import StaffDetail from "./views/staff/StaffDetails";

import CarModelsList from "./views/carModels/CarModelsList";
import CarModelsDetails from "./views/carModels/CarModelsDetails";

import CarsList from "./views/cars/CarsList";
import CarsDetails from "./views/cars/CarsDetails";
import CarInsurancePage from "./views/cars/CarInsurancePage";

import BookingList from "./views/bookings/BookingList";
import BookingDetails from "./views/bookings/BookingDetails";

import PaymentList from "./views/payment/PaymentList";
import PaymentDetails from "./views/payment/PaymentDetails";

import CancellationPoliciesList from "./views/cancellation-policies/Cancellation-policiesList";

import DisputeList from "./views/dispute/DisputeList";
import DisputeDetails from "./views/dispute/DisputeDetails";

import VehicleTypesList from "./views/vehicleTypes/VehicleTypesList";

import PermissionList from "./views/permissions/PermissionList";
import RoleList from "./views/roles/RoleList";

import GustList from "./views/gust/GustList";
import GustDetail from "./views/gust/GustDetails";
import GuestReview from "./views/gust/Review";
import HostReview from "./views/host/Review";
import CartReview from "./views/cars/Review";

import ChatsList from "./views/messages/ChatsList";
import ChatDetails from "./views/messages/ChatDetails";

import ProfileDetails from "./views/profile/ProfileDetails";
import ChangePassword from "./views/auth/ChangePassword";

import CartypesList from "./views/cartypes/CartypesList";
import { initializeSockets } from "./services/socketSetup";

const LayoutRouting = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);

  const currentUserId = useMemo(() => {
    return user?.id || user?.userId || user?.user?.id || null;
  }, [user]);

  const role =
    user?.role?.name || JSON.parse(localStorage.getItem("user"))?.role.name;

  // Fetch summary on load
  const fetchSummary = async () => {
    try {
      const res = await api.get("users/summary");
      dispatch(setSummary(res.data?.data));
    } catch (error) {
      console.error("fetchSummary: ", error);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [currentUserId, dispatch]);

  // Socket listener for real-time notifications using SocketService
   useEffect(() => {
     const cleanup = initializeSockets(dispatch, currentUserId);
     return () => cleanup && cleanup();
   }, [dispatch, currentUserId]);

  // Routes per role
  const hostRoutes = [
    { path: "", element: <DashboardPage /> },
    { path: "overview", element: <DashboardPage /> },
    { path: "cars", element: <CarsList /> },
    { path: "cars/details/:id", element: <CarsDetails /> },
    { path: "cars/reviews/:id", element: <CartReview /> },
    { path: "bookings", element: <BookingList /> },
    { path: "bookings/:id", element: <BookingDetails /> },
    { path: "messages", element: <ChatsList /> },
    { path: "messages/:id", element: <ChatDetails /> },
    { path: "payments", element: <PaymentList /> },
    { path: "payments/:id", element: <PaymentDetails /> },
    { path: "profile/:id", element: <ProfileDetails /> },
    { path: "/change-password", element: <ChangePassword /> },
  ];

  const adminRoutes = [
    { path: "", element: <DashboardPage /> },
    { path: "brands", element: <BrandsList /> },
    { path: "brands/:brandId/models", element: <BrandModelsList /> },
    { path: "brands/:id", element: <BrandsDetail /> },
    { path: "host", element: <HostList /> },
    { path: "host/details/:id", element: <HostDetail /> },
    { path: "staff", element: <StaffList /> },
    { path: "staff/details/:id", element: <StaffDetail /> },
    { path: "models", element: <CarModelsList /> },
    { path: "models/:id", element: <CarModelsDetails /> },
    { path: "cars", element: <CarsList /> },
    { path: "cars/details/:id", element: <CarsDetails /> },
    { path: "cartypes", element: <CartypesList /> },
    { path: "cars/:carId/insurance", element: <CarInsurancePage /> },
    { path: "bookings", element: <BookingList /> },
    { path: "bookings/:id", element: <BookingDetails /> },
    { path: "payments", element: <PaymentList /> },
    { path: "payments/:id", element: <PaymentDetails /> },
    { path: "cancellation-policies", element: <CancellationPoliciesList /> },
    { path: "disputes", element: <DisputeList /> },
    { path: "disputes/:id", element: <DisputeDetails /> },
    { path: "vehicle-types", element: <VehicleTypesList /> },
    { path: "permissions", element: <PermissionList /> },
    { path: "roles", element: <RoleList /> },
    { path: "gust", element: <GustList /> },
    { path: "gust/details/:id", element: <GustDetail /> },
    { path: "gust/reviews/:id", element: <GuestReview /> },
    { path: "host/reviews/:id", element: <HostReview /> },
    { path: "cars/reviews/:id", element: <CartReview /> },
    { path: "profile/:id", element: <ProfileDetails /> },
    { path: "/change-password", element: <ChangePassword /> },
    { path: "messages", element: <Navigate to="/dash" /> },
    { path: "messages/:id", element: <Navigate to="/dash" /> },
  ];

  const routesToRender = role === "HOST" ? hostRoutes : adminRoutes;

  return (
    <Routes>
      <Route element={<LayoutApp />}>
        {routesToRender.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
        <Route path="*" element={<h1>Page Not Found Inside Dashboard</h1>} />
      </Route>
    </Routes>
  );
};

export default LayoutRouting;

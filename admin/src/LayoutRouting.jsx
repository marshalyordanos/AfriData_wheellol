import React, { useEffect, useMemo } from "react";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, setSummary } from "./redux/auth/authSlice";
import {
  fetchNotifications,
  fetchUnreadNotifications,
  markNotificationRead,
  notificationReceived,
} from "./views/notification/NotificationRedux";
import LayoutApp from "./components/layout/LayoutApp";
import SocketService from "./services/socketService";
import { Button, notification } from "antd";
import { NotificationIcon } from "./views/notification/NotificationList";
import { BellOutlined } from "@ant-design/icons";

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
import PayoutList from "./views/payout/PayoutList";

import CancellationPoliciesList from "./views/cancellation-policies/Cancellation-policiesList";

import DisputeList from "./views/dispute/DisputeList";
import DisputeDetails from "./views/dispute/DisputeDetails";

import VehicleTypesList from "./views/vehicleTypes/VehicleTypesList";

import PermissionList from "./views/permissions/PermissionList";
import SupplierList from "./views/suppliers/SupplierList";
import SupplierDetails from "./views/suppliers/SupplierDetails";
import SupplierCarsReview from "./views/suppliers/SupplierCarsReview";
import SupplierCarDetails from "./views/suppliers/SupplierCarDetails";
import SupplierCarAdd from "./views/suppliers/SupplierCarAdd";
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
import LocationList from "./views/locations/LocationList";
import { connectSocket } from "./redux/socketSlice";
import ProfileContactInfo from "./views/ProfileContactInfo";
import RentalRequestList from "./views/rental-requests/RentalRequestList";
import RentalPaymentsPage from "./views/rental-requests/RentalPaymentsPage";
import RentalRequestDetails from "./views/rental-requests/RentalRequestDetails";
import ContractTemplatesPage from "./views/contracts/ContractTemplatesPage";
import ContractBuilderPage from "./views/contracts/ContractBuilderPage";

// Short, soft "ping" for new notifications (Web Audio, no sound file needed)
const playPing = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.4);
    o.onended = () => ctx.close();
  } catch {
    // audio blocked until the user interacts with the page — ignore
  }
};

const LayoutRouting = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const { connected } = useSelector((state) => state.socket);

  //conect to socket on user change
  useEffect(() => {
    if (user) {
      dispatch(connectSocket(user?.id || user?.user?.id));
    }
  }, [user]);

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
  // (was called on every render) dispatch(fetchUnreadNotifications(currentUserId));

  useEffect(() => {
    fetchSummary();
    if (currentUserId) dispatch(fetchUnreadNotifications());
  }, [currentUserId, dispatch]);

  useEffect(() => {
    if (!connected || !currentUserId) return;

    const handleNewNotification = (data) => {
      try {
        dispatch(notificationReceived(data));
        const key = `notif-${data?.id || Date.now()}`;
        const open = () => {
          notification.destroy(key);
          if (data?.id) dispatch(markNotificationRead(data.id));
          if (data?.link) navigate(data.link);
        };
        notification.open({
          key,
          message: <span style={{ fontWeight: 700 }}>{data?.title || "New notification"}</span>,
          description: data?.message || "",
          icon: <NotificationIcon type={data?.type} size={32} />,
          placement: "topRight",
          duration: 8,
          onClick: data?.link ? open : undefined,
          style: { cursor: data?.link ? "pointer" : "default", borderRadius: 14 },
          btn: data?.link ? (
            <Button type="primary" size="small" onClick={(e) => { e.stopPropagation(); open(); }}>
              Open
            </Button>
          ) : null,
        });
        playPing();
      } catch (err) {
        console.error("handleNewNotification error:", err);
      }
    };

    SocketService.on("new_notification", handleNewNotification);

    return () => {
      SocketService.off("new_notification", handleNewNotification);
    };
  }, [connected]);

  // Routes per role
  // Allowed routes for each role
  const hostRoutes = [
    { path: "", element: <DashboardPage /> },
    { path: "overview", element: <DashboardPage /> },
    { path: "cars", element: <CarsList /> },
    { path: "cars/details/:id", element: <CarsDetails /> },
    { path: "cars/:carId/insurance", element: <CarInsurancePage /> },

    { path: "cars/reviews/:id", element: <CartReview /> },
    { path: "bookings", element: <BookingList /> },
    { path: "bookings/:id", element: <BookingDetails /> },
    { path: "messages", element: <ChatsList /> },
    { path: "messages/:id", element: <ChatDetails /> },
    { path: "payments", element: <PaymentList /> },
    { path: "payments/:id", element: <PaymentDetails /> },
    { path: "payouts", element: <PayoutList /> },
    { path: "profile/:id", element: <ProfileDetails /> },
    { path: "/change-password", element: <ChangePassword /> },
  ];

  const adminRoutes = [
    { path: "", element: <DashboardPage /> },
    { path: "brands", element: <BrandsList /> },
    { path: "messages/:id", element: <ChatDetails /> },
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
    { path: "locations", element: <LocationList /> },
    // Suppliers (car owners listing cars from the app)
    { path: "suppliers", element: <SupplierList /> },
    { path: "suppliers/:id", element: <SupplierDetails /> },
    { path: "suppliers/:id/add-car", element: <SupplierCarAdd /> },
    { path: "supplier-cars", element: <SupplierCarsReview /> },
    { path: "supplier-cars/:id", element: <SupplierCarDetails /> },
    { path: "cars/:carId/insurance", element: <CarInsurancePage /> },
    // Simple "car with driver" request flow
    { path: "requests", element: <RentalRequestList /> },
    { path: "requests/:id", element: <RentalRequestDetails /> },
    { path: "request-payments", element: <RentalPaymentsPage /> },
    // Contract templates (builder) — one is picked for each booking request
    { path: "contracts", element: <ContractTemplatesPage /> },
    { path: "contracts/:id", element: <ContractBuilderPage /> },
    // Old self-service booking flow (hidden from the sidebar for now)
    { path: "bookings", element: <BookingList /> },
    { path: "bookings/:id", element: <BookingDetails /> },
    { path: "payments", element: <PaymentList /> },
    { path: "payments/:id", element: <PaymentDetails /> },
    { path: "payouts", element: <PayoutList /> },
    { path: "cancellation-policies", element: <CancellationPoliciesList /> },
    { path: "disputes", element: <DisputeList /> },
    { path: "disputes/:id", element: <DisputeDetails /> },
    { path: "vehicle-types", element: <VehicleTypesList /> },
    { path: "permissions", element: <PermissionList /> },
    { path: "roles", element: <RoleList /> },
    { path: "platform-contact-info", element: <ProfileContactInfo /> },
    { path: "guest", element: <GustList /> },
    { path: "guest/details/:id", element: <GustDetail /> },
    { path: "guest/reviews/:id", element: <GuestReview /> },
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

import React from "react";
import {
  LayoutDashboard,
  CalendarCheck,
  ClipboardList,
  Car,
  Users,
  UserRound,
  MessageSquare,
  CreditCard,
  Wallet,
  Tag,
  Layers,
  Shapes,
  Lock,
  ShieldCheck,
  Phone,
  MapPin,
} from "lucide-react";

export const normalizeRole = (u) => {
  if (!u) return null;
  if (typeof u === "string") return u.toLowerCase();
  if (u.role) {
    if (typeof u.role === "string") return u.role.toLowerCase();
    if (u.role.name) return String(u.role.name).toLowerCase();
  }
  if (u.user) return normalizeRole(u.user);
  return null;
};

const I = (C) => <C size={18} strokeWidth={1.9} />;

/** Navigation grouped like the design. `to` is relative to /dash. */
const ADMIN_NAV = [
  {
    group: "Main",
    items: [
      { key: "overview", label: "Overview", to: "/dash", icon: I(LayoutDashboard), exact: true },
      { key: "requests", label: "Booking requests", to: "/dash/requests", icon: I(ClipboardList) },
      { key: "request-payments", label: "Request payments", to: "/dash/request-payments", icon: I(CreditCard) },
      { key: "cars", label: "Fleet", to: "/dash/cars", icon: I(Car) },
    ],
  },
  {
    group: "People",
    items: [
      { key: "staff", label: "Staff", to: "/dash/staff", icon: I(Users) },
      { key: "guest", label: "Guests", to: "/dash/guest", icon: I(UserRound) },
    ],
  },
  {
    group: "Catalog",
    items: [
      { key: "brands", label: "Brands", to: "/dash/brands", icon: I(Tag) },
      { key: "cartypes", label: "Car types", to: "/dash/cartypes", icon: I(Shapes) },
      { key: "models", label: "Models", to: "/dash/models", icon: I(Layers) },
      { key: "locations", label: "Locations", to: "/dash/locations", icon: I(MapPin) },
    ],
  },
  {
    group: "Access & settings",
    items: [
      { key: "permissions", label: "Permissions", to: "/dash/permissions", icon: I(Lock) },
      { key: "roles", label: "Roles", to: "/dash/roles", icon: I(ShieldCheck) },
      { key: "platform-contact-info", label: "Contact info", to: "/dash/platform-contact-info", icon: I(Phone) },
    ],
  },
];

const HOST_NAV = [
  {
    group: "Main",
    items: [
      { key: "overview", label: "Overview", to: "/dash", icon: I(LayoutDashboard), exact: true },
      { key: "bookings", label: "Bookings", to: "/dash/bookings", icon: I(CalendarCheck) },
      { key: "cars", label: "My cars", to: "/dash/cars", icon: I(Car) },
      { key: "messages", label: "Messages", to: "/dash/messages", icon: I(MessageSquare) },
    ],
  },
  {
    group: "Finance",
    items: [
      { key: "payments", label: "Payments", to: "/dash/payments", icon: I(CreditCard) },
      { key: "payouts", label: "Payouts", to: "/dash/payouts", icon: I(Wallet) },
    ],
  },
];

export const getNavGroups = (user) => {
  const role = normalizeRole(user) || "superadmin";
  return role === "host" ? HOST_NAV : ADMIN_NAV;
};

export const isActivePath = (pathname, item) => {
  const p = pathname.toLowerCase().replace(/\/$/, "");
  if (item.exact) return p === item.to || p === "/dash/overview";
  return p === item.to || p.startsWith(item.to + "/");
};

/** Human page title for the top bar breadcrumb. */
export const titleForPath = (pathname, user) => {
  const flat = getNavGroups(user).flatMap((g) => g.items);
  const hit = flat
    .filter((i) => !i.exact)
    .sort((a, b) => b.to.length - a.to.length)
    .find((i) => isActivePath(pathname, i));
  const extra = {
    "/dash/bookings": "Bookings",
    "/dash/payments": "Payments",
    "/dash/request-payments": "Request payments",
    "/dash/payouts": "Payouts",
    "/dash/disputes": "Disputes",
    "/dash/host": "Hosts",
    "/dash/profile": "Profile",
    "/dash/change-password": "Change password",
    "/dash/vehicle-types": "Vehicle types",
    "/dash/cancellation-policies": "Cancellation policies",
  };
  if (hit) return hit.label;
  const k = Object.keys(extra).find((k) => pathname.startsWith(k));
  return k ? extra[k] : "Overview";
};

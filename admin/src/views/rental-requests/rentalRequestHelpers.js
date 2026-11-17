// Shared helpers for the simple "car with driver" request flow
import api from "../../api/api";

export const STATUS = {
  PENDING: { label: "New", color: "orange", tone: "amber", hex: "#f59e0b" },
  UNDER_NEGOTIATION: { label: "Negotiating", color: "blue", tone: "blue", hex: "#1d4f91" },
  APPROVED: { label: "Approved", color: "cyan", tone: "violet", hex: "#7c3aed" },
  ACTIVE: { label: "On trip", color: "purple", tone: "orange", hex: "#fc6b38" },
  COMPLETED: { label: "Completed", color: "green", tone: "green", hex: "#059669" },
  CANCELLED: { label: "Cancelled", color: "default", tone: "gray", hex: "#94a3b8" },
};

export const STATUS_ORDER = [
  "PENDING",
  "UNDER_NEGOTIATION",
  "APPROVED",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
];

// Statuses that require an agreed price (mirrors the backend rule)
export const NEEDS_PRICE = ["APPROVED", "ACTIVE", "COMPLETED"];

export const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "TELEBIRR", label: "telebirr" },
  { value: "CHAPA", label: "Chapa" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "OTHER", label: "Other" },
];

export const methodLabel = (m) =>
  PAYMENT_METHODS.find((x) => x.value === m)?.label || m;

// Suggested schedule from the customer-journey document (cumulative %)
export const MILESTONES = [
  { percent: 10, label: "Advance" },
  { percent: 50, label: "Pickup" },
  { percent: 75, label: "Installment 1" },
  { percent: 100, label: "Installment 2" },
];

export const etb = (n) =>
  n === null || n === undefined
    ? "—"
    : `${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })} ETB`;

export const carName = (car) =>
  [car?.make?.name, car?.model?.name, car?.year].filter(Boolean).join(" ") ||
  "Car";

export const errorMessage = (err, fallback = "Something went wrong") =>
  err?.response?.data?.message || err?.message || fallback;

const RentalRequestService = {
  list: ({ page = 1, pageSize = 10, search, status } = {}) =>
    api
      .get("/rental-requests", {
        params: {
          page,
          pageSize,
          search: search || undefined,
          status: status || undefined,
        },
      })
      .then((r) => r.data),
  listPayments: ({ page = 1, pageSize = 10, search, method } = {}) =>
    api
      .get("/rental-requests/payments/all", {
        params: { page, pageSize, search: search || undefined, method: method || undefined },
      })
      .then((r) => r.data),
  get: (id) => api.get(`/rental-requests/${id}`).then((r) => r.data.data),
  update: (id, data) =>
    api.patch(`/rental-requests/${id}`, data).then((r) => r.data.data),
  // data.receipt (optional) is a File; sent as multipart so it can be uploaded
  addPayment: (id, data) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") fd.append(k, v);
    });
    return api
      .post(`/rental-requests/${id}/payments`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data);
  },
  deletePayment: (id, paymentId) =>
    api
      .delete(`/rental-requests/${id}/payments/${paymentId}`)
      .then((r) => r.data.data),
};

export default RentalRequestService;

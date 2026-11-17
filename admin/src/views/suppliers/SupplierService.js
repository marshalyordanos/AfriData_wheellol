import api from "../../api/api";

export const APPROVAL = {
  PENDING: { label: "Waiting for review", short: "Pending", tone: "amber" },
  APPROVED: { label: "Approved · visible to customers", short: "Approved", tone: "green" },
  REJECTED: { label: "Rejected", short: "Rejected", tone: "red" },
};

export const supplierName = (u) =>
  u?.hostProfile?.businessName ||
  [u?.firstName, u?.lastName].filter(Boolean).join(" ") ||
  u?.phone || // suppliers can sign up with only email + phone
  u?.email ||
  "Supplier";

export const isSupplierCar = (car) => car?.host?.role?.name === "HOST";

const SupplierService = {
  // commission
  getSettings: () => api.get("/supplier/admin/settings").then((r) => r.data.data),
  saveSettings: (commissionPercent) =>
    api.patch("/supplier/admin/settings", { commissionPercent }).then((r) => r.data.data),

  // suppliers
  list: ({ page = 1, pageSize = 10, search } = {}) =>
    api
      .get("/supplier/admin/suppliers", { params: { page, pageSize, search: search || undefined } })
      .then((r) => r.data),
  get: (id) => api.get(`/supplier/admin/suppliers/${id}`).then((r) => r.data.data),
  setCommission: (id, commissionRate) =>
    api
      .patch(`/supplier/admin/suppliers/${id}/commission`, { commissionRate })
      .then((r) => r.data.data),

  // supplier cars (approval)
  cars: ({ page = 1, pageSize = 10, status, search, hostId } = {}) =>
    api
      .get("/supplier/admin/cars", {
        params: { page, pageSize, status: status || undefined, search: search || undefined, hostId: hostId || undefined },
      })
      .then((r) => r.data),
  getCar: (id) => api.get(`/supplier/admin/cars/${id}`).then((r) => r.data.data),
  // multipart: any car field, isActive, photoOrder (JSON) + new photos[]
  updateCar: (id, formData) =>
    api
      .patch(`/supplier/admin/cars/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data.data),
  // admin adds a car for a supplier (multipart, same fields as updateCar)
  createCar: (supplierId, formData) =>
    api
      .post(`/supplier/admin/suppliers/${supplierId}/cars`, formData, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data.data),
  review: (id, decision, reason) =>
    api.patch(`/supplier/admin/cars/${id}/review`, { decision, reason }).then((r) => r.data.data),

  // price of one car in a booking request
  setCarPrice: (requestId, carId, body) =>
    api.patch(`/rental-requests/${requestId}/cars/${carId}/price`, body).then((r) => r.data.data),
};

export default SupplierService;

// API for contract templates and the contract of each booking request.
import api from "../../api/api";

const data = (r) => r.data.data;

export const contractPublicUrl = (token, { app = false } = {}) => {
  const base = String(api.defaults.baseURL || "/").replace(/\/?$/, "/");
  return `${base}contracts/view/${token}${app ? "?app=1" : ""}`;
};

const ContractApi = {
  // templates
  listTemplates: ({ all = false } = {}) => api.get("/contract-templates", { params: { all: all || undefined } }).then(data),
  getTemplate: (id) => api.get(`/contract-templates/${id}`).then(data),
  createTemplate: (body) => api.post("/contract-templates", body).then(data),
  updateTemplate: (id, body) => api.patch(`/contract-templates/${id}`, body).then(data),
  duplicateTemplate: (id) => api.post(`/contract-templates/${id}/duplicate`).then(data),
  setDefault: (id) => api.post(`/contract-templates/${id}/default`).then(data),
  deleteTemplate: (id) => api.delete(`/contract-templates/${id}`).then((r) => r.data),
  uploadImage: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return api
      .post("/contract-templates/upload", fd, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data?.data?.url);
  },

  // contracts of a booking request
  listForRequest: (requestId) => api.get(`/rental-requests/${requestId}/contracts`).then(data),
  createForRequest: (requestId, templateId) =>
    api.post(`/rental-requests/${requestId}/contracts`, { templateId }).then(data),
  get: (id) => api.get(`/rental-contracts/${id}`).then(data),
  save: (id, body) => api.patch(`/rental-contracts/${id}`, body).then(data),
  void: (id) => api.post(`/rental-contracts/${id}/void`).then(data),
  remove: (id) => api.delete(`/rental-contracts/${id}`).then(data),
};

export const CONTRACT_STATUS = {
  DRAFT: { label: "Draft", tone: "gray", hex: "#94a3b8" },
  SENT: { label: "Sent", tone: "blue", hex: "#1d4f91" },
  VIEWED: { label: "Opened by customer", tone: "violet", hex: "#7c3aed" },
  SIGNED: { label: "Signed", tone: "green", hex: "#059669" },
  DECLINED: { label: "Declined", tone: "red", hex: "#b42318" },
  VOID: { label: "Void", tone: "gray", hex: "#94a3b8" },
};

export default ContractApi;

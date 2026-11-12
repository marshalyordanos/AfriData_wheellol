import api from "../../api/api";

export const LOCATION_TYPES = [
  {
    value: "REGION",
    label: "Region",
    sub: "Regional state, e.g. Afar, Amhara, Oromia",
    tone: "blue",
    color: "#2563eb",
    bg: "#eff6ff",
  },
  {
    value: "CITY_ADMINISTRATION",
    label: "City administration",
    sub: "Chartered city: Addis Ababa, Dire Dawa",
    tone: "orange",
    color: "#c2410c",
    bg: "#fff4ef",
  },
  {
    value: "CITY",
    label: "City / town",
    sub: "A town inside a region, e.g. Jijiga",
    tone: "violet",
    color: "#7c3aed",
    bg: "#f5f3ff",
  },
];

export const typeMeta = (t) =>
  LOCATION_TYPES.find((x) => x.value === t) || LOCATION_TYPES[0];

const LocationService = {
  list: ({ page = 1, pageSize = 10, search, type, active, pickup } = {}) =>
    api
      .get("/locations", {
        params: {
          page,
          pageSize,
          search: search || undefined,
          type: type || undefined,
          active: active || undefined,
          pickup: pickup || undefined,
        },
      })
      .then((r) => r.data),
  create: (data) => api.post("/locations", data).then((r) => r.data.data),
  update: (id, data) =>
    api.patch(`/locations/${id}`, data).then((r) => r.data.data),
  remove: (id) => api.delete(`/locations/${id}`).then((r) => r.data.data),
};

export default LocationService;

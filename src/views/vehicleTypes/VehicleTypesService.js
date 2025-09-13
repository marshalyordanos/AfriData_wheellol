import api from "../../api/api";

class VehicleTypesService {
  // Create
  create(data) {
    return api.post("/admin/vehicle-types", data).then((r) => r.data.data);
  }

  update(id, data) {
    return api
      .put(`/admin/vehicle-types/${id}`, data)
      .then((r) => r.data.data);
  }

  // List / Search
  search({
    page = 1,
    limit = 10,
    searchText = "",
    sort = null,
    order = null,
  } = {}) {
    let url = `/admin/vehicle-types?page=${page}&limit=${limit}`;
    if (sort) {
      const sortValue =
        order === "ascend" ? sort : order === "descend" ? `-${sort}` : "";
      if (sortValue) url += `&sort=${sortValue}`;
    }
    if (searchText) url += `&searchText=${encodeURIComponent(searchText)}`;
    return api
      .get(url)
      .then((r) => ({ data: r.data.data, total: r.data.total }));
  }

  // Single fetch
  get(id) {
    return api.get(`/admin/vehicle-types/${id}`).then((r) => r.data.data);
  }

  // Delete
  remove(id) {
    return api.delete(`/admin/vehicle-types/${id}`).then((r) => r.data.data);
  }
}

export default new VehicleTypesService();

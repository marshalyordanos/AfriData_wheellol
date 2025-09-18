import api from "../../api/api";

class FeaturesService {
  // Create
  create(data) {
    return api.post("/cars/features", data).then((r) => r.data.data);
  }

  update(id, data) {
    return api.put(`/cars/features/${id}`, data).then((r) => r.data.data);
  }

  // List / Search
  search({
    page = 1,
    limit = 20,
    searchText = "",
    sort = null,
    order = null,
  } = {}) {
    let url = `/cars/features?page=${page}&limit=${limit}`;
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
    return api.get(`/cars/features/${id}`).then((r) => r.data.data);
  }

  // Delete
  remove(id) {
    return api.delete(`/cars/features/${id}`).then((r) => r.data.data);
  }
}

export default new FeaturesService();

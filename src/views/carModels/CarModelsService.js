import api from "../../api/api";

class CarModelsService {
  // Create a new model
  createModelFields({ name, makeId }) {
    return api
      .post(`/car-models`, { name, makeId })
      .then((res) => res.data.data);
  }

  // Update a model
  updateModelFields(id, { name, makeId }) {
    return api
      .put(`/car-models/${id}`, { name, makeId })
      .then((res) => res.data.data);
  }

  // Delete a model
  deleteModel(id) {
    return api.delete(`/car-models/${id}`).then((res) => res.data.data);
  }

  // Fetch models with optional search and pagination
  searchModels({ page, limit, searchText = "" }) {
    let url = `/car-models?page=${page}&limit=${limit}`;
    if (searchText) {
      url += `&search=name:${encodeURIComponent(searchText)}`;
    }
    return api.get(url).then((res) => ({
      data: res.data.data,
      total: res.data.pagination.total,
    }));
  }

  // Fetch all brands (makes)
  fetchAllBrands(searchText = "") {
    let url = `/car-makes`;
    if (searchText) url += `?searchText=${encodeURIComponent(searchText)}`;
    return api.get(url).then((res) => res.data.data || []);
  }
}

export default new CarModelsService();

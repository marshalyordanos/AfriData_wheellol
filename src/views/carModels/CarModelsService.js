// src/views/car-models/CarModelsService.js
import api from "../../api/api";

class CarModelsService {
  // Create a new model
  createModelFields({ name, makeId, isActive }) {
    return api
      .post(`/car-models`, { name, makeId, isActive }) // 👈 include isActive
      .then((res) => res.data.data);
  }

  // Update a model
  updateModelFields({ id, name, makeId, isActive }) {
    return api
      .patch(`/car-models/${id}`, { name, makeId, isActive }) // 👈 include isActive
      .then((res) => res.data.data);
  }

  // Get one model (with brand/make included)
  getModel(id) {
    return api
      .get(`/car-models/${id}?include=make`)
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

  getModelsByBrand({ brandId, page = 1, limit = 10, searchText = "" }) {
    let url = `/car-models?makeId=${brandId}&page=${page}&limit=${limit}`;
    if (searchText) {
      url += `&search=name:${encodeURIComponent(searchText)}`;
    }
    return api.get(url).then((res) => ({
      data: res.data.data,
      total: res.data.pagination.total,
    }));
  }
}

export default new CarModelsService();

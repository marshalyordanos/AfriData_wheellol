import api from "../../api/api";

class CarModelsService {
  createModel(data) {
    return api
      .post("/admin/models/", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        return response.data.data;
      });
  }

  updateModel(data, id) {
    return api
      .put("/admin/models/" + id, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        return response.data.data;
      });
  }

  // Update simple fields (name, brand) using JSON body (no multipart)
  updateModelFields(id, { name, brand_id }) {
    return api
      .put(`/admin/models/${id}`, { name, brand: brand_id })
      .then((response) => response.data.data);
  }

  createModelFields({ name, brand_id }) {
    return api
      .post(`/admin/models`, { name, brand: brand_id })
      .then((response) => response.data.data);
  }

  searchModels({ page, limit, searchText = null, sort = null, order }) {
    let url = `/admin/models?page=${page}&limit=${limit}`;
    if (sort) {
      const sortValue =
        order == "ascend" ? sort : order == "descend" ? "-" + sort : "";
      url = url + `&sort=${sortValue}`;
    }

    if (searchText) {
      url = url + `&searchText=${searchText}`;
    }

    return api.get(url).then((response) => {
      return { data: response.data.data, total: response.data.total };
    });
  }

  getModel(id) {
    return api.get("/admin/models/" + id).then((response) => {
      return response.data.data;
    });
  }

  // Fetch all brands for dropdown (large limit)
  fetchAllBrands(searchText = "") {
    const limit = 500;
    const url = `/admin/brands?page=1&limit=${limit}$${""}`;
    // (Optional) Add search param if backend supports same query param name
    return api
      .get(
        searchText
          ? `/admin/brands?page=1&limit=${limit}&searchText=${encodeURIComponent(
              searchText
            )}`
          : `/admin/brands?page=1&limit=${limit}`
      )
      .then((res) => res.data.data || []);
  }

  deleteModel(id) {
    return api.delete("/admin/models/" + id).then((response) => {
      return response.data.data;
    });
  }

  modelsDo({ method, payload }) {
    return api.post("/models/do", { method, payload }).then((response) => {
      return response.data.data;
    });
  }

  modelDo({ method, payload, id }) {
    return api
      .post("/models/do/" + id, { method, payload })
      .then((response) => {
        return response.data.data;
      });
  }
}
// singleton export with correct class reference
export default new CarModelsService();

import api from "../../api/api";

class CategorysService {
  createCategory(data) {
    return api.post("/admin/categories", data).then((response) => {
      return response.data.data;
    });
  }

  updateCategory(data, id) {
    return api.patch("/admin/categories/" + id, data).then((response) => {
      return response.data.data;
    });
  }

  searchCategory({ page, limit, searchText = null, sort = null, order }) {
    let url = `/admin/categories?page=${page}&limit=${limit}`;
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

  getCategory(id) {
    return api.get("/admin/categories/" + id).then((response) => {
      return response.data.data;
    });
  }

  deleteCategory(id) {
    return api.delete("/admin/categories/" + id).then((response) => {
      return response.data.data;
    });
  }

  categorysDo({ method, payload }) {
    return api
      .post("/admin/categories/do", { method, payload })
      .then((response) => {
        return response.data.data;
      });
  }

  categoryDo({ method, payload, id }) {
    return api
      .post("/admin/categories/do/" + id, { method, payload })
      .then((response) => {
        return response.data.data;
      });
  }
}

export default new CategorysService();

import api from "../../api/api";

class BrandsService {
  createBrand(data) {
    return api
      .post("/admin/brands/", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        return response.data.data;
      });
  }

  updateBrand(data, id) {
    return api
      .put("/admin/brands/" + id, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        return response.data.data;
      });
  }

  searchBrand({ page, limit, searchText = null, sort = null, order }) {
    let url = `/admin/brands?page=${page}&limit=${limit}`;
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

  getBrand(id) {
    return api.get("/admin/brands/" + id).then((response) => {
      return response.data.data;
    });
  }

  deleteBrand(id) {
    return api.delete("/admin/brands/" + id).then((response) => {
      return response.data.data;
    });
  }

  brandsDo({ method, payload }) {
    return api.post("/brands/do", { method, payload }).then((response) => {
      return response.data.data;
    });
  }

  brandDo({ method, payload, id }) {
    return api
      .post("/brands/do/" + id, { method, payload })
      .then((response) => {
        return response.data.data;
      });
  }
}

export default new BrandsService();

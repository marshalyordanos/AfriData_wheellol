import api from "../../api/api";

class CartypesService {
  createCartype(data) {
    return api.post("/cartypes", data).then((response) => {
      return response.data.data;
    });
  }

  updateCartype(data, id) {
    return api.patch("/cartypes/" + id, data).then((response) => {
      return response.data.data;
    });
  }

  searchCartype({ page, limit, searchText = null, sort = null, order }) {
    let url = `/cartypes?page=${page}&limit=${limit}`;
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

  getCartype(id) {
    return api.get("/cartypes/" + id).then((response) => {
      return response.data.data;
    });
  }

  deleteCartype(id) {
    return api.delete("/cartypes/" + id).then((response) => {
      return response.data.data;
    });
  }

  cartypesDo({ method, payload }) {
    return api.post("/cartypes/do", { method, payload }).then((response) => {
      return response.data.data;
    });
  }

  cartypeDo({ method, payload, id }) {
    return api
      .post("/cartypes/do/" + id, { method, payload })
      .then((response) => {
        return response.data.data;
      });
  }
}

export default new CartypesService();

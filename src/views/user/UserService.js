import api from "../../api/api";

class UserService {
  createUse(data) {
    return api.post("/user", data).then((response) => {
      return response.data.data;
    });
  }

  updateUse(data, id) {
    return api.patch("/user/" + id, data).then((response) => {
      return response.data.data;
    });
  }

  searchUse({ page, limit, searchText = null, sort = null, order, data }) {
    let url = `/user/all-users?page=${page}&limit=${limit}`;
    if (sort) {
      const sortValue =
        order == "ascend" ? sort : order == "descend" ? "-" + sort : "";
      url = url + `&sort=${sortValue}`;
    }
    if (data) {
      url = url + `&role=${data}`;
    }

    if (searchText) {
      url = url + `&searchText=${searchText}`;
    }

    return api.get(url).then((response) => {
      return { data: response.data.data, total: response.data.total };
    });
  }

  getUse(id) {
    return api.get("/user/" + id).then((response) => {
      return response.data.data;
    });
  }

  deleteUse(id) {
    return api.delete("/user/" + id).then((response) => {
      return response.data.data;
    });
  }

  userDo({ method, payload }) {
    return api.post("/user/do", { method, payload }).then((response) => {
      return response.data.data;
    });
  }

  useDo({ method, payload, id }) {
    return api.post("/user/do/" + id, { method, payload }).then((response) => {
      return response.data.data;
    });
  }
}

export default new UserService();

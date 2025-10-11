import api from "../../api/api";

class UserService {
  createUse(data) {
    return api.post("/users", data).then((response) => {
      return response.data.data;
    });
  }

  updateUse(data, id) {
    return api.patch("/users/" + id, data).then((response) => {
      return response.data.data;
    });
  }

  searchUse({
    page = 1,
    limit = 10,
    search = null,
    filter = null,
    sort = null,
    order = null,
  } = {}) {
    let params = [];

    // Pagination
    params.push(`page=${page}`);
    params.push(`pageSize=${limit}`);

    // Search
    if (search) {
      params.push(`search=${encodeURIComponent(search)}`);
    }

    // Filter
    if (filter) {
      const filterParams = Object.entries(filter)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}:[${value.join(",")}]`;
          }
          return `${key}:${value}`;
        })
        .join(",");
      params.push(`filter=${encodeURIComponent(filterParams)}`);
    }

    // Sort
    if (sort) {
      // If order is provided, use it
      let sortValue = order === "desc" ? `-${sort}` : sort;
      params.push(`sort=${sortValue}`);
    }

    const url = `users?${params.join("&")}`;

    return api.get(url).then((r) => ({
      data: r.data.data,
      total: r.data.pagination?.total,
    }));
  }

  getUse(id) {
    return api.get("/users/" + id).then((response) => {
      return response.data.data;
    });
  }

  deleteUse(id) {
    return api.delete("/users/" + id).then((response) => {
      return response.data.data;
    });
  }
}

export default new UserService();

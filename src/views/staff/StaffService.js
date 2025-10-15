import api from "../../api/api";

class StaffService {
  createStaff(data) {
    return api.post("/users/", data).then((response) => {
      return response.data.data;
    });
  }

  updateStaff(data, id) {
    return api.patch("/users/" + id, data).then((response) => {
      return response.data.data;
    });
  }

  searchStaffs({
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
      params.push(`search=all:${encodeURIComponent(search)}`);
    }

    // Filter
    if (filter) {
      const filterParams = Object.entries(filter)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}:[${value.join(",")} ]`;
          }
          return `${key}:${value}`;
        })
        .join(",");
      params.push(`filter=${encodeURIComponent(filterParams)}`);
    }

    // Sort
    if (sort) {
      let sortValue = `${sort}:${order || "asc"}`;
      params.push(`sort=${sortValue}`);
    }

    const url = `users/staffs?${params.join("&")}`;

    return api.get(url).then((r) => ({
      data: r.data.data,
      total: r.data.pagination?.total,
    }));
  }

  getStaff(id) {
    return api.get("/users/" + id).then((response) => {
      return response.data.data;
    });
  }

  activateStaff(id) {
    const data = {
      isActive: true,
    };
    return api
      .patch("/users/update-active-satus/" + id, data)
      .then((response) => {
        return response.data;
      });
  }
  deactivateStaff(id) {
    const data = {
      isActive: false,
    };
    return api
      .patch("/users/update-active-satus/" + id, data)
      .then((response) => {
        return response.data;
      });
  }
  assignRoleToStaff(data) {
    return api
      .patch("/access-control/assign-user-role", data)
      .then((response) => {
        return response.data;
      });
  }
}

export default new StaffService();

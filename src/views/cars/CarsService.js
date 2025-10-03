import api from "../../api/api";

class CarsService {
  createCar(data) {
    return api
      .post("/admin/cars", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        return response.data.data;
      });
  }

  updateCar(data, id) {
    return api
      .patch("/admin/cars/editcar/" + id, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        return response.data.data;
      });
  }

  searchCar({
    page,
    limit,
    searchText = null,
    sort = null,
    order,
    notActiveOnly = false,
    notApprovedOnly = false,
  }) {
    let url = `/admin/listcars?page=${page}&limit=${limit}`;
    if (sort) {
      const sortValue =
        order == "ascend" ? sort : order == "descend" ? "-" + sort : "";
      url = url + `&sort=${sortValue}`;
    }
    
    if (searchText) {
      url = url + `&searchText=${encodeURIComponent(searchText)}`;
    }

    if (notActiveOnly) {
      url = url + `&is_active=false`;
    }

    if (notApprovedOnly) {
      // assuming backend uses status=pending (adjust if different)
      url = url + `&status=pending`;
    }

    return api.get(url).then((response) => {
      return { data: response.data.data, total: response.data.total };
    });
  }

  getCar(id) {
    return api.get("/admin/cars/" + id).then((response) => {
      return response.data.data;
    });
  }

  getCarSilent(id) {
    return api
      .get("/admin/cars/" + id, { suppressErrorToast: true })
      .then((response) => response.data.data);
  }

  deleteCar(id) {
    return api.delete("/cars/" + id).then((response) => {
      return response.data.data;
    });
  }

  // Admin actions
  adminApproveCar(carId) {
    return api
      .patch(`/admin/cars/approve/${carId}`, { status: true })
      .then((response) =>
        response.data && response.data.car ? response.data.car : null
      )
      .catch(() => null);
  }

  adminRejectCar(carId, reason) {
    return api
      .patch(`/admin/cars/reject/${carId}`, { reason })
      .then((response) =>
        response.data && response.data.car ? response.data.car : null
      )
      .catch(() => null);
  }

  adminToggleCarActiveStatus(carId, status) {
    return api
      .patch(`/admin/cars/activate/${carId}`, { status })
      .then((response) =>
        response.data && response.data.car ? response.data.car : null
      )
      .catch(() => null);
  }
  adminEditCar(carId, status) {
    return api
      .patch(`/admin/cars/editcar/${carId}`, { status })
      .then((response) =>
        response.data && response.data.car ? response.data.car : null
      )
      .catch(() => null);
  }
  adminDeleteCar(carId, status) {
    return api
      .delete(`/admin/cars/deletecar/${carId}`, { status })
      .then((response) =>
        response.data && response.data.car ? response.data.car : null
      )
      .catch(() => null);
  }
}

export default new CarsService();

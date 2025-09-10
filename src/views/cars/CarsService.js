import api from "../../api/api";

class CarsService {
  createCar(data) {
    return api
      .post("/cars", data, {
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
      .patch("/car-owner/cars/" + id, data, {
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
      url = url + `&is_active=false`;
    }

    return api.get(url).then((response) => {
      return { data: response.data.data, total: response.data.total };
    });
  }

  getCar(id) {
    return api.get("/cars/" + id).then((response) => {
      return response.data.data;
    });
  }

  getCarSilent(id) {
    return api
      .get("/cars/" + id, { suppressErrorToast: true })
      .then((response) => response.data.data);
  }

  deleteCar(id) {
    return api.delete("/cars/" + id).then((response) => {
      return response.data.data;
    });
  }

  // Admin actions
  adminApproveCar(carId) {
    return api.patch(`/admin/cars/approve/${carId}`).then((response) => {
      return response.data.data;
    });
  }

  adminRejectCar(carId) {
    return api.patch(`/admin/cars/reject/${carId}`).then((response) => {
      return response.data.data;
    });
  }

  adminToggleCarActiveStatus(carId) {
    return api.patch(`/admin/cars/activate/${carId}`).then((response) => {
      return response.data.data;
    });
  }
}

export default new CarsService();

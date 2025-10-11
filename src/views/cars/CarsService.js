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
      .patch("cars/" + id, data, {
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
    let url = `/cars?page=${page}&limit=${limit}`;
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

  // // Admin actions
  // adminApproveCar(carId) {
  //   return api
  //     .patch(`/admin/cars/approve/${carId}`, { status: true })
  //     .then((response) =>
  //       response.data && response.data.car ? response.data.car : null
  //     )
  //     .catch(() => null);
  // }
  // adminRejectCar(carId, reason) {
  //   return api
  //     .patch(`/admin/cars/reject/${carId}`, { reason })
  //     .then((response) =>
  //       response.data && response.data.car ? response.data.car : null
  //     )
  //     .catch(() => null);
  // }
  // adminToggleCarActiveStatus(carId, status) {
  //   return api
  //     .patch(`/admin/cars/activate/${carId}`, { status })
  //     .then((response) =>
  //       response.data && response.data.car ? response.data.car : null
  //     )
  //     .catch(() => null);
  // }
  // adminEditCar(carId, status) {
  //   return api
  //     .patch(`/admin/cars/editcar/${carId}`, { status })
  //     .then((response) =>
  //       response.data && response.data.car ? response.data.car : null
  //     )
  //     .catch(() => null);
  // }
  // adminDeleteCar(carId, status) {
  //   return api
  //     .delete(`/cars/${carId}`, { status })
  //     .then((response) =>
  //       response.data && response.data.car ? response.data.car : null
  //     )
  //     .catch(() => null);
  // }
  getBrands() {
    return api.get("/car-makes").then((res) => res.data.data || []);
  }

  getModels(brandId) {
    console.log(brandId);
    let url = "/car-models";
    if (brandId) url += `?filter=makeId:${brandId}`;

    return api.get(url).then((res) => {
      const data = res.data.data || [];
      console.log("Models data:", data);
      return data;
    });
  }

  // Insurance APIs

  // GET insurance by car ID
  getCarInsurance(carId) {
    return api.get(`/cars/insurance/${carId}`).then((res) => {
      // backend returns { success, message, data: [ ... ] }
      const list = res.data?.data || [];
      return list.length > 0 ? list[0] : null; // return single insurance if exists
    });
  }

  // POST create new insurance
  createCarInsurance(data) {
    return api
      .post("/cars/insurance", data)
      .then((res) => res.data?.data || res.data);
  }

  // PATCH update existing insurance
  updateCarInsurance(insuranceId, data) {
    return api
      .patch(`/cars/insurance/${insuranceId}`, data)
      .then((res) => res.data?.data || res.data);
  }

  deleteCarInsurance(id) {
    return api.delete(`/cars/insurance/${id}`).then((res) => res.data.data);
  }
}

export default new CarsService();

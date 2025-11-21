// src/views/cars/CarsList.jsx
import React, { useEffect, useRef, useState } from "react";
import CommonTable from "../../components/commons/CommonTable";
import CarInsurancePage from "./CarInsurancePage";
import { MoreOutlined, ReloadOutlined, PlusOutlined } from "@ant-design/icons";
import api from "../../api/api";
import {
  Button,
  Dropdown,
  Image,
  Input,
  Tag,
  message,
  Select,
  InputNumber,
  Pagination,
} from "antd";
import CommonModal from "../../components/commons/CommonModel";
import CommonDeleteModal from "../../components/commons/CommonDeleteModal";
import carsService from "./CarsService";
import CarsEdit from "./CarsEdit";
import { useDispatch, useSelector } from "react-redux";
import {
  searchCars,
  updateCarsState,
  carsSearchText,
  carsQuery,
  carsPage,
  carsLimit,
} from "./CarsRedux";
import { useSearchParams, useNavigate } from "react-router-dom";
import SummaryCard from "../../components/commons/SummaryCard";
import {
  FaBolt,
  FaBook,
  FaCar,
  FaExclamationCircle,
  FaLeaf,
  FaMoneyBillWave,
  FaUsers,
} from "react-icons/fa";
import {
  selectcarSummary,
  selectCurrentUser,
} from "../../redux/auth/authSlice";
import CommonCard from "../../components/commons/CommonCard";
import CommonCardSkeleton from "../../components/commons/CommonSkeleton";

// ✅ Helper: find brand/model name from ID
const findNameById = (items, id) => {
  if (!items || !id) return "-";
  const found = items.find(
    (item) => item.id === id || item._id === id || item.name === id
  );
  return found ? found.name : "-";
};

const CarsList = () => {
  const [carsData, setCarsData] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);

  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedCarType, setSelectedCarType] = useState(null);

  const [selectedType, setSelectedType] = useState(null);
  const [filteredModels, setFilteredModels] = useState([]); // new state for filtered models
  const [filteredCarType, setFilteredCarType] = useState([]); // new state for filtered models

  const [priceRange, setPriceRange] = useState([0, 99999]);
  const [total, setTotal] = useState(0);

  const searchText = useSelector(carsSearchText);
  const { notActiveOnly, notApprovedOnly } = useSelector(carsQuery);
  const [carSummary, setCarSUmmary] = useState({});
  const carpage = useSelector(carsPage);
  const carlimit = useSelector(carsLimit);
  const userData = useSelector(selectCurrentUser);

  const [loading, setLoading] = useState(false);

  const [carsSelection, setCarsSelection] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [carId, setCarId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const delayTimerRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const getPaginationInfo = () => {
    return [searchParams.get("page") || 1, searchParams.get("limit") || 5];
  };

  console.log("userData: ", userData);
  useEffect(() => {
    const [page, limit] = getPaginationInfo();
    dispatch(updateCarsState({ page, limit }));

    // ✅ Load brands & models first, then fetch cars
    loadBrandsAndModels().then(() => {
      searchData();
    });
  }, [selectedBrand, selectedCarType, selectedModel]);

  const loadBrandsAndModels = async () => {
    try {
      setLoading(true);

      const [brandsData, modelsData, getCarType] = await Promise.all([
        carsService.getBrands(),
        carsService.getModels(),
        carsService.getCarType(),
      ]);
      setBrands(brandsData);
      setModels(modelsData);
      setFilteredModels(modelsData); // initialize filteredModels to all models
      setFilteredCarType(getCarType);
    } catch (err) {
      setLoading(false);

      console.error("Failed to load brands/models", err);
    }
  };

  const searchData = async () => {
    try {
      setLoading(true);
      const { payload } = await dispatch(
        searchCars({ selectedBrand, selectedCarType, selectedModel })
      );

      const mappedCars = (payload.data || []).map((car) => ({
        ...car,
        images: car.photos || [],
        brand: car.make || {},
        model: car.model || {}, // ✅ fixed
        carType: car.carType || "-",
        rentalPricePerDay: car.rentalPricePerDay || car.dailyRate || 0,
        seatingCapacity: car.seatingCapacity || "-",
      }));

      setCarsData(mappedCars);
      setFilteredCars(mappedCars);
      setTotal(payload.pagination?.total || mappedCars.length);
    } catch (err) {
      message.error("Failed to fetch cars");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  // Fetch summary on load
  const fetchSummary = async () => {
    try {
      const res = await api.get("users/summary?entity=car");
      setCarSUmmary(res.data.data?.car);

      console.log("fetchSummary: ", res.data);
    } catch (error) {
      console.error("fetchSummary: ", error);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);
  // ✅ Filtering logic
  // useEffect(() => {
  //   let filtered = [...carsData];

  //   if (selectedBrand) {
  //     filtered = filtered.filter(
  //       (c) => c.brand?.id === selectedBrand || c.make?.id === selectedBrand
  //     );
  //   }

  //   if (selectedModel) {
  //     filtered = filtered.filter(
  //       (c) =>
  //         c.model?.id === selectedModel ||
  //         c.modelId === selectedModel ||
  //         c.model?.name === selectedModel
  //     );
  //   }

  //   if (selectedType) {
  //     filtered = filtered.filter(
  //       (c) => c.carType?.toLowerCase() === selectedType.toLowerCase()
  //     );
  //   }

  //   if (priceRange) {
  //     filtered = filtered.filter(
  //       (c) =>
  //         c.rentalPricePerDay >= priceRange[0] &&
  //         c.rentalPricePerDay <= priceRange[1]
  //     );
  //   }

  //   setFilteredCars(filtered);
  // }, [selectedBrand, selectedModel, selectedType, priceRange, carsData]);
  // ✅ Filtering logic for cars
  // useEffect(() => {
  //   let filtered = [...carsData];

  //   if (selectedBrand) {
  //     filtered = filtered.filter(
  //       (c) => c.brand?.id === selectedBrand || c.make?.id === selectedBrand
  //     );
  //   }

  //   if (selectedModel) {
  //     filtered = filtered.filter(
  //       (c) =>
  //         c.model?.id === selectedModel ||
  //         c.modelId === selectedModel ||
  //         c.model?.name === selectedModel
  //     );
  //   }

  //   if (selectedType) {
  //     filtered = filtered.filter(
  //       (c) => c.carType?.toLowerCase() === selectedType.toLowerCase()
  //     );
  //   }

  //   if (priceRange) {
  //     filtered = filtered.filter(
  //       (c) =>
  //         c.rentalPricePerDay >= priceRange[0] &&
  //         c.rentalPricePerDay <= priceRange[1]
  //     );
  //   }

  //   setFilteredCars(filtered);
  // }, [selectedBrand, selectedModel, selectedType, priceRange, carsData]);

  // ✅ Filtering logic for models based on selected brand
  // useEffect(() => {
  //   if (selectedBrand) {
  //     const filtered = models.filter(
  //       (m) =>
  //         m.brandId === selectedBrand ||
  //         m.makeId === selectedBrand ||
  //         m.brand?.id === selectedBrand
  //     );
  //     setFilteredModels(filtered);
  //   } else {
  //     setFilteredModels(models);
  //   }
  // }, [selectedBrand, models]);

  const searchHandler = (e) => {
    const { value } = e.target;
    const [page, limit] = getPaginationInfo();
    dispatch(updateCarsState({ page, limit, searchText: value }));

    clearTimeout(delayTimerRef.current);
    delayTimerRef.current = setTimeout(() => {
      searchData();
    }, 500);
  };

  const handlePagination = (page, pageSize) => {
    setSearchParams({ page, limit: pageSize });
    dispatch(updateCarsState({ page, limit: pageSize }));
    searchData();
  };

  const tableChange = (pagination, filters, sorter) => {
    const { field, order } = sorter;
    dispatch(updateCarsState({ sort: field, order }));
    searchData();
  };

  const handleReload = () => {
    setSearchParams({ page: 1, limit: 5 });
    dispatch(
      updateCarsState({
        page: 1,
        limit: 5,
        sort: "",
        order: "",
        searchText: "",
        notActiveOnly: false,
        notApprovedOnly: false,
      })
    );
    setSelectedBrand(null);
    setSelectedModel(null);
    setSelectedType(null);
    setPriceRange([0, 99999]);
    searchData();
  };

  const confirmDelete = (car) => {
    setDeleteTarget(car);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setLoading(true);
      await carsService.deleteCar(deleteTarget.id || deleteTarget._id, true);
      message.success("Car deleted successfully");
      setIsDeleteModalOpen(false);
      searchData();
    } catch (err) {
      message.error("Failed to delete car");
    } finally {
      setLoading(false);
      setDeleteTarget(null);
    }
  };

  const items = [
    { key: "edit", label: <Button type="text">Edit</Button> },
    { key: "delete", label: <Button type="text">Delete</Button> },
    { key: "insurance", label: <Button type="text">Insurance</Button> },
  ];

  const onActionClick = ({ key, domEvent }, record) => {
    domEvent?.stopPropagation();
    if (key === "edit") {
      setCarId(record?.id || record?._id);
      setIsModalOpen(true);
    }
    if (key === "delete") {
      setDeleteTarget(record);
      setIsDeleteModalOpen(true);
    }
    if (key === "insurance") {
      navigate(`/dash/cars/${record?.id || record?._id}/insurance`);
    }
  };

  const columns = [
    {
      title: "Action",
      dataIndex: "action",
      width: 60,
      render: (_, record) => (
        <Dropdown
          menu={{ items, onClick: (value) => onActionClick(value, record) }}
          trigger={["click"]}
          placement="bottomLeft"
        >
          <Button
            type="text"
            icon={<MoreOutlined style={{ fontSize: 20 }} />}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
    {
      title: "Image",
      dataIndex: "photos",
      render: (_, record) => {
        console.log(record);
        const imagesArr = Array.isArray(record.photos) ? record.photos : [];
        const first = imagesArr[0];
        if (!first) return null;
        return (
          <Image
            width={80}
            style={{ objectFit: "cover", maxHeight: 50 }}
            src={first}
            preview={{ src: first }}
            alt={record.make?.name || record.model?.name || "car image"}
            onClick={(e) => e.stopPropagation()}
          />
        );
      },
    },
    {
      title: "Car Type",
      dataIndex: "carType",
      render: (_, record) => record.carType?.name || "-",
    },
    {
      title: "Brand",
      dataIndex: "make",
      render: (_, record) => record.make?.name || "-",
    },
    {
      title: "Model",
      dataIndex: "modelId",
      render: (modelId, record) =>
        findNameById(models, modelId || record.model?.id),
    },
    { title: "Year", dataIndex: "year" },
    {
      title: "Rental Price / Day",
      dataIndex: "rentalPricePerDay",
      render: (price) => (price ? `$${price}` : "-"),
    },
    {
      title: "Active",
      dataIndex: "isActive",
      render: (val) =>
        val ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>,
    },
    {
      title: "Details",
      key: "details",
      render: (_, record) => {
        const id = record._id || record.id;
        return (
          <Button
            type="link"
            style={{ color: "var(--color-primary)" }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dash/cars/details/${id}`, { state: record });
            }}
          >
            View
          </Button>
        );
      },
    },
    // {
    //   title: "Reviews",
    //   key: "reviews",
    //   render: (_, record) => {
    //     const id = record._id || record.id;
    //     return (
    //       <Button
    //         type="link"
    //         onClick={(e) => {
    //           e.stopPropagation();
    //           navigate(`/dash/cars/reviews/${id}`, { state: record });
    //         }}
    //       >
    //         View Reviews
    //       </Button>
    //     );
    //   },
    // },
  ];

  return (
    <div className="p-6">
      {/* ✅ Modal for Create / Edit */}
      {isModalOpen && (
        <CommonModal
          width={1000}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
        >
          <CarsEdit
            carId={carId}
            setIsModalOpen={setIsModalOpen}
            refreshData={searchData}
          />
        </CommonModal>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <CommonDeleteModal
          setIsModalOpen={setIsDeleteModalOpen}
          handleDelete={handleDelete}
          loading={loading}
          isModalOpen={isDeleteModalOpen}
        >
          <h1 className="text-2xl text-center font-semibold mb-2">
            Are you sure?
          </h1>
          <p className="text-center text-gray-600">
            This will permanently delete{" "}
            <strong>
              {deleteTarget?.model?.name || deleteTarget?.id || "this car"}
            </strong>
            .
          </p>
        </CommonDeleteModal>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {/* Booking Cards */}

        {/* Total Cars */}
        <SummaryCard
          title="Total Cars"
          value={carSummary?.totalCars ?? 0}
          Icon={FaCar}
          iconBgColor="bg-indigo-100"
          iconColor="text-indigo-500"
          description="Available cars"
        />

        {/* Electric Cars */}
        <SummaryCard
          title="Electric Cars"
          value={
            carSummary?.byEco?.find((item) => item.ecoFriendly === "ELECTRIC")
              ?.count ?? 0
          }
          Icon={FaBolt}
          iconBgColor="bg-green-100"
          iconColor="text-green-500"
          description="Electric cars available"
        />

        {/* Hybrid Cars */}
        <SummaryCard
          title="Hybrid Cars"
          value={
            carSummary?.byEco?.find((item) => item.ecoFriendly === "HYBRID")
              ?.count ?? 0
          }
          Icon={FaLeaf}
          iconBgColor="bg-yellow-100"
          iconColor="text-yellow-500"
          description="Hybrid cars available"
        />
      </div>
      {/* ✅ Header with Add Car */}
      <div className="flex flex-col border-b border-gray-300 pb-4 mb-4">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <Input
            placeholder="Search"
            value={searchText}
            onChange={searchHandler}
            allowClear
            className="rounded-lg py-2 drop-shadow-sm w-52"
          />

          <Select
            placeholder="Filter by Brand"
            allowClear
            style={{ width: 180 }}
            value={selectedBrand}
            onChange={(val) => setSelectedBrand(val)}
          >
            {brands.map((b) => (
              <Select.Option key={b.id} value={b.id}>
                {b.name}
              </Select.Option>
            ))}
          </Select>

          <Select
            placeholder="Filter by Model"
            allowClear
            style={{ width: 180 }}
            value={selectedModel}
            onChange={(val) => setSelectedModel(val)}
          >
            {filteredModels.map((m) => (
              <Select.Option key={m.id || m.name} value={m.id || m.name}>
                {m.name}
              </Select.Option>
            ))}
          </Select>

          <Select
            placeholder="Filter by Type"
            allowClear
            style={{ width: 180 }}
            value={selectedCarType}
            onChange={(val) => setSelectedCarType(val)}
          >
            {filteredCarType.map((m) => (
              <Select.Option key={m.id || m.name} value={m.id || m.name}>
                {m.name}
              </Select.Option>
            ))}
          </Select>

          <Button
            onClick={handleReload}
            icon={<ReloadOutlined />}
            className="border border-[var(--color-primary)] text-[var(--color-primary)]"
          >
            Reset Filters
          </Button>
          {userData?.role?.name == "HOST" && (
            <button
              className="px-4  py-2 border border-[var(--color-primary)] text-white bg-[var(--color-primary)] rounded ml-auto"
              onClick={() => {
                setCarId("");
                setIsModalOpen(true);
              }}
            >
              <span className="flex flex-row items-center">
                <PlusOutlined />
                <p className="pl-2 m-0">Add New Car</p>
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Cars Table */}
      <div className="hidden md:block">
        <CommonTable
          // rowSelectionType="checkbox"
          data={filteredCars}
          columns={columns}
          setSelection={setCarsSelection}
          handlePagination={handlePagination}
          total={total}
          loadding={loading}
          tableChange={tableChange}
          rowKey={(r) => r?.id || r?._id}
          onRow={(record) => ({
            onClick: () => {
              const id = record?.id || record?._id;
              if (id) navigate(`/dash/cars/details/${id}`, { state: record });
            },
            style: { cursor: "pointer" },
          })}
        />
      </div>

      <div className="block md:hidden">
        {loading &&
          Array(5)
            .fill(1)
            .map((_) => <CommonCardSkeleton />)}
        {filteredCars.length > 0 &&
          filteredCars.map((car) => {
            return (
              <CommonCard
                item={car}
                fieldMap={{
                  // route_schedule: "Vist name",
                  year: "Year",
                  color: "Color",
                  licensePlate: "License Plate",
                  vin: "Vin",
                  "model.name": "Model",
                }}
                title={["make.name", "model.name"]}
                actionItems={items}
                onActionClick={onActionClick}
                onCardClick={(item) => {
                  navigate(`/dash/cars/details/${item.id}`, { state: item });
                }}
              />
            );
          })}

        {/* {carpage} */}
        <div className="flex justify-center my-5">
          <Pagination
            pageSizeOptions={["10", "20"]}
            onChange={(current, pageSize) => {
              handlePagination(current, pageSize);
            }}
            onShowSizeChange={(current, pageSize) => {
              handlePagination(current, pageSize);
            }}
            current={Number(carpage)}
            // defaultCurrent={}
            total={total}
          />
        </div>
      </div>
    </div>
  );
};

export default CarsList;

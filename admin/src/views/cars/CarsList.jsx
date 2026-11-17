// src/views/cars/CarsList.jsx
import React, { useEffect, useRef, useState } from "react";
import CommonTable from "../../components/commons/CommonTable";
import CarInsurancePage from "./CarInsurancePage";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CarOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import {
  Page,
  PageHeader,
  Btn,
  ReloadBtn,
  StatsStrip,
  TableCard,
  StatusPill,
  ActivePill,
  TwoLine,
  RowMenu,
  actionColumn,
  EmptyState,
  prettyStatus,
} from "../../components/modern/ModernUI";
import { shortDate, shortTime } from "../../utils/dateFormat";
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
import {
  formatCurrency,
  formatReadableDate,
} from "../../utils/date_currency_formatter";
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

  // console.log("userData===========: ", userData);
  const role = userData?.user?.role?.name || userData?.role?.name;
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
    return [searchParams.get("page") || 1, searchParams.get("limit") || 10];
  };

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
        rentalPricePerDayFormatted:
          car.rentalPricePerDay ||
          car.dailyRate ||
          car.rentalPrice ||
          car.dailyRate === 0
            ? formatCurrency(
                car.rentalPricePerDay || car.dailyRate || car.rentalPrice
              )
            : "-",
        createdAtFormatted: car.createdAt
          ? formatReadableDate(car.createdAt)
          : "-",
        seatingCapacity: car.seatingCapacity || "-",
      }));

      setCarsData(mappedCars);
      setFilteredCars(mappedCars);
      // If server returns pagination, use it to set total and update redux page/limit
      if (payload.pagination) {
        setTotal(payload.pagination.total || mappedCars.length);
        dispatch(
          updateCarsState({
            page: payload.pagination.page,
            limit: payload.pagination.pageSize,
          })
        );
      } else {
        setTotal(payload.total || mappedCars.length);
      }
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
    setSearchParams({ page: 1, limit: 10 });
    dispatch(
      updateCarsState({
        page: 1,
        limit: 10,
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
    { key: "view", icon: <EyeOutlined />, label: "View details" },
    { key: "edit", icon: <EditOutlined />, label: "Edit car" },
    { key: "insurance", icon: <SafetyCertificateOutlined />, label: "Insurance" },
    { type: "divider" },
    { key: "delete", icon: <DeleteOutlined />, label: "Delete", danger: true },
  ];

  const openDetails = (record) => {
    const id = record?.id || record?._id;
    if (id) navigate(`/dash/cars/details/${id}`, { state: record });
  };

  const onActionClick = ({ key, domEvent }, record) => {
    domEvent?.stopPropagation();
    if (key === "view") openDetails(record);
    if (key === "edit") {
      setCarId(record?.id || record?._id);
      setIsModalOpen(true);
    }
    if (key === "delete") {
      setDeleteTarget(record);
      setIsDeleteModalOpen(true);
    }
    if (key === "insurance") navigate(`/dash/cars/${record?.id || record?._id}/insurance`);
  };

  const carTitle = (r) =>
    `${r.make?.name || ""} ${findNameById(models, r.modelId || r.model?.id) !== "-" ? findNameById(models, r.modelId || r.model?.id) : r.model?.name || ""}`.trim() || "Unnamed car";

  const columns = [
    {
      title: "Car",
      dataIndex: "make",
      render: (_, r) => (
        <div className="mp-cell">
          {Array.isArray(r.photos) && r.photos[0] ? (
            <span onClick={(e) => e.stopPropagation()}>
              <Image
                width={64}
                height={46}
                style={{ objectFit: "cover", borderRadius: 9, border: "1px solid #eceef2" }}
                src={r.photos[0]}
                preview={{ src: r.photos[0] }}
                alt={carTitle(r)}
              />
            </span>
          ) : (
            <span className="mp-thumb is-wide" style={{ width: 64, height: 46 }}>
              <CarOutlined />
            </span>
          )}
          <div className="min-w-0">
            <div className="mp-cell-main">{carTitle(r)}</div>
            <div className="mp-cell-sub">
              {[r.year, r.licensePlate].filter(Boolean).join(" · ") || "—"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "carType",
      render: (_, r) => (r.carType?.name ? <StatusPill tone="gray">{r.carType.name}</StatusPill> : <span className="mp-muted">—</span>),
    },
    {
      title: "Specs",
      key: "specs",
      render: (_, r) => (
        <TwoLine
          main={r.seatingCapacity && r.seatingCapacity !== "-" ? `${r.seatingCapacity} seats` : "—"}
          sub={[r.transmission && prettyStatus(r.transmission), r.fuelType && prettyStatus(r.fuelType), r.ecoFriendly && prettyStatus(r.ecoFriendly)]
            .filter(Boolean)
            .join(" · ")}
        />
      ),
    },
    {
      title: "Color",
      dataIndex: "color",
      render: (c) =>
        c ? (
          <span className="mp-chip">
            <span className="mp-dot" style={{ background: String(c).toLowerCase(), border: "1px solid #e2e6ec", width: 10, height: 10 }} />
            {c}
          </span>
        ) : (
          <span className="mp-muted">—</span>
        ),
    },
    // Price is negotiated per booking request — column hidden for now
    // {
    //   title: "Rental Price / Day",
    //   dataIndex: "rentalPricePerDay",
    //   render: (price, record) =>
    //     price || price === 0 ? record.rentalPricePerDayFormatted || formatCurrency(price) : "-",
    // },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (val) => <ActivePill active={val} />,
    },
    {
      title: "Added",
      dataIndex: "createdAt",
      render: (d) => <TwoLine main={shortDate(d)} sub={shortTime(d)} />,
    },
    actionColumn((_, r) => <RowMenu items={items} record={r} onClick={onActionClick} />),
  ];

  const eco = (k) => carSummary?.byEco?.find((i) => i.ecoFriendly === k)?.count ?? 0;
  const activeCount = filteredCars.filter((c) => c.isActive).length;
  const nameOf = (list, id) => list.find((x) => (x.id || x.name) === id)?.name || id;

  return (
    <Page>
      {isModalOpen && (
        <CommonModal
          width={1000}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          title={carId ? "Edit car" : "Add a car"}
        >
          <CarsEdit carId={carId} setIsModalOpen={setIsModalOpen} refreshData={searchData} />
        </CommonModal>
      )}

      {isDeleteModalOpen && (
        <CommonDeleteModal
          setIsModalOpen={setIsDeleteModalOpen}
          handleDelete={handleDelete}
          loading={loading}
          isModalOpen={isDeleteModalOpen}
        >
          This will permanently delete <strong>{deleteTarget ? carTitle(deleteTarget) : "this car"}</strong>.
        </CommonDeleteModal>
      )}

      <PageHeader
        eyebrow="Operations"
        title="Fleet"
        subtitle="Every car on the platform, with its type, specs and status."
        actions={
          <>
            <ReloadBtn onClick={handleReload} loading={loading} />
            {/* Admin adds the cars in the request flow — was: role == "HOST" */}
            {Boolean(userData) && (
              <Btn
                variant="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setCarId("");
                  setIsModalOpen(true);
                }}
              >
                Add car
              </Btn>
            )}
          </>
        }
      />

      <StatsStrip
        items={[
          { label: "Total cars", value: carSummary?.totalCars ?? total ?? 0, note: "Listed on the platform", color: "#09234c" },
          { label: "Active", value: activeCount, note: "On this page", color: "#059669" },
          { label: "Inactive", value: filteredCars.length - activeCount, note: "On this page", color: "#94a3b8" },
          { label: "Electric", value: eco("ELECTRIC"), note: "Fully electric", color: "#0284c7" },
          { label: "Hybrid", value: eco("HYBRID"), note: "Hybrid engines", color: "#d97706" },
        ]}
      />

      <TableCard
        search={{ value: searchText, onChange: searchHandler, placeholder: "Search make, model or plate" }}
        filters={
          <>
            <Select
              placeholder="Brand"
              allowClear
              showSearch
              optionFilterProp="label"
              className={`mp-filter ${selectedBrand ? "is-on" : ""}`}
              style={{ width: 170 }}
              value={selectedBrand}
              onChange={(val) => setSelectedBrand(val ?? null)}
              options={brands.map((b) => ({ value: b.id, label: b.name }))}
            />
            <Select
              placeholder="Model"
              allowClear
              showSearch
              optionFilterProp="label"
              className={`mp-filter ${selectedModel ? "is-on" : ""}`}
              style={{ width: 170 }}
              value={selectedModel}
              onChange={(val) => setSelectedModel(val ?? null)}
              options={filteredModels.map((m) => ({ value: m.id || m.name, label: m.name }))}
            />
            <Select
              placeholder="Type"
              allowClear
              className={`mp-filter ${selectedCarType ? "is-on" : ""}`}
              style={{ width: 150 }}
              value={selectedCarType}
              onChange={(val) => setSelectedCarType(val ?? null)}
              options={filteredCarType.map((m) => ({ value: m.id || m.name, label: m.name }))}
            />
          </>
        }
        chips={[
          selectedBrand && { k: "Brand", v: nameOf(brands, selectedBrand), onRemove: () => setSelectedBrand(null) },
          selectedModel && { k: "Model", v: nameOf(filteredModels, selectedModel), onRemove: () => setSelectedModel(null) },
          selectedCarType && { k: "Type", v: nameOf(filteredCarType, selectedCarType), onRemove: () => setSelectedCarType(null) },
        ]}
        onClearChips={handleReload}
        resultLabel={`${total || 0} cars`}
      >
        <div className="hidden md:block">
          <CommonTable
            data={filteredCars}
            columns={columns}
            setSelection={setCarsSelection}
            handlePagination={handlePagination}
            total={total}
            loadding={loading}
            tableChange={tableChange}
            currentPage={Number(carpage) || 1}
            pageSize={Number(carlimit) || 10}
            rowKey={(r) => r?.id || r?._id}
            unit="cars"
            onRow={(record) => ({ onClick: () => openDetails(record), style: { cursor: "pointer" } })}
          />
        </div>

        <div className="block md:hidden mp-mlist">
          {loading && Array(4).fill(1).map((_, i) => <CommonCardSkeleton key={i} />)}
          {!loading && filteredCars.length === 0 && <EmptyState title="No cars found" text="Try clearing the filters." />}
          {!loading &&
            filteredCars.map((car) => (
              <CommonCard
                key={car.id || car._id}
                item={car}
                fieldMap={{
                  year: "Year",
                  color: "Color",
                  licensePlate: "Licence plate",
                  "carType.name": "Type",
                  isActive: "Status",
                }}
                title={["make.name", "model.name"]}
                actionItems={items}
                onActionClick={onActionClick}
                onCardClick={openDetails}
              />
            ))}
          <div className="flex justify-center my-5">
            <Pagination
              onChange={(current, pageSize) => handlePagination(current, pageSize)}
              current={Number(carpage) || 1}
              pageSize={Number(carlimit) || 10}
              total={total}
              size="small"
            />
          </div>
        </div>
      </TableCard>
    </Page>
  );
};

export default CarsList;

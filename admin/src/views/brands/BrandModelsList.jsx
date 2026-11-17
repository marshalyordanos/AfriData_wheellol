// src/views/car-models/BrandModelsList.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Input, message, Typography } from "antd";
import CarModelsService from "../carModels/CarModelsService";
import CommonTable from "../../components/commons/CommonTable";

const { Title } = Typography;

const BrandModelsList = () => {
  const { brandId } = useParams();
  const navigate = useNavigate();
  const [allModels, setAllModels] = useState([]);
  const [models, setModels] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [brandName, setBrandName] = useState("");

  const fetchData = async (page = 1, limit = 10, search = "") => {
    try {
      setLoading(true);
      const res = await CarModelsService.getModelsByBrand({
        brandId,
        page,
        limit,
        searchText: search,
      });

      const filtered = res.data.filter((m) => m.makeId === brandId);

      setAllModels(filtered);
      setModels(filtered);
      setTotal(filtered.length);

      // Set brand name if available from the first model
      if (filtered.length > 0) setBrandName(filtered[0].make?.name || "");
    } catch (err) {
      console.error(err);
      message.error("Failed to load models for this brand");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    const filtered = allModels.filter((m) =>
      m.name.toLowerCase().includes(value.toLowerCase())
    );
    setModels(filtered);
    setTotal(filtered.length);
  };

  useEffect(() => {
    fetchData();
  }, [brandId]);

  return (
    <div className="p-6">
      {/* Brand heading */}
      {brandName && (
        <div className="mb-4">
          <Title level={3}>{brandName} Models</Title>
        </div>
      )}

      {/* Search */}
      <div className="flex justify-between mb-4">
        <Input
          placeholder="Search models"
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-sm"
          allowClear
        />
      </div>

      {/* Table */}
      <CommonTable
        data={models}
        columns={[
          { title: "Name", dataIndex: "name", key: "name" },
          {
            title: "Created At",
            dataIndex: "createdAt",
            render: (d) => (d ? new Date(d).toLocaleDateString() : "N/A"),
          },
        ]}
        rowKey="id"
        total={total}
        loadding={loading}
        handlePagination={(page, pageSize) =>
          fetchData(page, pageSize, searchText)
        }
        onRow={(record) => ({
          onClick: () => navigate(`/dash/models/${record.id}`),
        })}
      />
    </div>
  );
};

export default BrandModelsList;

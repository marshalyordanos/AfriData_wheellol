import React, { useEffect, useState } from "react";

import { Input, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import authService from "../../api/auth.service";
import { searchState } from "../../views/state/StateRedux";

const SearchHeader = ({
  placeholderText = "Search...",
  buttonText = "Add",
  onSearchChange,
  onButtonClick,
  stateData,
  isPermitted
  
}) => {
  console.log("stateData", stateData);

  const [hasPermission, setHasPermission] = useState(false);
  useEffect(() => {
    const checkPermission = async () => {
      const permission = await authService.checkPermmision(stateData, "create");
      setHasPermission(permission);
    };
    searchState();

    checkPermission();
  }, []);
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
      }}
    >
      <Input
        placeholder={placeholderText}
        allowClear
        onChange={onSearchChange}
        style={{
          width: "70%",
          borderRadius: "8px",
          height: "40px",
        }}
      />
      {hasPermission && isPermitted && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onButtonClick}
          style={{
            backgroundColor: "#3ab56dff",
            borderColor: "#007bff",
            fontSize: "16px",
            borderRadius: "8px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            height: "40px",
            marginLeft: "30px",
            marginRight: "30px",
          }}
        >
          {buttonText}
        </Button>
      )}
    </div>
  );
};

export default SearchHeader;

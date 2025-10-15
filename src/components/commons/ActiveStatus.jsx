import React from "react";

const ActiveStatus = ({ isActive, size = "small" }) => {
  const styles = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: size === "small" ? "4px 8px" : "6px 10px",
    borderRadius: 999,
    color: "#fff",
    fontSize: size === "small" ? 12 : 14,
    fontWeight: 600,
  };

  return (
    <span
      style={{
        ...styles,
        background: isActive ? "#3BB66E" : "#f44336",
      }}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
};

export default ActiveStatus;

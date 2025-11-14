import React from "react";
import { Skeleton } from "antd";

const CommonCardSkeleton = () => {
  return (
    <div
      style={{
        padding: 12,
        backgroundColor: "white",
        borderRadius: 10,
        marginBottom: 20,
      }}
      className="shadow-lg"
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 15,
        }}
      >
        <Skeleton.Input active size="small" style={{ width: 150 }} />

        <Skeleton.Input active size="small" style={{ width: 25 }} />
      </div>

      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <Skeleton.Input active size="small" style={{ width: "30%" }} />
            <Skeleton.Input active size="small" style={{ width: "40%" }} />
          </div>

          {i < 4 && <hr style={{ margin: "6px 0", borderColor: "#e6e6e6" }} />}
        </div>
      ))}

      {/* Buttons skeleton */}
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <Skeleton.Button
          active
          size="small"
          shape="round"
          style={{ width: 80 }}
        />
        <Skeleton.Button
          active
          size="small"
          shape="round"
          style={{ width: 80 }}
        />
      </div>
    </div>
  );
};

export default CommonCardSkeleton;

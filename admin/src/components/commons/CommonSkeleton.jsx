import React from "react";
import { Skeleton } from "antd";
import "../modern/modern.css";

const CommonCardSkeleton = () => (
  <div className="mp-mcard" style={{ cursor: "default" }}>
    <Skeleton active title={{ width: "55%" }} paragraph={{ rows: 3 }} />
  </div>
);

export default CommonCardSkeleton;

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  List,
  Card,
  Button,
  Spin,
  Empty,
  message,
  Avatar,
  Rate,
  Popconfirm,
} from "antd";
import CarsService from "./CarsService";

const Review = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await CarsService.getReviewByCarId(id);
      setReviews(res || []);
    } catch (e) {
      message.error(
        e?.response?.data?.message || e?.message || "Failed to load reviews"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchReviews();
  }, [id]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Car Reviews</h1>
        <Button onClick={() => navigate(-1)}>Back</Button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin />
        </div>
      ) : reviews.length === 0 ? (
        <Empty description="No reviews" />
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 3, xl: 3, xxl: 4 }}
          dataSource={reviews}
          renderItem={(item) => {
            const reviewer = item.reviewer || item.user || {};
            const fullName =
              `${reviewer.firstName || ""} ${reviewer.lastName || ""}`.trim() ||
              reviewer.name ||
              "Guest";
            const email = reviewer.email || "";
            const avatarText =
              reviewer.firstName || reviewer.lastName
                ? `${(reviewer.firstName || "")[0] || ""}${
                    (reviewer.lastName || "")[0] || ""
                  }`.toUpperCase()
                : "G";

            return (
              <List.Item>
                <Card style={{ minHeight: 120 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      alignItems: "flex-start",
                    }}
                  >
                    <Avatar
                      size={40}
                      style={{ fontSize: 14, flex: "0 0 auto" }}
                    >
                      {avatarText}
                    </Avatar>

                    <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ minWidth: 0, overflow: "hidden" }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 13,
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                            }}
                          >
                            {fullName}
                          </div>
                          <div
                            style={{
                              color: "#6b7280",
                              fontSize: 11,
                              marginTop: 2,
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                            }}
                          >
                            {email}
                          </div>
                          <div
                            style={{
                              color: "#9ca3af",
                              fontSize: 11,
                              marginTop: 4,
                            }}
                          >
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleString()
                              : ""}
                          </div>
                        </div>

                        <div
                          style={{
                            textAlign: "right",
                            flex: "0 0 auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          <Rate
                            disabled
                            defaultValue={item.rating || 0}
                            style={{ fontSize: 12 }}
                          />
                          <Popconfirm
                            title="Delete this review?"
                            okText="Delete"
                            okButtonProps={{ danger: true }}
                            onConfirm={async () => {
                              try {
                                await CarsService.deleteReview(
                                  item.id || item._id
                                );
                                message.success("Review deleted");
                                fetchReviews();
                              } catch (e) {
                                message.error(
                                  e?.response?.data?.message ||
                                    e?.message ||
                                    "Delete failed"
                                );
                              }
                            }}
                          >
                            <Button type="text" danger size="small">
                              Delete
                            </Button>
                          </Popconfirm>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 8,
                          color: "#374151",
                          fontSize: 12,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {item.comment || item.review || item.content || "-"}
                      </div>
                    </div>
                  </div>
                </Card>
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );
};

export default Review;

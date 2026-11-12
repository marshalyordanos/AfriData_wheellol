import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Divider,
  Spin,
  message,
  Tag,
  Button,
  Card,
  Row,
  Col,
  Descriptions,
  Avatar,
  Image,
  Popconfirm,
  Modal,
  Form,
  InputNumber,
  Input,
  Upload,
} from "antd";
import styled from "styled-components";
import { CheckOutlined, CarOutlined } from "@ant-design/icons";
import {
  Page,
  PageHeader,
  Btn,
  Card as UICard,
  StatusPill,
  KeyValueList,
  EmptyState,
  Avatar as UIAvatar,
  fullName,
  prettyStatus,
} from "../../components/modern/ModernUI";
import { dayRange } from "../../utils/dateFormat";
import BookingService from "./BookingService";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../redux/auth/authSlice";
import {
  formatCurrency,
  formatReadableDate,
} from "../../utils/date_currency_formatter";

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    cancel: false,
    confirm: false,
    reject: false,
    complete: false,
    pickup: false,
    dropoff: false,
    dropoffApprove: false,
    dropoffDispute: false,
    dispute: false,
  });
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [pickupForm] = Form.useForm();
  const [pickupInspection, setPickupInspection] = useState(null);
  const [dropoffModalOpen, setDropoffModalOpen] = useState(false);
  const [dropoffForm] = Form.useForm();
  const [dropoffInspection, setDropoffInspection] = useState(null);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeForm] = Form.useForm();
  const [viewDisputeOpen, setViewDisputeOpen] = useState(false);
  const authUser = useSelector(selectCurrentUser);

  const loadBooking = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await BookingService.getBookingById(id);
      setBooking(data || null);
      // Find pickup and dropoff inspections if exist
      if (data?.inspections && Array.isArray(data.inspections)) {
        const pickup = data.inspections.find((i) => i.type === "PICKUP");
        const dropoff = data.inspections.find((i) => i.type === "DROPOFF");
        setPickupInspection(pickup || null);
        setDropoffInspection(dropoff || null);
      } else {
        setPickupInspection(null);
        setDropoffInspection(null);
      }
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message || "Failed to load booking");
      setBooking(null);
      setPickupInspection(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooking();
  }, [id]);

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleAction = async (type) => {
    if (!id) return;
    try {
      setActionLoading((s) => ({ ...s, [type]: true }));
      let res;
      if (type === "cancel") res = await BookingService.cancelBooking(id);
      if (type === "confirm") res = await BookingService.confirmBooking(id);
      if (type === "reject") res = await BookingService.rejectBooking(id);
      if (type === "complete") res = await BookingService.completeBooking(id);
      message.success(res?.message || "Action completed");
      await loadBooking();
    } catch (err) {
      console.error(err);
      message.error(
        err?.response?.data?.message || err?.message || "Action failed"
      );
    } finally {
      setActionLoading((s) => ({ ...s, [type]: false }));
    }
  };

  if (loading && !booking) {
    return (
      <Page>
        <div className="flex justify-center p-16">
          <Spin size="large" />
        </div>
      </Page>
    );
  }

  if (!loading && !booking) {
    return (
      <Page>
        <EmptyState title="Booking not found" text="It may have been removed." />
      </Page>
    );
  }

  const car = booking?.car || {};
  const guest = booking?.guest || {};
  const host = booking?.host || {};
  const payment = booking?.payment || {};

  const formatLocation = (loc) => {
    if (!loc) return "-";
    return String(loc).split("+*+").slice(-1)[0] || loc;
  };

  const paymentTag = (status) => {
    if (!status) return <Tag color="default">N/A</Tag>;
    const s = status.toString().toLowerCase();
    if (s.includes("paid") || s.includes("completed") || s === "success")
      return <Tag color="green">{status}</Tag>;
    if (s.includes("pending") || s.includes("await"))
      return <Tag color="orange">{status}</Tag>;
    if (s.includes("failed") || s.includes("declined"))
      return <Tag color="red">{status}</Tag>;
    return <Tag color="blue">{status}</Tag>;
  };

  const bookingTag = (status) => {
    if (!status) return <Tag color="default">N/A</Tag>;
    const s = status.toString().toLowerCase();
    if (s.includes("completed")) return <Tag color="green">{status}</Tag>;
    if (s.includes("cancel")) return <Tag color="red">{status}</Tag>;
    if (s.includes("pending") || s.includes("new") || s.includes("await"))
      return <Tag color="orange">{status}</Tag>;
    if (s.includes("confirmed")) return <Tag color="blue">{status}</Tag>;
    return <Tag color="purple">{status}</Tag>;
  };

  const isDropoffApproved =
    dropoffInspection && dropoffInspection.approved === true;

  // current user id for permission checks
  const currentUserId = authUser?.user?.id || authUser?.id || null;
  const dropoffSubmitterId = dropoffInspection?.submittedById || null;
  const canActOnDropoff =
    !!dropoffInspection && String(dropoffSubmitterId) !== String(currentUserId);

  const headerActions = (
    <>
          {isDropoffApproved ? (
            <Tag color="green" style={{ fontSize: 16, padding: "4px 12px" }}>
              Completed
            </Tag>
          ) : (
            <>
              {booking.status === "PENDING" && (
                <>
                  <Popconfirm
                    title="Confirm this booking?"
                    onConfirm={() => handleAction("confirm")}
                    okButtonProps={{ loading: actionLoading.confirm }}
                  >
                    <Button type="primary" loading={actionLoading.confirm}>
                      Confirm
                    </Button>
                  </Popconfirm>
                  <Popconfirm
                    title="Reject this booking?"
                    onConfirm={() => handleAction("reject")}
                    okButtonProps={{ loading: actionLoading.reject }}
                  >
                    <Button danger loading={actionLoading.reject}>
                      Reject
                    </Button>
                  </Popconfirm>
                </>
              )}
              {booking.status === "REJECTED" && (
                <Tag color="red" style={{ fontSize: 16, padding: "4px 12px" }}>
                  Rejected
                </Tag>
              )}
              {(booking.status === "CONFIRMED" ||
                booking.status === "COMPLETED") && (
                <>
                  <Popconfirm
                    title="Are you sure to cancel this booking?"
                    onConfirm={() => handleAction("cancel")}
                    okButtonProps={{ loading: actionLoading.cancel }}
                  >
                    <Button danger loading={actionLoading.cancel}>
                      Cancel
                    </Button>
                  </Popconfirm>
                  {booking.status === "CONFIRMED" &&
                    !(
                      pickupInspection && pickupInspection.approved === true
                    ) && (
                      <Button
                        type="default"
                        onClick={() => {
                          if (pickupInspection) {
                            pickupForm.setFieldsValue({
                              fuelLevel: pickupInspection.fuelLevel,
                              mileage: pickupInspection.mileage,
                            });
                          } else {
                            pickupForm.setFieldsValue({
                              fuelLevel: 0,
                              mileage: 0,
                            });
                          }
                          setPickupModalOpen(true);
                        }}
                      >
                        {pickupInspection ? "Update Pickup" : "Create Pickup"}
                      </Button>
                    )}
                  {/* Show Dropoff create button if pickup exists and is approved */}
                  {pickupInspection &&
                    pickupInspection.approved === true &&
                    !dropoffInspection && (
                      <Button
                        type="default"
                        onClick={() => {
                          dropoffForm.setFieldsValue({
                            fuelLevel: 0,
                            mileage: 0,
                          });
                          setDropoffModalOpen(true);
                        }}
                      >
                        Create Dropoff
                      </Button>
                    )}
                  {/* If dropoff inspection exists, show a button to view details */}
                  {dropoffInspection &&
                    // If there is a dispute attached to booking or dropoff, show 'View Dispute'
                    (booking?.dispute || dropoffInspection?.dispute ? (
                      <Button
                        loading={actionLoading.dispute}
                        onClick={async () => {
                          // find dispute id from booking or dropoff
                          const disp =
                            booking?.dispute || dropoffInspection?.dispute;
                          const disputeId = disp?.id || disp?._id || disp;
                          if (!disputeId) {
                            message.error("Dispute id not found");
                            return;
                          }
                          try {
                            setActionLoading((s) => ({ ...s, dispute: true }));
                            const res = await BookingService.getDisputeById(
                              disputeId
                            );
                            const disputeData = res?.data || res;
                            // show view-dispute modal with dispute details
                            setViewDisputeOpen(true);
                            // store fetched data so the modal can show more fields
                            setBooking((b) => ({
                              ...b,
                              _fetchedDispute: disputeData,
                            }));
                          } catch (err) {
                            message.error(
                              err?.response?.data?.message ||
                                "Failed to fetch dispute"
                            );
                          } finally {
                            setActionLoading((s) => ({ ...s, dispute: false }));
                          }
                        }}
                      >
                        View Dispute
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          dropoffForm.setFieldsValue({
                            fuelLevel: dropoffInspection.fuelLevel,
                            mileage: dropoffInspection.mileage,
                          });
                          setDropoffModalOpen(true);
                        }}
                      >
                        View Dropoff
                      </Button>
                    ))}
                </>
              )}
            </>
          )}
          {/* Pickup Modal*/}
          <Modal
            title={
              pickupInspection
                ? "Update Pickup Inspection"
                : "Create Pickup Inspection"
            }
            open={pickupModalOpen}
            onCancel={() => {
              setPickupModalOpen(false);
              pickupForm.resetFields();
            }}
            onOk={() => pickupForm.submit()}
            okText={pickupInspection ? "Update" : "Submit"}
            confirmLoading={actionLoading.pickup}
          >
            <Form
              form={pickupForm}
              layout="vertical"
              initialValues={{
                fuelLevel: pickupInspection?.fuelLevel || 0,
                mileage: pickupInspection?.mileage || 0,
              }}
              onFinish={async (values) => {
                setActionLoading((s) => ({ ...s, pickup: true }));
                try {
                  if (pickupInspection) {
                    const inspectionId = pickupInspection.id;
                    await BookingService.updatePickupInspection(inspectionId, {
                      type: "PICKUP",
                      fuelLevel: Number(values.fuelLevel),
                      mileage: Number(values.mileage),
                    });
                    message.success("Pickup inspection updated");
                  } else {
                    await BookingService.pickupInspection({
                      bookingId: booking.id,
                      type: "PICKUP",
                      fuelLevel: Number(values.fuelLevel),
                      mileage: Number(values.mileage),
                    });
                    message.success("Pickup inspection created");
                  }
                  setPickupModalOpen(false);
                  pickupForm.resetFields();
                  await loadBooking();
                } catch (err) {
                  message.error(
                    err?.response?.data?.message ||
                      err?.message ||
                      "Failed to save inspection"
                  );
                } finally {
                  setActionLoading((s) => ({ ...s, pickup: false }));
                }
              }}
            >
              <Form.Item
                label="Fuel Level"
                name="fuelLevel"
                rules={[{ type: "number", min: 0 }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="Enter fuel level"
                />
              </Form.Item>
              <Form.Item
                label="Mileage"
                name="mileage"
                rules={[{ type: "number", min: 0 }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="Enter mileage"
                />
              </Form.Item>
            </Form>
          </Modal>
          {/* Dropoff Modal*/}
          <Modal
            title={
              dropoffInspection
                ? "Dropoff Inspection"
                : "Create Dropoff Inspection"
            }
            open={dropoffModalOpen}
            onCancel={() => {
              setDropoffModalOpen(false);
              dropoffForm.resetFields();
            }}
            footer={
              dropoffInspection && canActOnDropoff
                ? (() => {
                    const showDisputeBtn = !(
                      booking?.dispute || dropoffInspection?.dispute
                    );
                    const items = [
                      <Button
                        key="approve"
                        type="primary"
                        loading={actionLoading.dropoffApprove}
                        onClick={async () => {
                          const inspectionId = dropoffInspection.id;
                          try {
                            setActionLoading((s) => ({
                              ...s,
                              dropoffApprove: true,
                            }));
                            await BookingService.approveDopoffInspection(
                              inspectionId
                            );
                            message.success("Dropoff approved");
                            setDropoffModalOpen(false);
                            await loadBooking();
                          } catch (err) {
                            message.error(
                              err?.response?.data?.message ||
                                "Failed to approve"
                            );
                          } finally {
                            setActionLoading((s) => ({
                              ...s,
                              dropoffApprove: false,
                            }));
                          }
                        }}
                      >
                        Approve
                      </Button>,
                    ];
                    if (showDisputeBtn) {
                      items.push(
                        <Button
                          key="dispute"
                          danger
                          loading={actionLoading.dropoffDispute}
                          onClick={() => {
                            // open dispute modal to collect reason/photos
                            disputeForm.resetFields();
                            setDisputeModalOpen(true);
                          }}
                        >
                          Dispute
                        </Button>
                      );
                    }
                    return items;
                  })()
                : undefined
            }
            onOk={() => dropoffForm.submit()}
            okText={dropoffInspection ? "Update" : "Submit"}
            confirmLoading={actionLoading.dropoff}
          >
            <Form
              form={dropoffForm}
              layout="vertical"
              initialValues={{
                fuelLevel: dropoffInspection?.fuelLevel || 0,
                mileage: dropoffInspection?.mileage || 0,
              }}
              onFinish={async (values) => {
                setActionLoading((s) => ({ ...s, dropoff: true }));
                try {
                  if (dropoffInspection) {
                    const inspectionId =
                      dropoffInspection.id || dropoffInspection._id;
                    await BookingService.updatedDopoffInspection(inspectionId, {
                      type: "DROPOFF",
                      fuelLevel: Number(values.fuelLevel),
                      mileage: Number(values.mileage),
                    });
                    message.success("Dropoff inspection updated");
                  } else {
                    await BookingService.dropoffInspection({
                      bookingId: booking.id || booking._id,
                      type: "DROPOFF",
                      fuelLevel: Number(values.fuelLevel),
                      mileage: Number(values.mileage),
                    });
                    message.success("Dropoff inspection created");
                  }
                  setDropoffModalOpen(false);
                  dropoffForm.resetFields();
                  await loadBooking();
                } catch (err) {
                  message.error(
                    err?.response?.data?.message ||
                      err?.message ||
                      "Failed to save inspection"
                  );
                } finally {
                  setActionLoading((s) => ({ ...s, dropoff: false }));
                }
              }}
            >
              <Form.Item
                label="Fuel Level"
                name="fuelLevel"
                rules={[{ type: "number", min: 0 }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="Enter fuel level"
                />
              </Form.Item>
              <Form.Item
                label="Mileage"
                name="mileage"
                rules={[{ type: "number", min: 0 }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="Enter mileage"
                />
              </Form.Item>
            </Form>
          </Modal>
          {/* Dispute Modal */}
          <Modal
            title="Create Dispute"
            open={disputeModalOpen}
            onCancel={() => setDisputeModalOpen(false)}
            onOk={() => disputeForm.submit()}
            okText="Send"
            confirmLoading={actionLoading.dispute}
          >
            <Form
              form={disputeForm}
              layout="vertical"
              onFinish={async (values) => {
                try {
                  setActionLoading((s) => ({ ...s, dispute: true }));
                  const photos = [];
                  const files = values.photos || [];
                  for (const f of files) {
                    const fileObj = f.originFileObj || f;
                    const b64 = await fileToBase64(fileObj);
                    photos.push(b64);
                  }
                  const payload = {
                    bookingId: booking.id || "",
                    paymentId: booking.payment?.id || "",
                    userId: authUser?.user?.id || "",
                    carId: booking.car?.id || "",
                    reason: values.reason || "",
                    photos,
                  };
                  await BookingService.createDispute(payload);
                  message.success("Dispute submitted");
                  setDisputeModalOpen(false);
                  await loadBooking();
                } catch (err) {
                  message.error(
                    err?.response?.data?.message || "Failed to create dispute"
                  );
                } finally {
                  setActionLoading((s) => ({ ...s, dispute: false }));
                }
              }}
            >
              <Form.Item
                name="reason"
                label="Reason"
                rules={[{ message: "Please enter a reason" }]}
              >
                <Input.TextArea rows={4} />
              </Form.Item>
              <Form.Item
                name="photos"
                label="Photos"
                valuePropName="fileList"
                getValueFromEvent={(e) =>
                  Array.isArray(e) ? e : e && e.fileList
                }
              >
                <Upload
                  name="photos"
                  listType="picture"
                  accept="image/*"
                  beforeUpload={() => false}
                  multiple
                >
                  <Button>Upload photos</Button>
                </Upload>
              </Form.Item>
            </Form>
          </Modal>

          {/* View Dispute Modal (shows fetched dispute details) */}
          <Modal
            title="Dispute Details"
            open={viewDisputeOpen}
            onCancel={() => {
              setViewDisputeOpen(false);
              // clear temp dispute data
              setBooking((b) => {
                if (!b) return b;
                const copy = { ...b };
                delete copy._fetchedDispute;
                return copy;
              });
            }}
            footer={null}
          >
            {booking?._fetchedDispute ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div>
                  <strong>Reason</strong>
                  <div style={{ marginTop: 6 }}>
                    {booking._fetchedDispute.reason}
                  </div>
                </div>
                <div>
                  <strong>Status</strong>
                  <div style={{ marginTop: 6 }}>
                    {booking._fetchedDispute.status}
                  </div>
                </div>
                <div>
                  <strong>Created At</strong>
                  <div style={{ marginTop: 6 }}>
                    {new Date(
                      booking._fetchedDispute.createdAt
                    ).toLocaleString()}
                  </div>
                </div>
                <Divider />
                <div>
                  <strong>User</strong>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      marginTop: 8,
                    }}
                  >
                    <Avatar src={booking._fetchedDispute.user?.profilePhoto} />
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        {booking._fetchedDispute.user?.firstName}{" "}
                        {booking._fetchedDispute.user?.lastName}
                      </div>
                      <div style={{ color: "#666" }}>
                        {booking._fetchedDispute.user?.email}
                      </div>
                    </div>
                  </div>
                </div>
                <Divider />
                <div>
                  <strong>Booking</strong>
                  <div style={{ marginTop: 6 }}>
                    Booking ID:{" "}
                    {booking._fetchedDispute.booking?.id ||
                      booking._fetchedDispute.bookingId}
                  </div>
                  <div>
                    Payment Status: {booking._fetchedDispute.payment?.status}
                  </div>
                  <div>Amount: {booking._fetchedDispute.payment?.amount}</div>
                </div>
              </div>
            ) : (
              <div>No dispute data</div>
            )}
          </Modal>
          {!isDropoffApproved && booking.status === "COMPLETED" && (
            <Tag color="green" style={{ fontSize: 16, padding: "4px 12px" }}>
              Completed
            </Tag>
          )}
    </>
  );

  const carTitle = `${car?.make?.name || ""} ${car?.model?.name || ""}`.trim() || "Car";
  const days = dayRange(booking.startDate, booking.endDate);
  const flow = ["PENDING", "CONFIRMED", "PICKED_UP", "COMPLETED"];
  const stage = isDropoffApproved || booking.status === "COMPLETED"
    ? 3
    : pickupInspection?.approved
    ? 2
    : booking.status === "CONFIRMED"
    ? 1
    : 0;
  const stopped = /cancel|reject/i.test(booking.status || "");
  const stepLabels = ["Requested", "Confirmed", "Picked up", "Returned"];
  const photo = car?.photos?.[0];

  const InspectionCard = ({ label, insp }) => (
    <div className="mp-subcard" style={{ flex: "1 1 220px" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <span style={{ fontWeight: 700 }}>{label}</span>
        {insp ? (
          <StatusPill tone={insp.approved ? "green" : "amber"}>{insp.approved ? "Approved" : "Awaiting approval"}</StatusPill>
        ) : (
          <StatusPill tone="gray">Not done</StatusPill>
        )}
      </div>
      <KeyValueList
        rows={[
          { label: "Fuel level", value: insp ? insp.fuelLevel ?? "—" : "—" },
          { label: "Mileage", value: insp ? (insp.mileage ?? "—").toLocaleString?.() ?? insp.mileage : "—" },
        ]}
      />
    </div>
  );

  const PersonBlock = ({ title, person, tone }) => (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <span className="mp-info-item"><dt style={{ margin: 0 }}>{title}</dt></span>
        <StatusPill tone={tone}>{title}</StatusPill>
      </div>
      <div className="mp-cell" style={{ marginBottom: 12 }}>
        <UIAvatar name={fullName(person)} src={person?.avatar || person?.profilePhoto} size={44} />
        <div className="min-w-0">
          <div className="mp-cell-main" style={{ fontSize: 15 }}>{fullName(person) || "—"}</div>
          <div className="mp-cell-sub">{person?.email || "—"}</div>
        </div>
      </div>
      <KeyValueList
        rows={[
          { label: "Phone", value: person?.phone ? <a href={`tel:${person.phone}`}>{person.phone}</a> : "—" },
        ]}
      />
    </div>
  );

  return (
    <Page>
      <PageHeader
        back="/dash/bookings"
        eyebrow="Booking"
        title={
          <span className="flex items-center gap-3 flex-wrap">
            {carTitle}
            <StatusPill status={isDropoffApproved ? "COMPLETED" : booking.status} />
            {booking.dispute && <StatusPill tone="red">Dispute</StatusPill>}
          </span>
        }
        subtitle={`#${String(booking.id || booking._id).slice(0, 8)} · created ${booking.createdAt ? formatReadableDate(booking.createdAt) : "—"}`}
        actions={<div className="flex items-center gap-2 flex-wrap">{headerActions}</div>}
      />

      {/* Lifecycle */}
      <div className="mp-card" style={{ marginBottom: 20, overflowX: "auto" }}>
        <ol className="mp-steps">
          {flow.map((k, i) => {
            const st = stopped ? "todo" : i < stage ? "done" : i === stage ? (stage === 3 ? "done" : "current") : "todo";
            return (
              <li key={k} className={`mp-step is-${st}`}>
                <span className="mp-step-dot">{st === "done" ? <CheckOutlined /> : i + 1}</span>
                <span className="mp-step-label">{stepLabels[i]}</span>
                {i < flow.length - 1 && <span className="mp-step-line" />}
              </li>
            );
          })}
          {stopped && (
            <li className="mp-step">
              <StatusPill status={booking.status} />
            </li>
          )}
        </ol>
      </div>

      <div className="mp-detail">
        <div className="mp-detail-main">
          {/* Car hero */}
          <div className="mp-hero-card">
            {photo ? (
              <Image src={photo} width={132} height={92} style={{ objectFit: "cover", borderRadius: 14 }} />
            ) : (
              <span className="mp-hero-img"><CarOutlined /></span>
            )}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="mp-eyebrow" style={{ marginBottom: 4 }}>Vehicle</div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>{carTitle}</div>
              <div className="mp-cell-sub">
                {[car?.year || car?.manufacture_year, car?.licensePlate, car?.color].filter(Boolean).join(" · ") || "—"}
              </div>
              <div className="flex gap-2 flex-wrap" style={{ marginTop: 10 }}>
                <StatusPill tone="gray">{booking.withDriver ? "With driver" : "Self-drive"}</StatusPill>
                {days && <StatusPill tone="blue">{days} day{days > 1 ? "s" : ""}</StatusPill>}
              </div>
            </div>
            {car?.id && (
              <Btn onClick={() => navigate(`/dash/cars/details/${car.id}`)}>View car</Btn>
            )}
          </div>

          <UICard title="Trip">
            <div className="mp-timeline" style={{ marginBottom: 6 }}>
              <div className="mp-timeline-rail">
                <span className="a" />
                <span className="l" />
                <span className="b" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 18, fontSize: 14 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{booking.startDate ? formatReadableDate(booking.startDate) : "—"}</div>
                  <div className="mp-cell-sub">Pickup · {formatLocation(booking.pickupLocation)}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{booking.endDate ? formatReadableDate(booking.endDate) : "—"}</div>
                  <div className="mp-cell-sub">Return · {formatLocation(booking.dropoffLocation)}</div>
                </div>
              </div>
            </div>
          </UICard>

          <UICard title="Inspections" subtitle="Fuel and mileage recorded at pickup and return">
            <div className="flex gap-3 flex-wrap">
              <InspectionCard label="Pickup" insp={pickupInspection} />
              <InspectionCard label="Drop-off" insp={dropoffInspection} />
            </div>
          </UICard>

          <UICard title="Notes">
            <div style={{ color: "var(--c-text-2)", fontSize: 14, lineHeight: 1.6 }}>
              {booking.notes || booking.note || <span className="mp-muted">No additional notes.</span>}
            </div>
          </UICard>
        </div>

        <aside className="mp-detail-side">
          <UICard title="Payment" extra={<StatusPill status={payment.status} />}>
            <KeyValueList
              rows={[
                booking.rentalPricePerDay || car?.rentalPricePerDay
                  ? { label: "Daily rate", value: formatCurrency(booking.rentalPricePerDay || car.rentalPricePerDay) }
                  : null,
                days ? { label: "Duration", value: `${days} day${days > 1 ? "s" : ""}` } : null,
                payment.method ? { label: "Method", value: prettyStatus(payment.method) } : null,
                payment.platformFee !== undefined && payment.platformFee !== null
                  ? { label: "Platform fee", value: formatCurrency(payment.platformFee) }
                  : null,
                payment.hostEarnings !== undefined && payment.hostEarnings !== null
                  ? { label: "Host earnings", value: formatCurrency(payment.hostEarnings) }
                  : null,
                { label: "Total", value: booking.totalPrice ? formatCurrency(booking.totalPrice) : "—", strong: true },
              ]}
            />
          </UICard>

          <UICard>
            <PersonBlock title="Guest" person={guest} tone="violet" />
            <div style={{ height: 1, background: "#f1f3f6", margin: "18px 0" }} />
            <PersonBlock title="Host" person={host} tone="orange" />
          </UICard>
        </aside>
      </div>
    </Page>
  );
};

export default BookingDetail;

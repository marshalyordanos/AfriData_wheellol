import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Descriptions,
  Avatar,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Spin,
  message,
  Upload,
} from "antd";
import { useSelector } from "react-redux";
import ProfileService from "./ProfileService";
import { formatReadableDate } from "../../utils/date_currency_formatter";
import { selectCurrentUser } from "../../redux/auth/authSlice";

const ProfileDetails = () => {
  const { id } = useParams();
  const authUser = useSelector(selectCurrentUser);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form] = Form.useForm();

  // Load profile
  useEffect(() => {
    const userId = authUser?.user?.id || id;
    const load = async () => {
      try {
        setLoading(true);
        const data = await ProfileService.getUserProfileById(userId);
        setProfile(data || null);
      } catch (err) {
        console.error(err);
        message.error(err?.response?.data?.message || "Failed to load profile");
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authUser, id]);

  // Prefill edit form
  useEffect(() => {
    if (profile) {
      form.setFieldsValue({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        profilePhotoFile: profile.profilePhoto
          ? [
              {
                uid: "-1",
                name: "profile.jpg",
                status: "done",
                url: profile.profilePhoto,
              },
            ]
          : [],
      });
    }
  }, [profile, form]);

  const onEdit = () => setEditOpen(true);
  const onCancel = () => setEditOpen(false);

  const onFinish = async (values) => {
    const uid = authUser?.user?.id || profile?.id;
    if (!uid) {
      message.error("No profile ID available to update");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("firstName", values.firstName || "");
      formData.append("lastName", values.lastName || "");
      formData.append("email", values.email || "");
      formData.append("phone", values.phone || "");

      const fileList = values.profilePhotoFile || [];
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("profilePhotoFile", fileList[0].originFileObj);
      }

      await ProfileService.updateProfile(uid, formData);

      message.success("Profile updated successfully");
      setEditOpen(false);

      // Reload profile after update
      const updated = await ProfileService.getUserProfileById(uid);
      setProfile(updated || null);
    } catch (err) {
      console.error("Update failed:", err);
      message.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!profile) {
    return <div style={{ margin: 40, color: "red" }}>Profile not found.</div>;
  }

  const roleName = profile.role?.name || profile.role || "-";

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0 }}>Profile Details</h2>
        <Button
          type="primary"
          style={{ background: "var(--color-primary)" }}
          onClick={onEdit}
        >
          Update Profile
        </Button>
      </div>

      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Card bordered>
            <div style={{ textAlign: "center" }}>
              <Avatar
                size={96}
                src={profile.profilePhoto || undefined}
                style={{ marginBottom: 12 }}
              />
              <div style={{ fontWeight: 700, fontSize: 18 }}>
                {profile.firstName} {profile.lastName}
              </div>
              <div style={{ color: "#666", marginTop: 6 }}>{profile.email}</div>
              <div style={{ marginTop: 8 }}>
                {profile.isVerified ? (
                  <Tag color="green">Verified</Tag>
                ) : (
                  <Tag color="orange">Unverified</Tag>
                )}
                {profile.isActive ? (
                  <Tag color="green">Active</Tag>
                ) : (
                  <Tag color="red">Inactive</Tag>
                )}
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card bordered>
            <Descriptions
              column={1}
              size="small"
              labelStyle={{ fontWeight: 600 }}
            >
              <Descriptions.Item label="Full Name">
                {(profile.firstName || "") +
                  (profile.lastName ? " " + profile.lastName : "")}
              </Descriptions.Item>
              <Descriptions.Item label="Role">{roleName}</Descriptions.Item>
              <Descriptions.Item label="Phone">
                {profile.phone || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Is Staff">
                {profile.isStaff ? "Yes" : "No"}
              </Descriptions.Item>
              <Descriptions.Item label="Is Super Admin">
                {profile.isSuperAdmin ? "Yes" : "No"}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {profile.createdAt
                  ? formatReadableDate(profile.createdAt)
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Updated At">
                {profile.updatedAt
                  ? formatReadableDate(profile.updatedAt)
                  : "-"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Modal
        title="Edit Profile"
        open={editOpen}
        onCancel={onCancel}
        onOk={() => form.submit()}
        okText="Save"
        confirmLoading={loading}
        okButtonProps={{
          style: {
            backgroundColor: "var(--color-primary)",
            borderColor: "var(--color-primary)",
            color: "white",
          },
        }}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="firstName"
            label="First name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label="Last name">
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: "email", required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>

          <Form.Item
            name="profilePhotoFile"
            label="Profile Photo"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
          >
            <Upload
              name="profilePhotoFile"
              listType="picture"
              maxCount={1}
              beforeUpload={() => false}
            >
              <Button>Upload Profile Photo</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfileDetails;

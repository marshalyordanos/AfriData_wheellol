import { Button, Modal } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import React from "react";

const CommonDeleteModal = ({ children, setIsModalOpen, handleDelete, isModalOpen, loading }) => (
  <Modal
    open={isModalOpen}
    onOk={handleDelete}
    width={440}
    onCancel={() => setIsModalOpen(false)}
    className="mp-modal"
    title={null}
    footer={[
      <Button key="back" onClick={() => setIsModalOpen(false)}>
        Cancel
      </Button>,
      <Button danger key="submit" type="primary" loading={loading} onClick={handleDelete}>
        Delete
      </Button>,
    ]}
  >
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start", paddingTop: 4 }}>
      <span
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "#fef3f2",
          color: "#b42318",
          display: "grid",
          placeItems: "center",
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        <DeleteOutlined />
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Delete this item?</div>
        <div style={{ color: "var(--c-text-2)", fontSize: 14 }}>
          {children && typeof children !== "string" && children?.type === "h1"
            ? "This action can't be undone."
            : children || "This action can't be undone."}
        </div>
      </div>
    </div>
  </Modal>
);

export default CommonDeleteModal;

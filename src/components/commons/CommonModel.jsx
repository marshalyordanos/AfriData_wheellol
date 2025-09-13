// src/components/commons/CommonModal.jsx
import React from "react";
import { Modal } from "antd";

const CommonModal = ({
  children,
  isModalOpen,
  setIsModalOpen,
  width,
  title,
}) => {
  return (
    <Modal
      width={width}
      footer={false}
      title={title}
      open={isModalOpen}
      onCancel={() => setIsModalOpen(false)}
    >
      {children}
    </Modal>
  );
};

export default CommonModal;

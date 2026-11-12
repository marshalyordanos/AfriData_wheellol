// src/components/commons/CommonModal.jsx
import React from "react";
import { Modal } from "antd";
import "../modern/modern.css";

const CommonModal = ({ children, isModalOpen, setIsModalOpen, width, title }) => (
  <Modal
    width={width}
    footer={false}
    title={title}
    open={isModalOpen}
    onCancel={() => setIsModalOpen(false)}
    className="mp-modal"
    destroyOnClose
  >
    <div className="mp-modal-body">{children}</div>
  </Modal>
);

export default CommonModal;

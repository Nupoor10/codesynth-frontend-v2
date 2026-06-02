import React from "react";
import { createPortal } from "react-dom";
import { ImCancelCircle } from "react-icons/im";

import "./Modal.css";

const Modal = ({ isOpen, closeModal, children }) => {
  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="overlay" onClick={closeModal} />

      <div className="modal">
        <button className="closeButton" onClick={closeModal}>
          <ImCancelCircle />
        </button>

        {children}
      </div>
    </>,

    document.body,
  );
};

export default Modal;

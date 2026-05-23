import React from "react";
import { ImCancelCircle } from "react-icons/im";
import "./Modal.css";

const Modal = ({ isOpen, closeModal, children }) => {
  return (
    <>
      <div className={isOpen ? "overlay" : "hidden"} onClick={closeModal}></div>
      <div className={isOpen  ? "modal" : "hidden"}>
        <button className="closeButton" onClick={closeModal}>
          <ImCancelCircle/>
        </button>
        {children}
      </div>
    </>
  );
};

export default Modal;

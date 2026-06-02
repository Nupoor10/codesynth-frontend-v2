import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, useDragControls } from "framer-motion";
import { ImCancelCircle } from "react-icons/im";
import "./DraggableResizableModal.css";

const DraggableResizableModal = ({ isOpen, closeModal, title, children }) => {
  const dragControls = useDragControls();
  const [size, setSize] = useState({ width: 900, height: 600 });
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSize({ width: 900, height: 600 });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="draggable-overlay" onClick={closeModal} />
      
      {isResizing && <div className="drag-pointer-shield" />}

      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={{ left: 0, top: 0, right: window.innerWidth - size.width, bottom: window.innerHeight - size.height }}
        initial={{ x: 120, y: 50 }}
        className="draggable-modal"
        style={{
          width: size.width,
          height: size.height,
          position: "fixed",
          zIndex: 1001,
        }}
      >
        <div className="draggable-modal-content">
          <div 
            className="draggable-modal-header"
            onPointerDown={(e) => {
              if (e.target.closest(".cancel-button")) return;
              dragControls.start(e);
            }}
          >
            <div className="draggable-modal-title">{title}</div>
            <button className="cancel-button" onClick={closeModal}>
              <ImCancelCircle />
            </button>
          </div>
          
          <div className="draggable-modal-body">{children}</div>
          
          <div
            className="rnd-resizable-handle"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsResizing(true);
              
              const startWidth = size.width;
              const startHeight = size.height;
              const startX = e.clientX;
              const startY = e.clientY;

              const doDrag = (moveEvent) => {
                const newWidth = Math.max(520, startWidth + (moveEvent.clientX - startX));
                const newHeight = Math.max(360, startHeight + (moveEvent.clientY - startY));
                setSize({ width: newWidth, height: newHeight });
              };

              const stopDrag = () => {
                setIsResizing(false);
                window.removeEventListener("mousemove", doDrag);
                window.removeEventListener("mouseup", stopDrag);
              };

              window.addEventListener("mousemove", doDrag);
              window.addEventListener("mouseup", stopDrag);
            }}
          />
        </div>
      </motion.div>
    </>,
    document.body
  );
};

export default DraggableResizableModal;

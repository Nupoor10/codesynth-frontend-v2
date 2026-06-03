import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, useDragControls } from "framer-motion";
import { ImCancelCircle } from "react-icons/im";
import "./DraggableResizableModal.css";

const DraggableResizableModal = ({ isOpen, closeModal, title, children }) => {
    const dragControls = useDragControls();

    const getMaxWidth = () => Math.max(520, window.innerWidth * 0.6);
    const getMaxHeight = () => Math.max(360, window.innerHeight * 0.8);

    const [size, setSize] = useState(() => ({
        width: getMaxWidth(),
        height: getMaxHeight()
    }));

    const [isResizing, setIsResizing] = useState(false);

    return createPortal(
        <>
            <div
                className="draggable-overlay"
                onClick={closeModal}
                style={{display: isOpen ? "block" : "none"}}
            />

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
                    zIndex: isOpen ? 1001 : -1,
                    visibility: isOpen ? "visible" : "hidden",
                    pointerEvents: isOpen ? "auto" : "none",
                    opacity: isOpen ? 1 : 0
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

                            const maxW = getMaxWidth();
                            const maxH = getMaxHeight();

                            const doDrag = (moveEvent) => {
                                const rawWidth = startWidth + (moveEvent.clientX - startX);
                                const rawHeight = startHeight + (moveEvent.clientY - startY);

                                const newWidth = Math.min(maxW, Math.max(520, rawWidth));
                                const newHeight = Math.min(maxH, Math.max(360, rawHeight));

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
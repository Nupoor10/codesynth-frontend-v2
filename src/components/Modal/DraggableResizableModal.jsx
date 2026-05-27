import React from 'react';
import { Rnd } from 'react-rnd';
import { ImCancelCircle } from 'react-icons/im';
import './DraggableResizableModal.css';

const DraggableResizableModal = ({ isOpen, closeModal, title, children }) => {
  return (
    <>
      <div className={`draggable-overlay ${isOpen ? 'open' : ''}`} onClick={closeModal} />
      <Rnd
        className="draggable-modal"
        bounds="window"
        default={{ x: 120, y: 100, width: 900, height: 620 }}
        minWidth={520}
        minHeight={360}
        dragHandleClassName="draggable-modal-header"
        cancel=".cancel-button"
        enableResizing={{
          bottomRight: true,
          bottom: false,
          right: false,
          top: false,
          topRight: false,
          bottomLeft: false,
          topLeft: false,
          left: false,
        }}
        style={{
          visibility: isOpen ? 'visible' : 'hidden',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          zIndex: 1001,
        }}
      >
        <div className="draggable-modal-content">
          <div className="draggable-modal-header">
            <div className="draggable-modal-title">{title}</div>
            <button className="cancel-button" onClick={closeModal}>
              <ImCancelCircle />
            </button>
          </div>
          <div className="draggable-modal-body">{children}</div>
        </div>
      </Rnd>
    </>
  );
};

export default DraggableResizableModal;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegSave, FaUsers, FaRegLightbulb } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthContext } from "../../hooks/useAuthContext";
import Modal from "../Modal/Modal";
import ParticipantList from "../ParticipantList/ParticipantList";
import "./PlaygroundNav.css";

const apiURL = import.meta.env.VITE_BACKEND_URL;

const PlaygroundNav = ({
  title,
  setTitle,
  roomId,
  owner,
  isAdmin,
  id,
  handleDisconnect,
  clients,
  onSaveWhiteboard,
  onOpenBrainstorm,
  socket,
}) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("settings");
  const navigate = useNavigate();

  const { user } = useAuthContext();

  const openModal = () => {
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const handleSelectChange = (event) => {
    setActiveMenu(event.target.value);
    if (event.target.value === "users") {
      openModal(event.target.value);
    } else if (event.target.value === "brainstorm") {
      onOpenBrainstorm?.();
    } else if (event.target.value === "copyid") {
      copyIDToClipboard();
    } else {
      handleLeave();
    }
  };

  const saveCode = async () => {
    try {
      if (user) {
        const config = {
          headers: {
            Authorization: user?.accessToken,
          },
        };
        const response = await axios.put(
          `${apiURL}/codes/update/${id}`,
          {
            title,
            isRoom: true,
          },
          config,
        );
        if (response && response.status === 200) {
          toast.success("Updated successfully!");

          const activeRoomId = roomId || id;
          if (socket && socket.connected && activeRoomId) {
            socket.emit("WORKSPACE_SAVED", {
              room: activeRoomId,
              username: user?.name,
            });
          }
        }
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.message);
    }
  };

  const copyIDToClipboard = () => {
    const accurateIdToShare = roomId || id;

    if (!accurateIdToShare) {
      toast.error("Room ID not generated yet. Please wait.");
      return;
    }

    navigator.clipboard.writeText(accurateIdToShare);
    toast.success("Copied Room ID to Clipboard!");
  };

  const handleLeave = () => {
    handleDisconnect();
    navigate("/collab");
  };

  return (
    <div className="playground__controls">
      <div className="home__icon__container">
        <div className="details__container">
          <input
            disabled={isAdmin}
            className="playground__title"
            value={
              window.innerWidth < 768 ? title?.substring(0, 10) + "..." : title
            }
            type="text"
            onChange={(event) => setTitle(event.target.value)}
          />
          <p>
            {window.innerWidth < 768 ? owner?.substring(0, 10) + "..." : owner}
          </p>
        </div>
      </div>
      <div className="playground__controls__container">
        <button
          onClick={saveCode}
          title="Save Workspace"
          className="colored__btn"
        >
          <FaRegSave />
        </button>
        <button
          className="colored__btn"
          onClick={() => onOpenBrainstorm?.()}
          title="Brainstorm"
        >
          <FaRegLightbulb />
        </button>
        <button
          className="colored__btn colored__btn__long"
          onClick={copyIDToClipboard}
          title="Copy Room ID"
        >
          Copy ID
        </button>
        <button
          className="colored__btn colored__btn__long"
          onClick={handleLeave}
          title="Leave Room"
        >
          Leave Room
        </button>
        <button
          className="colored__btn"
          onClick={() => openModal()}
          title="View Participants"
        >
          <FaUsers />
        </button>
      </div>
      <Modal
        isOpen={modalIsOpen}
        closeModal={closeModal}
        children={<ParticipantList roomId={roomId} clients={clients} />}
      />
    </div>
  );
};

export default PlaygroundNav;

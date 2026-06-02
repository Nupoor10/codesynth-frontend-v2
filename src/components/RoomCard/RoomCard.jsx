import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./RoomCard.css";
import { useAuthContext } from "../../hooks/useAuthContext";
import { FiCode, FiLogOut } from "react-icons/fi";
const apiURL = import.meta.env.VITE_BACKEND_URL;

const RoomCard = ({ roomId, number, isAdmin, code, participants, title }) => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const roomTitle =
    title ??
    (code && typeof code === "object" ? code.title : undefined) ??
    "Untitled Room";
  const codeId = code && typeof code === "object" ? code._id || code.id : code;

  const handleLeaveOrDelete = async () => {
    try {
      if (user && roomId) {
        const config = {
          headers: {
            Authorization: user?.accessToken,
          },
        };
        if (isAdmin) {
          const response = await axios.delete(
            `${apiURL}/rooms/delete/${roomId}`,
            config,
          );
          if (response && response.status === 200) {
            toast.success("Room Deleted Successfully");
          }
        } else {
          const response = await axios.put(
            `${apiURL}/rooms/remove`,
            { roomId },
            config,
          );
          if (response && response.status === 200) {
            toast.success("Room Left Successfully");
          }
        }
      }
    } catch (error) {
      console.log(error);
      toast.error("Error Occurred");
    }
  };

  return (
    <div className="single__room__container">
      <div className="room__details">
        <div className="room__badge">Collaborative Workspace</div>

        <h3>{roomTitle}</h3>

        <p>
          {participants} participant{participants !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="room__actions">
        <button
          className="room__action__btn primary"
          onClick={() => {
            const targetCodeId = codeId || id || roomId;
            if (!targetCodeId) {
              toast.error("Unable to open workspace. Missing code identifier.");
              return;
            }

            navigate(`/collab/${targetCodeId}`, {
              state: { roomId: roomId },
            });
          }}
        >
          <FiCode />
          Open Workspace
        </button>

        <button
          className="room__action__btn danger"
          onClick={handleLeaveOrDelete}
        >
          <FiLogOut />
          {isAdmin ? "Delete" : "Leave"}
        </button>
      </div>
    </div>
  );
};

export default RoomCard;

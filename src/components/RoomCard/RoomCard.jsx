import React from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './RoomCard.css'
import { useAuthContext } from '../../hooks/useAuthContext'
import { FiCode, FiLogOut } from "react-icons/fi";
const apiURL = import.meta.env.VITE_BACKEND_URL;

const RoomCard = ({roomId, number, isAdmin, code, participants}) => {

  const { user } = useAuthContext();
  const navigate = useNavigate();

  const handleLeaveOrDelete = async() => {
    try {
      if(user && roomId) {
        const config = {
          headers: {
            Authorization: user?.accessToken,
          },
        };
        if(isAdmin) {
          const response = await axios.delete(`${apiURL}/rooms/delete/${roomId}`, config);
          if( response && response.status === 200) {
            toast.success("Room Deleted Successfully")
          }
        } else {
          const response = await axios.put(`${apiURL}/rooms/remove`, { roomId }, config);
          if( response && response.status === 200) {
            toast.success("Room Left Successfully")
          }
        }
      }
    } catch(error) {
      console.log(error);
      toast.error("Error Occurred")
    }
  }

  return (
    <div className="single__room__container">

    <div className="room__details">

        <div className="room__badge">
            Room {number}
        </div>

        <h3>Collaborative Workspace</h3>

        <p>
            {participants} participant{participants !== 1 ? "s" : ""}
        </p>

    </div>

    <div className="room__actions">

        <button
            className="room__action__btn primary"
            onClick={() => {
                navigate(`/collab/${code}`, {
                    state: { roomId: roomId }
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
  )
}

export default RoomCard
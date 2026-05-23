import React from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './RoomCard.css'
import { useAuthContext } from '../../hooks/useAuthContext'
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
    <div className='single__room__container'>
      <div>
        <h1>Collab Room {number}</h1>
        <p>No. of participants: {participants}</p>
      </div>
      <div>
        <button className='view__code__btn' onClick={() => {navigate(`/collab/${code}`, { state: { roomId : roomId } })}}>GO TO CODE</button>
        <button className='view__code__btn' onClick={handleLeaveOrDelete}>{isAdmin ? "Delete" : "Leave"}</button>
      </div>
    </div>
  )
}

export default RoomCard
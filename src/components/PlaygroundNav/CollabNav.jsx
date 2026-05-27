import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaRegSave, FaUsers, FaRegLightbulb } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuthContext } from '../../hooks/useAuthContext';
import Modal from '../Modal/Modal';
import ParticipantList from '../ParticipantList/ParticipantList';
import './PlaygroundNav.css';

const apiURL = import.meta.env.VITE_BACKEND_URL;

const PlaygroundNav = ({ title, setTitle, roomId, owner, isAdmin, id, handleDisconnect, clients, onSaveWhiteboard, onOpenBrainstorm, socket }) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('settings');
  const [participants, setParticipants] = useState([]);
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
    if (event.target.value === 'users') {
      openModal(event.target.value);
    } else if (event.target.value === 'brainstorm') {
      onOpenBrainstorm?.();
    } else if (event.target.value === 'copyid') {
      copyIDToClipboard();
    } else {
      handleLeave();
    }
  };

  useEffect(() => {
  const fetchRoom = async() => {
    try {
      if (user && roomId) {
        const config = { headers: { Authorization: user?.accessToken } };
        const response = await axios.get(`${apiURL}/rooms/users/${roomId}`, config);
        
        if (response && response.status === 200) {
          setParticipants(response.data.allUsers);
        }
      }
    } catch (error) {
      console.error("Failed fetching standard participant rosters:", error);
    }
  };

  // FIX: Reset local state back to empty whenever the room ID updates 
  // This clears out old room lists instantly and forces a clean re-render
  setParticipants([]); 
  
  fetchRoom();
}, [user, roomId]);

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
          config
        );
        if (response && response.status === 200) {
          toast.success('Updated successfully!');

          // 💡 FIX: Broadcast save notification to all other users in the socket room
          const activeRoomId = roomId || id;
          if (socket && socket.connected && activeRoomId) {
            socket.emit('WORKSPACE_SAVED', { 
              room: activeRoomId, 
              username: user?.name 
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
    // Pulls roomId property, falls back safely to document identity key if empty
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
    navigate('/collab');
  }

  return (
    <div className="playground__controls">
      <div className="home__icon__container">
        <div className="details__container">
            <input
              disabled={isAdmin}
              className="playground__title"
              value={window.innerWidth < 768 ? title?.substring(0, 10) + "..." : title}
              type="text"
              onChange={(event) => setTitle(event.target.value)}
            />
            <p>{window.innerWidth < 768 ? owner?.substring(0, 10) + "..." : owner}</p>
        </div>
        <button onClick={saveCode} className="colored__btn">
            <FaRegSave />
        </button>
      </div>
      <div className='playground__controls__container'>
          <button className='colored__btn' onClick={() => onOpenBrainstorm?.()}><FaRegLightbulb /></button>
          <button className='colored__btn' onClick={copyIDToClipboard}>Copy ID</button>
          <button className='colored__btn' onClick={handleLeave}>Leave Room</button>
          <button className='colored__btn' onClick={() => openModal()}><FaUsers /></button>
        </div>
        <div className="playground__controls__container__mobile">
          <select value={activeMenu} onChange={handleSelectChange}>
            <option disabled hidden value="settings">
              Settings
            </option>
            <option value="users">Users 🧑🏼‍🦰</option>
            <option value="brainstorm">Brainstorm Board 💡</option>
            <option value="copyid">Copy ID 📜</option>
            <option value="exit">Leave Room</option>
          </select>
        </div>
      <Modal
        isOpen={modalIsOpen}
        closeModal={closeModal}
        children={<ParticipantList participants={participants} clients={clients} />}
      />
    </div>
  );
};

export default PlaygroundNav;

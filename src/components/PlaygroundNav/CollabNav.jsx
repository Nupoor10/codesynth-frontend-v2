import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaRegSave, FaUsers } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuthContext } from '../../hooks/useAuthContext';
import Modal from '../Modal/Modal';
import ParticipantList from '../ParticipantList/ParticipantList';
import './PlaygroundNav.css';

const apiURL = import.meta.env.VITE_BACKEND_URL;

const PlaygroundNav = ({ htmlValue, cssValue, jsValue, title, setTitle, roomId, owner, isAdmin, id, handleDisconnect, clients }) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
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
    setActiveTab(event.target.value);
    if(event.target.value === 'users') {
      openModal(event.target.value);
    } else if(event.target.value === 'copyid') {
      copyIDToClipboard();
    } else {
      handleLeave();
    }
  };

  useEffect(() => {
    const fetchRoom = async() => {
      try {
        if (user && roomId) {
          const config = {
            headers: {
              Authorization: user?.accessToken,
            },
          };
          const response = await axios.get(
            `${apiURL}/rooms/users/${roomId}`,
            config
          );
          if (response && response.status === 200) {
            setParticipants(response.data.allUsers);
          }
        }
      } catch (error) {
        console.log(error);
        toast.error(error?.message);
      }
    }

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
            html: htmlValue,
            css: cssValue,
            javascript: jsValue,
            isRoom: true,
          },
          config
        );
        if (response && response.status === 200) {
          toast.success('Updated successfully!');
        }
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.message);
    }
  };

  const copyIDToClipboard = () => {
    navigator.clipboard.writeText(roomId);
    toast.success("Copied Room ID to Clipboard");
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
          <button className='colored__btn' onClick={copyIDToClipboard}>Copy ID</button>
          <button className='colored__btn' onClick={handleLeave}>Leave Room</button>
          <button className='colored__btn' onClick={() => openModal()}><FaUsers /></button>
        </div>
        <div className="playground__controls__container__mobile">
          <select value={activeTab} onChange={handleSelectChange}>
            <option disabled hidden value="settings">
              Settings
            </option>
            <option value="users">Users 🧑🏼‍🦰</option>
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

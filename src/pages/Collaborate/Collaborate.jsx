import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthContext } from '../../hooks/useAuthContext';
import RoomCard from '../../components/RoomCard/RoomCard';
import Footer from "../../components/Footer/Footer";
import { FiArrowLeft, FiUsers, FiPlusCircle,  } from "react-icons/fi";
import { FaHandshakeSimple } from "react-icons/fa6";
import Navbar from '../../components/Navbar/Navbar';
import Modal from '../../components/Modal/Modal';
import { getRandomTitle } from '../../utils/titleGenerator';
import "./Collaborate.css"
const apiURL = import.meta.env.VITE_BACKEND_URL;


const Collaborate = () => {
    const [ userRooms, setUserRooms] = useState([]);
    const [newRoomId, setNewRoomId] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newRoomTitle, setNewRoomTitle] = useState('');
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { user, dispatch } = useAuthContext();
    const navigate = useNavigate();
    
    const toggleDropdown = () => {
      setIsOpen(!isOpen);
    };
    
    const handleLogout = () => {
        dispatch({ type: "LOGOUT" });
        navigate("/");
      };

    const openCreateModal = () => {
      setNewRoomTitle('');
      setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
      setIsCreateModalOpen(false);
    };

    const generateRandomTitle = () => {
      setNewRoomTitle(getRandomTitle());
    };

    const handleCreateRoomSubmit = async (e) => {
      if (e && e.preventDefault) e.preventDefault();
      if (!newRoomTitle.trim()) {
        toast.error('Please enter a title or auto-generate one.');
        return;
      }

      await handleRoomCreation(newRoomTitle.trim());
    };

    useEffect(() => {
      const getAllRooms = async () => {
        if (user) {
          try {
            const config = {
              headers: {
                Authorization: user?.accessToken
              }
            };
            const response = await axios.get(`${apiURL}/rooms/all`, config);
            if (response && response.status === 200 && response.data.allRooms) {
              setUserRooms(response.data.allRooms);
            }
          } catch (error) {
            console.log(error);
            toast.error(error?.message);
          }
        }
      };
    
      getAllRooms();

      const interval = setInterval(() => {
        getAllRooms()
      }, 5000);

      return () => {
        clearInterval(interval);
      }

    }, [user]);  
  
    const handleCodeCreation = async (title, config) => {
        try {
          const body = {
            // minimal create payload; backend will initialize a blank index.html
            isRoom: true,
            title: title || 'Demo Container',
          };

          const response = await axios.post(`${apiURL}/codes/create`, body, config);
      
          if (response && response.status === 201 && response.data.codeDoc) {
            return response.data.codeDoc._id;
          }
        } catch (error) {
          console.error(error);
          toast.error(error?.message);
          throw new Error(error?.message);
        }
      };
      
    const handleRoomCreation = async (title) => {
        setIsCreatingRoom(true);
        try {
          if (user) {
            const config = {
              headers: {
                Authorization: user?.accessToken,
              },
            };
      
            const codeId = await handleCodeCreation(title, config);
  
            if (codeId) {
              const newUuid = uuid();
              const body = {
                roomId: newUuid,
                codeId
              };
  
              const response = await axios.post(`${apiURL}/rooms/create`, body, config);
  
              if (response && response.status === 201 && response.data.newRoom) {
                closeCreateModal();
                navigate(`/collab/${codeId}`, { state: { roomId: newUuid } });
              }
            }
          }
        } catch (error) {
          console.error(error);
          toast.error(error?.message);
        } finally {
          setIsCreatingRoom(false);
        }
      };

    const handleAddRoom = async (e) => {
      if (e && e.preventDefault) e.preventDefault();
      try {
        if(user && newRoomId) {
          const config = {
            headers: {
              Authorization: user?.accessToken,
            },
          };
          const response = await axios.put(`${apiURL}/rooms/add`, { roomID: newRoomId }, config);
          if( response && response.status === 200) {
            setNewRoomId('')
            toast.success("Room Added Successfully")
          }
        }
      } catch(error) {
        console.log(error);
        toast.error("Error in Joining Room")
      }
    }
  
  return (
    <div className="userrooms__page__wrapper">

    <div className="userrooms__content__wrapper">

        <Navbar
    toggleDropdown={toggleDropdown}
    isOpen={isOpen}
    dropdownRef={dropdownRef}
    handleLogout={handleLogout}
/>

        <div className="userrooms__hero">

            <span className="userrooms__badge">
                Real-Time Collaboration
            </span>

            <h2>
                Build Together In Shared Rooms
            </h2>

            <p>
                Create collaborative coding spaces, invite developers,
                and work together in real-time seamlessly.
            </p>

        </div>

        <div className="collab__actions__grid">

    {/* CREATE ROOM */}

    <div className="collab__action__card">

        <div className="join__room__header">

            <FiPlusCircle className="join__room__icon" />

            <h3>Create New Room</h3>

        </div>

        <p className="collab__action__text">
            Start a collaborative coding session and invite others instantly.
        </p>

        <button
            onClick={openCreateModal}
            className="create__room__btn"
        >
            Create Room
        </button>

    </div>

    <Modal isOpen={isCreateModalOpen} closeModal={closeCreateModal}>
      <div className="userrooms__modal__content">
        <div className="userrooms__modal__header">
          <h2>New Room Title</h2>
          <p>Type a title for the shared room, or auto-generate one.</p>
        </div>

        <form onSubmit={handleCreateRoomSubmit}>
          <label className="userrooms__modal__label" htmlFor="roomTitle">
            Title
          </label>
          <input
            id="roomTitle"
            type="text"
            className="userrooms__modal__input"
            value={newRoomTitle}
            onChange={(e) => setNewRoomTitle(e.target.value)}
            placeholder="Enter a room title"
          />

          <div className="userrooms__modal__actions">
            <button
              type="button"
              className="userrooms__modal__btn userrooms__modal__btn--secondary"
              onClick={generateRandomTitle}
            >
              Auto-generate Title
            </button>
            <button
              type="submit"
              className="userrooms__modal__btn"
              disabled={isCreatingRoom}
            >
              {isCreatingRoom ? 'Creating…' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </Modal>

    {/* JOIN ROOM */}

    <div className="collab__action__card">

        <div className="join__room__header">

            <FiUsers className="join__room__icon" />

            <h3>Join Existing Room</h3>

        </div>

        <p className="collab__action__text">
            Enter a room UUID to continue collaborating with your team.
        </p>

        <form className="join__room__form" onSubmit={handleAddRoom}>

          <input
            className="join__room__input"
            value={newRoomId}
            onChange={(e) => {
              setNewRoomId(e.target.value);
            }}
            placeholder="Enter Room UUID"
          />

          <button
            type="submit"
            className="join__room__btn"
          >
            Join Room
          </button>

        </form>

    </div>

</div>

        <div className="userrooms__page__content">

            {userRooms.length > 0 ? (

                <div className="userrooms__grid__container">

                    {userRooms.map((item, index) => {
                        return (
                            <RoomCard
                                key={index}
                                number={index + 1}
                                id={item._id}
                                roomId={item.roomId}
                                code={item.code}
                                title={item.code?.title || item.title}
                                admin={item.admin._id}
                                isAdmin={item.admin.username === user.name}
                                participants={(item.participants?.length || 0) + 1}
                            />
                        );
                    })}

                </div>

            ) : (

                <div className="empty__rooms__state">

                    <h3>No Rooms Created Yet</h3>

                    <p>
                        Create or join a room to start collaborating.
                    </p>

                </div>

            )}

        </div>

    </div>

    <Footer />

</div>
  )
}

export default Collaborate
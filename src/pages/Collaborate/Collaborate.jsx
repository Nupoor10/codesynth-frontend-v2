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
import "./Collaborate.css"
const apiURL = import.meta.env.VITE_BACKEND_URL;


const Collaborate = () => {
    const [ userRooms, setUserRooms] = useState([]);
    const [newRoomId, setNewRoomId] = useState('');
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
  
    const handleCodeCreation = async (config) => {
        try {
          const body = {
            // minimal create payload; backend will initialize a blank index.html
            isRoom: true,
            title: 'Demo Container',
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
      
    const handleRoomCreation = async () => {
        try {
          if (user) {
            const config = {
              headers: {
                Authorization: user?.accessToken,
              },
            };
      
            const codeId = await handleCodeCreation(config);
      
            if (codeId) {
              const newUuid = uuid()
              const body = {
                roomId: newUuid,
                codeId
              };
      
              const response = await axios.post(`${apiURL}/rooms/create`, body, config);
      
              if (response && response.status === 201 && response.data.newRoom) {
                navigate(`/collab/${codeId}`, { state: { roomId: newUuid } });
              }
            }
          }
        } catch (error) {
          console.error(error);
          toast.error(error?.message);
        }
      };      

  const handleAddRoom = async() => {
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
            onClick={handleRoomCreation}
            className="create__room__btn"
        >
            Create Room
        </button>

    </div>

    {/* JOIN ROOM */}

    <div className="collab__action__card">

        <div className="join__room__header">

            <FiUsers className="join__room__icon" />

            <h3>Join Existing Room</h3>

        </div>

        <p className="collab__action__text">
            Enter a room UUID to continue collaborating with your team.
        </p>

        <div className="join__room__form">

            <input
                className="join__room__input"
                value={newRoomId}
                onChange={(e) => {
                    setNewRoomId(e.target.value);
                }}
                placeholder="Enter Room UUID"
            />

            <button
                onClick={handleAddRoom}
                className="join__room__btn"
            >
                Join Room
            </button>

        </div>

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
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthContext } from '../../hooks/useAuthContext';
import RoomCard from '../../components/RoomCard/RoomCard';
import "./Collaborate.css"
const apiURL = import.meta.env.VITE_BACKEND_URL;


const Collaborate = () => {
    const [ userRooms, setUserRooms] = useState([]);
    const [newRoomId, setNewRoomId] = useState('');

    const navigate = useNavigate();
    const { user } = useAuthContext();
  
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
            html: '<h1>Welcome to CodeSynth</h1>',
            css: 'body {\n\tbackground: linear-gradient(109.6deg, rgb(20, 30, 48) 11.2%, rgb(36, 59, 85) 91.1%);\n\tcolor : #ffffff \n}',
            js: '',
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
    <div className='userrooms__page__wrapper'>
        <div className='userrooms__page__header'>
            <h2 onClick={() => {navigate("/home")}}>⬅️</h2>
            <h1>&nbsp; &nbsp; My Rooms ⚙️</h1> 
        </div>
        <div className='userrooms__page__content'>
          <button onClick={handleRoomCreation} className='colored__btn'>Create New +</button>
          <div className='join__room__container'>
            <input className='prompt__value' value={newRoomId} onChange={(e) => {setNewRoomId(e.target.value)}} placeholder='Enter Room UUID'/>
            <button onClick={handleAddRoom} className='colored__btn'>JOIN</button>
          </div>
        {userRooms.length > 0 ? (
          <div className='userrooms__grid__container'>
            {userRooms.map((item, index) => {
              return <RoomCard key={index} number={index + 1} id={item._id} roomId={item.roomId} code={item.code} admin={item.admin._id} isAdmin={item.admin.username === user.name} participants={item.participants?.length}/>
            })}

          </div>
          ) : (
            <p>No Rooms Created Yet</p>
          )
        }
      </div>
  </div>
  )
}

export default Collaborate
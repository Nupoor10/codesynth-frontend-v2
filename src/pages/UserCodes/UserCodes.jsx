import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthContext } from '../../hooks/useAuthContext';
import CodeContainer from '../../components/CodeContainer/CodeContainer';
import "./UserCodes.css";
const apiURL = import.meta.env.VITE_BACKEND_URL;

const UserCodes = () => {
  const [ userCodes, setUserCodes] = useState([]);

  const navigate = useNavigate();
  const { user } = useAuthContext();

  useEffect(() => {
    const getAllCodes = async () => {
      if (user) {
        try {
          const config = {
            headers: {
              Authorization: user?.accessToken
            }
          };
          const response = await axios.get(`${apiURL}/codes/all`, config);
          if (response && response.status === 200 && response.data.codeDocs) {
            setUserCodes(response.data.codeDocs);
          }
        } catch (error) {
          console.log(error);
          toast.error(error?.message);
        }
      }
    };
  
    getAllCodes();

    const interval = setInterval(() => {
      getAllCodes();
    }, 5000);

    return () => {
      clearInterval(interval);
    }
  }, [user]);  

  const handleCodeCreation = async() => {
    if (user) {
      try {
        const config = {
          headers: {
            Authorization: user?.accessToken
          }
        };
        const body = {
          html: '<h1>Welcome to CodeSynth</h1>',
          css: 'body {\n\tbackground: linear-gradient(109.6deg, rgb(20, 30, 48) 11.2%, rgb(36, 59, 85) 91.1%);\n\tcolor : #ffffff \n}',
          js: '',
          isRoom: false,
          title: 'Demo Container'
        }
        const response = await axios.post(`${apiURL}/codes/create`, body, config);
        if (response && response.status === 201 && response.data.codeDoc) {
          const id = response.data.codeDoc._id
          navigate(`/code/${id}`);
        }
      } catch (error) {
        console.log(error);
        toast.error(error?.message);
      }
    }
  }

  return (
    <div className='usercodes__page__wrapper'>
      <div className='usercodes__page__header'>
        <h2 onClick={() => {navigate("/home")}}>⬅️</h2>
            <h1>&nbsp; &nbsp; My Codes ⚙️</h1> 
        </div>
        <div className='usercodes__page__content'>
          <button onClick={handleCodeCreation} className='colored__btn'>Create New +</button>
          {userCodes.length > 0 ? (
            <div className='usercodes__grid__container'>
              {userCodes.map((code) => {
                return <CodeContainer key={code._id} title={code.title} id={code._id} time={code.updatedAt}/>
              })}
            </div>
            ) : (
              <p>No Codes Created Yet</p>
            )
          }
        </div>
    </div>
  )
}

export default UserCodes;

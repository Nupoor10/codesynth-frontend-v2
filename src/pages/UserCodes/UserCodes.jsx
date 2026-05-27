import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthContext } from '../../hooks/useAuthContext';
import CodeContainer from '../../components/CodeContainer/CodeContainer';
import Footer from "../../components/Footer/Footer";
import { FiArrowLeft, FiCode, FiCodepen, FiPlusCircle } from "react-icons/fi";
import Navbar from '../../components/Navbar/Navbar';
import "./UserCodes.css";
const apiURL = import.meta.env.VITE_BACKEND_URL;

const UserCodes = () => {
  const [ userCodes, setUserCodes] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { dispatch, user } = useAuthContext();
    const navigate = useNavigate();
  
    const toggleDropdown = () => {
      setIsOpen(!isOpen);
    };
  
    const handleLogout = () => {
      dispatch({ type: "LOGOUT" });
      navigate("/");
    };

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
          // Create a minimal code project. Backend will add a blank index.html entry file.
          isRoom: false,
          title: 'Demo Container'
        };
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
    <div className="usercodes__page__wrapper">

    <div className="usercodes__content__wrapper">

        <Navbar
    toggleDropdown={toggleDropdown}
    isOpen={isOpen}
    dropdownRef={dropdownRef}
    handleLogout={handleLogout}
/>

        <div className="usercodes__hero">

            <span className="usercodes__badge">
                Personal Workspace
            </span>

            <h2>
                Manage Your Coding Projects
            </h2>

            <p>
                Access your saved playgrounds, continue building projects,
                and organize your development workflow in one place.
            </p>

        </div>

        <div className="usercodes__actions__section">

    <div className="usercodes__action__card">

        <div className="usercodes__action__header">

            <FiPlusCircle className="usercodes__action__icon" />

            <h3>Create New Playground</h3>

        </div>

        <p className="usercodes__action__text">
            Start building a fresh project, experiment with ideas,
            and save your code instantly.
        </p>

        <button
            onClick={handleCodeCreation}
            className="create__code__btn"
        >
            Create New Code
        </button>

    </div>

</div>

        <div className="usercodes__page__content">

            {userCodes.length > 0 ? (

                <div className="usercodes__grid__container">

                    {userCodes.map((code) => {
                        return (
                            <CodeContainer
                                key={code._id}
                                title={code.title}
                                id={code._id}
                                time={code.updatedAt}
                            />
                        );
                    })}

                </div>

            ) : (

                <div className="empty__codes__state">

                    <h3>No Codes Created Yet</h3>

                    <p>
                        Start by creating your first coding workspace.
                    </p>

                </div>

            )}

        </div>

    </div>

    <Footer />

</div>
  )
}

export default UserCodes;

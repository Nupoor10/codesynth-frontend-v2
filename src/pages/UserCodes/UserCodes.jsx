import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthContext } from '../../hooks/useAuthContext';
import CodeContainer from '../../components/CodeContainer/CodeContainer';
import Footer from "../../components/Footer/Footer";
import { FiArrowLeft, FiCode, FiCodepen, FiPlusCircle } from "react-icons/fi";
import Navbar from '../../components/Navbar/Navbar';
import Modal from '../../components/Modal/Modal';
import { getRandomTitle } from '../../utils/titleGenerator';
import "./UserCodes.css";
const apiURL = import.meta.env.VITE_BACKEND_URL;

const UserCodes = () => {
  const [ userCodes, setUserCodes] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCodeTitle, setNewCodeTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
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

  const openCreateModal = () => {
    setNewCodeTitle("");
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const generateRandomTitle = () => {
    setNewCodeTitle(getRandomTitle());
  };

  const createCode = async (title) => {
    if (!user) return;

    setIsCreating(true);

    try {
      const config = {
        headers: {
          Authorization: user?.accessToken
        }
      };
      const body = {
        isRoom: false,
        title: title || 'Demo Container'
      };

      const response = await axios.post(`${apiURL}/codes/create`, body, config);

      if (response && response.status === 201 && response.data.codeDoc) {
        const id = response.data.codeDoc._id;
        closeCreateModal();
        navigate(`/code/${id}`);
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.message || 'Unable to create code.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateSubmit = async () => {
    if (!newCodeTitle.trim()) {
      toast.error('Please enter a title or auto-generate one.');
      return;
    }

    await createCode(newCodeTitle.trim());
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
            onClick={openCreateModal}
            className="create__code__btn"
        >
            Create New Code
        </button>

    </div>

</div>

        <Modal isOpen={isCreateModalOpen} closeModal={closeCreateModal}>
          <div className="usercodes__modal__content">
            <div className="usercodes__modal__header">
              <h2>New Playground Title</h2>
              <p>Type a name for your code project, or auto-generate one.</p>
            </div>

            <label className="usercodes__modal__label" htmlFor="codeTitle">
              Title
            </label>
            <input
              id="codeTitle"
              type="text"
              className="usercodes__modal__input"
              value={newCodeTitle}
              onChange={(e) => setNewCodeTitle(e.target.value)}
              placeholder="Enter a title for your new code"
            />

            <div className="usercodes__modal__actions">
              <button
                type="button"
                className="usercodes__modal__btn usercodes__modal__btn--secondary"
                onClick={generateRandomTitle}
              >
                Auto-generate Title
              </button>
              <button
                type="button"
                className="usercodes__modal__btn"
                onClick={handleCreateSubmit}
                disabled={isCreating}
              >
                {isCreating ? 'Creating…' : 'Create Code'}
              </button>
            </div>
          </div>
        </Modal>

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

        <Footer />

    </div>
  )
}

export default UserCodes;

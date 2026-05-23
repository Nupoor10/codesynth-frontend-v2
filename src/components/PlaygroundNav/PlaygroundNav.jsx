import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { GiTeacher, GiNotebook } from 'react-icons/gi';
import { TbBulbFilled } from 'react-icons/tb';
import { FaRegSave } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuthContext } from '../../hooks/useAuthContext';
import Modal from '../Modal/Modal';
import CoderMate from '../CoderMate/CoderMate';
import NotesGenerator from '../NotesGenerator/NotesGenerator';
import Canvas from '../Canvas/Canvas';
import './PlaygroundNav.css';

const apiURL = import.meta.env.VITE_BACKEND_URL;

const PlaygroundNav = ({ htmlValue, cssValue, jsValue, title, setTitle, owner, isGuest, id }) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  const [modalType, setModalType] = useState('');
  const navigate = useNavigate();

  const { user } = useAuthContext();

  const openModal = (type) => {
    setModalType(type);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const handleSelectChange = (event) => {
    setActiveTab(event.target.value);
    openModal(event.target.value);
  };

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
            isRoom: false,
          },
          config
        );
        if (response && response.status === 200) {
          toast.success('Updated successfully!');
          setTimeout(() => {
            navigate('/mycodes');
          }, 1000);
        }
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.message);
    }
  };

  return (
    <div className="playground__controls">
      <div className="home__icon__container">
        <p>
          <Link to={isGuest ? '/community' : '/mycodes'} className="home__link">
            ⚙️
          </Link>
        </p>
          <div className="details__container">
            <input
              disabled={isGuest}
              className="playground__title"
              value={window.innerWidth < 768 ? title?.substring(0, 10) + "..." : title}
              type="text"
              onChange={(event) => setTitle(event.target.value)}
            />
            <p>{window.innerWidth < 768 ? owner?.substring(0, 10) + "..." : owner}</p>
          </div>
        {!isGuest && (
          <button onClick={saveCode} className="colored__btn">
            <FaRegSave />
          </button>
        )}
      </div>
      {!isGuest && (
        <div className="playground__controls__container">
          <button onClick={() => openModal('bot')} className="colored__btn">
            Teach Me<span>
              <GiTeacher />
            </span>
          </button>
          <button
            onClick={() => openModal('notes')}
            className="colored__btn"
          >
            DocGen<span>
              <GiNotebook />
            </span>
          </button>
          <button
            onClick={() => openModal('board')}
            className="colored__btn"
          >
            IdeaMap<span>
              <TbBulbFilled />
            </span>
          </button>
        </div>
      )}
      {!isGuest && (
        <div className="playground__controls__container__mobile">
          <select value={activeTab} onChange={handleSelectChange}>
            <option disabled hidden value="settings">
              Settings
            </option>
            <option value="bot">Teach Me 🤖</option>
            <option value="notes">
              DocGen 📜
            </option>
            <option value="board">
              IdeaMap 🖍️
            </option>
          </select>
        </div>
      )}
      <Modal
        isOpen={modalIsOpen}
        closeModal={closeModal}
        children={
          modalType === 'bot' ? (
            <CoderMate />
          ) : modalType === 'notes' ? (
            <NotesGenerator htmlValue={htmlValue} cssValue={cssValue} jsValue={jsValue} id={id} closeModal={closeModal} />
          ) : <Canvas id={id} closeModal={closeModal} />
        }
      />
    </div>
  );
};

export default PlaygroundNav;

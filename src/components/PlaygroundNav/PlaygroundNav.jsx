import React from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FaRegSave, FaRegLightbulb } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuthContext } from '../../hooks/useAuthContext';
import './PlaygroundNav.css';

const apiURL = import.meta.env.VITE_BACKEND_URL;

const PlaygroundNav = ({ title, setTitle, owner, isGuest, id, onSaveWhiteboard, onOpenBrainstorm }) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const saveWorkspace = async () => {
    try {
      if (user) {
        // Attempt to save whiteboard snapshot first (if present). Don't block code save on failure.
        if (onSaveWhiteboard) {
          try {
            await onSaveWhiteboard();
          } catch (err) {
            console.error('Whiteboard save failed', err);
            toast.error('Whiteboard snapshot failed to save. Code will still be saved.');
          }
        }

        const config = {
          headers: {
            Authorization: user?.accessToken,
          },
        };
        const response = await axios.put(
          `${apiURL}/codes/update/${id}`,
          {
            title,
            isRoom: false,
          },
          config
        );
        if (response && response.status === 200) {
          toast.success('Workspace saved successfully!');
          setTimeout(() => {
            navigate('/mycodes');
          }, 1000);
        }
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.message || 'Failed to save workspace');
    }
  };

  return (
    <div className="playground__controls">
      <div className="home__icon__container">
        <p>
          <Link to={isGuest ? '/home' : '/mycodes'} className="home__link">
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
          <>
            <button onClick={onOpenBrainstorm} className="colored__btn">
              <FaRegLightbulb />
            </button>
            <button onClick={saveWorkspace} className="colored__btn">
              <FaRegSave />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PlaygroundNav;

import React, { useEffect, useState } from 'react'
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthContext } from '../../hooks/useAuthContext';
import "./ParticipantList.css"

const apiURL = import.meta.env.VITE_BACKEND_URL;

const ParticipantList = ({ roomId, clients = [] }) => {
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuthContext();

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!roomId || !user) return;

      setIsLoading(true);
      setError(null);

      try {
        const config = { headers: { Authorization: user?.accessToken } };
        const response = await axios.get(`${apiURL}/rooms/users/${roomId}`, config);

        if (response && response.status === 200) {
          setParticipants(response.data.allUsers || []);
        } else {
          setParticipants([]);
        }
      } catch (fetchError) {
        console.error('Failed to load participants:', fetchError);
        setError('Unable to load participant list.');
        toast.error('Unable to load participant list.');
        setParticipants([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipants();
  }, [roomId, clients, user]);

  return (
    <div className="participant__list__container">
      <h1>Participants</h1>

      {isLoading ? (
        <p>Loading participants...</p>
      ) : error ? (
        <p>{error}</p>
      ) : participants?.length > 0 ? (
        participants.map((item, index) => {
          const isConnected = clients.includes(item.username);

          return (
            <div className="participant__item" key={index}>
              <div className="participant__left">
                <div className="participant__avatar">
                  {item.username?.charAt(0).toUpperCase()}
                </div>

                <div className="participant__details">
                  <h3>{item.username}</h3>
                  <p>{isConnected ? 'Currently Active' : 'Offline'}</p>
                </div>
              </div>

              <div className={`participant__status ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          );
        })
      ) : (
        <p>No participants joined yet.</p>
      )}
    </div>
  );
}

export default ParticipantList
import React from 'react'
import "./ParticipantList.css"

const ParticipantList = ({participants, clients}) => {

  return (
    <div className="participant__list__container">

  <h1>Participants</h1>

  {participants?.length > 0 ? (

    participants.map((item, index) => {

      const isConnected = clients.includes(item.username);

      return (

        <div
          className="participant__item"
          key={index}
        >

          <div className="participant__left">

            <div className="participant__avatar">
              {item.username?.charAt(0).toUpperCase()}
            </div>

            <div className="participant__details">

              <h3>{item.username}</h3>

              <p>
                {isConnected
                  ? "Currently Active"
                  : "Offline"}
              </p>

            </div>

          </div>

          <div
            className={`participant__status ${
              isConnected
                ? "connected"
                : "disconnected"
            }`}
          >
            {isConnected
              ? "Connected"
              : "Disconnected"}
          </div>

        </div>
      );
    })

  ) : (

    <p>No participants joined yet.</p>

  )}

</div>
  )
}

export default ParticipantList
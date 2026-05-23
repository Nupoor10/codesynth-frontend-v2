import React from 'react'
import "./ParticipantList.css"

const ParticipantList = ({participants, clients}) => {

  return (
    <div className='participant__list__container'>
      <h1>Participant List</h1>
      {participants?.length > 0 ? participants?.map((item, index) => {
        return <p key={index}><img src="https://i.ibb.co/k0ykqtY/user.png" height={'35px'} alt="user" /> &nbsp; {item.username} <span>{clients.includes(item.username) ? '    Connected': "Not Connected"}</span></p>
      }) : "No Participants Joined Yet"}
    </div>
  )
}

export default ParticipantList
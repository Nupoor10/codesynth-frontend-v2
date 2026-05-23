import React from 'react'
import { useNavigate } from 'react-router-dom'
import "./CommunityCodeCard.css"

const CommunityCodeCard = ({title, id, owner }) => {

    const navigate = useNavigate();
    const handelNavigate = () => {
        navigate(`/code/${id}`);
    }

  return (
    <div className='community__code__card'>
        <h1>{title}</h1>
        <p><img src="https://i.ibb.co/k0ykqtY/user.png" height={'35px'} alt="user" /> &nbsp; {owner}</p>
        <button onClick={handelNavigate} className='view__code__btn'>View Code</button>
    </div>
  )
}

export default CommunityCodeCard
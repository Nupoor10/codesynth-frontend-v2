import React from 'react';
import { useNavigate } from 'react-router-dom';
import "./HomeCard.css"

const HomeCard = ({title, text, path}) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate(path)
  }

  return (
    <div className='home__card__wrapper'>
        <h1 onClick={handleNavigate}>{title}</h1>
        <p>
            {text}
        </p>
    </div>
  )
}

export default HomeCard
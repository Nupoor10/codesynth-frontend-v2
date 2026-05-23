import React from 'react';
import "./FullNote.css";

const FullNote = ({title, content, images}) => {
  return (
    <div className="full__note">
        <div className="full__note__title">
            <h2>{title?.toUpperCase()}</h2>
        </div>
        <div className="full__note__content">
            {content && (<p>{content}</p>)}
            {images && (
                <img src={images} alt='note__img' height="400px"/>
            )}
        </div>
    </div>
  )
}

export default FullNote
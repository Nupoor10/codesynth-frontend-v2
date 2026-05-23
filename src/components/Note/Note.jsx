import React, { useState} from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { BsTrashFill } from "react-icons/bs";
import { FaRegEye } from "react-icons/fa";
import toast from 'react-hot-toast';
import { useAuthContext } from "../../hooks/useAuthContext";
import Modal from "../Modal/Modal";
import FullNote from "../FullNote/FullNote";
import "./Note.css";
const apiURL = import.meta.env.VITE_BACKEND_URL;

const Note = ({id, title, content, images}) => {

  const { user } = useAuthContext();
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const openModal = () => {
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };


  const deleteNote = async() => {
    try {
        const config = {
            headers : {
              Authorization : user?.accessToken
            }
          }
        const response = await axios.delete(`${apiURL}/notes/delete/${id}`, config);
        if(response && response.status === 200) {
            toast.success("Deleted Successfully");
        }
    } catch(error) {
        console.log(error);
        toast.error(error?.message);
      }
  }

  return (
    <div className="note">
        <div className="note_text">
          <h2>{title?.toUpperCase()}</h2>
          <h2>{content?.substring(0, 40)}</h2>
          {images && (
            <img src={images} alt="image" height="150px"/>
          )}
        </div>
        <div className="note_footer">
          <Link className="link" onClick={openModal}><FaRegEye /></Link>
          <Link className="link" onClick={deleteNote}><BsTrashFill /></Link>
        </div>
        <Modal isOpen={modalIsOpen} closeModal={closeModal} 
          children={
            <FullNote title={title} content={content} images={images}/>
          }
          />
      </div>
  )
}

export default Note
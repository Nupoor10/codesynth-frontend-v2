import React, { useState, useRef } from "react";
import axios from "axios";
import { ReactSketchCanvas } from "react-sketch-canvas";
import toast from 'react-hot-toast';
import { useAuthContext } from "../../hooks/useAuthContext";
import "./Canvas.css";
const apiURL = import.meta.env.VITE_BACKEND_URL;

const Canvas = ({id, closeModal }) => {
  const canvas = useRef();

  const [image, setImage] = useState(null);
  const [ noteTitle, setNoteTitle ] = useState('Sample Note Title')
  const { user } = useAuthContext();

  const exportImage = () => {
    canvas.current
      .exportImage("png")
      .then(data => {
        setImage(data);
      })
      .catch(e => {
        console.log(e);
      });
  };

  const clearCanvas = () => {
    canvas.current.clearCanvas();
    setImage(null)
  }

  const handleSaveImg = async() => {
    try {
      const config = {
        headers : {
          Authorization : user?.accessToken
        }
      }
      const response = await axios.post(`${apiURL}/notes/add/${id}`, {
        title : noteTitle,
        images : image,
        code : id
      }, config);
      if(response && response?.status === 201) {
        toast.success("Note Added");
        clearCanvas();
        closeModal();
      }
    } catch(error) {
      console.log(error);
      toast.error(error?.message);
    }
  }

  return (
    <div className="canvas__container">
      <ReactSketchCanvas
        ref={canvas}
        width="95%"
        height="80vh"
        strokeWidth={5}
        strokeColor="black"
        backgroundImage={"https://upload.wikimedia.org/wikipedia/commons/7/70/Graph_paper_scan_1600x1000_%286509259561%29.jpg"}
      />
      <div className="canvas__controls">
        <button className="monochrome__btn" onClick={exportImage}>Get Image</button>
        <button className="monochrome__btn" onClick={clearCanvas}>Clear</button>
      </div>
      {image && (
        <div className="image__container">
          <img src={image} alt="Drawing" />
          <div className='input__prompt'>
            <input type='text' name='prompt' className='prompt__value' value={noteTitle} onChange={(e) => {setNoteTitle(e.target.value)}} />
          </div>
          <button className="monochrome__btn" onClick={handleSaveImg}>Save as a Note</button>
        </div>
        )}
    </div>
  );
};

export default Canvas;

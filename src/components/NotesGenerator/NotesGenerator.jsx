import React, { useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useAuthContext } from '../../hooks/useAuthContext';
import "../Modal/Modal.css";
const apiURL = import.meta.env.VITE_BACKEND_URL;

const NotesGenerator = ({htmlValue, cssValue, jsValue, id, closeModal}) => {

    const [ inputVal, setInputVal ] = useState('Generate Detailed Notes on my Code');
    const [ notesVal, setNotesVal ] = useState('');
    const [ noteTitle, setNoteTitle ] = useState('Sample Note Title')
    const { user } = useAuthContext();

    const copyNotesToClipboard = () => {
        navigator.clipboard.writeText(notesVal);
        toast.success("Copied to Clipboard");
      };
    
    const handleGenerateNotes = async() => {
        try {
            const prompt = `${inputVal} consisting of the following Html Code : ${htmlValue}, \nCss Code : ${cssValue} and \nJavaScript Code : ${jsValue}. Do not return the code in the prompt provided just return a text describing what the code is about and its functionality in brief. Feel free to make some assumptions.`;
            const config = {
                headers : {
                Authorization : user?.accessToken
                }
            }
            const response = await axios.post(`${apiURL}/llm/generate`, {
                prompt
            }, config);
            if(response && response?.status === 200) {
                setNotesVal(response?.data?.prediction);
            }
        } catch(error) {
            console.log(error);
            toast.error(error?.message);
        }
    }

      const addNote = async() => {
        try {
            const config = {
                headers : {
                  Authorization : user?.accessToken
                }
            }
            const response = await axios.post(`${apiURL}/notes/add/${id}`, {
                title : noteTitle,
                content : notesVal,
                code : id
            }, config);
            if(response && response?.status === 201) {
                toast.success("Note Added Successfully");
                setNotesVal("");
                setNoteTitle("Sample Note Title")
                closeModal()
            }
        } catch(error) {
            console.log(error);
            toast.error(error?.message);
          }
      };

  return (
    <div className='generater__container'>
        <p>Unlock Effortless Note-Taking with AI-Powered Notes: Your Personal Assistant for Instant,
            Insightful Documentation.</p>
        <p>Just Click on Generate and Get Started🚀</p>
        <input type='text' name='prompt' className='prompt__value' value={inputVal}
            onChange={(e) => {setInputVal(e.target.value)}}
            disabled></input>
        <button onClick={handleGenerateNotes} className='monochrome__btn'>Generate</button>
        <input type='text' name='prompt' className='prompt__value' value={noteTitle}
            onChange={(e) => {setNoteTitle(e.target.value)}}
        ></input>
        <div className='output__div'>
            <button onClick={copyNotesToClipboard} className='monochrome__btn'>Copy</button>
            <button onClick={addNote} className='monochrome__btn'>Add Note</button>
        </div> 
        <p>Output</p>
        <textarea
        rows="20"
        value={notesVal}
        readOnly
        className='text__area'
         />
        <Toaster position='top-center'/>
    </div>
  )
}

export default NotesGenerator
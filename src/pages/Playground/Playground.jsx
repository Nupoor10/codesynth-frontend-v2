import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";
import toast from 'react-hot-toast';
import axios from 'axios';
import PlaygroundNav from '../../components/PlaygroundNav/PlaygroundNav';
import CodeEditor from '../../components/CodeEditor/CodeEditor';
import { useAuthContext } from '../../hooks/useAuthContext';
import "./Playground.css"
const apiURL = import.meta.env.VITE_BACKEND_URL;

const Playground = () => {

  const { user } = useAuthContext();
  const { id } = useParams();

  const [ htmlValue, setHtmlValue] = useState('');
  const [ cssValue, setCssValue] = useState('');
  const [ jsValue, setJsValue] = useState('');
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [ collapsed, setCollapsed] = useState(false);
  const [container, setContainer] = useState('html');

  useEffect(() => {
    const fetchCode = async() => {
      if(id && user) {
        try {
          const config = {
            headers: {
              Authorization: user?.accessToken
            }
          };
          const response = await axios.get(`${apiURL}/codes/get/${id}`, config);
          if(response && response.status === 200) {
            setHtmlValue(response?.data?.codeDoc?.html)
            setCssValue(response?.data?.codeDoc?.css);
            setJsValue(response?.data?.codeDoc?.javascript);
            setTitle(response?.data?.codeDoc?.title);
            setOwner(response?.data?.codeDoc?.owner.username)
            if(response?.data?.codeDoc?.owner?.username !== user.name) {
              setIsGuest(true);
            }
          }
        }
         catch(error) {
          console.log(error);
          toast.error(error?.message);
        }
      }
    }

    fetchCode();
  }, [id, user])

  const doc = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Hello, World!</title>
        <style>${cssValue}</style>
    </head>
    <body>
        ${htmlValue}
        <script>${jsValue}</script>
    </body>
    </html>
  `;  

  return (
    <div className='playground__page__wrapper'>
      <div className='playground__nav__wrapper'>
      <PlaygroundNav htmlValue={htmlValue} cssValue={cssValue} jsValue={jsValue} title={title} setTitle={setTitle} isGuest={isGuest} id={id} owner={owner}/>
        <button onClick={() => {setCollapsed(!collapsed)}}>
          {collapsed ? (<IoIosArrowDropdown />) : (<IoIosArrowDropup />)}
        </button>
      </div>
      <div className='editor__tab__container'>
        <span onClick={() => {setContainer('html')}}>HTML</span>
        <span onClick={() => {setContainer('css')}}>CSS</span>
        <span onClick={() => {setContainer('js')}}>JS</span>
      </div>
        <div style={{display : collapsed ? 'none' : 'flex'}}>
          <div className='editor__components'>
            <CodeEditor id="html" codeValue={htmlValue} setCodeValue={setHtmlValue} editorLang={"html"} />
            <CodeEditor id="css" codeValue={cssValue} setCodeValue={setCssValue} editorLang={"css"} />
            <CodeEditor id="js" codeValue={jsValue} setCodeValue={setJsValue} editorLang={"javascript"} />
          </div> 
          <div className='editor__components__mobile'>
            {(container === 'html') ? 
            <CodeEditor id="html" codeValue={htmlValue} setCodeValue={setHtmlValue} editorLang={"html"} />
            : (container === 'css') ? <CodeEditor id="css" codeValue={cssValue} setCodeValue={setCssValue} editorLang={"css"} />
            : <CodeEditor id="js" codeValue={jsValue} setCodeValue={setJsValue} editorLang={"javascript"} />
            }
          </div> 
        </div>
        <div className='iframe__component'>
          <iframe style={{height : collapsed ? '100vh' : '47vh'}} title="myDoc" srcDoc={`${doc}`}></iframe>
        </div>
    </div>
  )
}

export default Playground
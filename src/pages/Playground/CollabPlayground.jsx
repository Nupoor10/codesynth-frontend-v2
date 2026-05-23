import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";
import toast from 'react-hot-toast';
import axios from 'axios';
import CollabNav from "../../components/PlaygroundNav/CollabNav";
import CodeEditor from '../../components/CodeEditor/CodeEditor';
import { useAuthContext } from '../../hooks/useAuthContext';
import ACTIONS from '../../constants/Actions';
import { initSocket } from '../../socket';
import "./Playground.css"
const apiURL = import.meta.env.VITE_BACKEND_URL;

const CollabPlayground = () => {

  const [ htmlValue, setHtmlValue] = useState('');
  const [ cssValue, setCssValue] = useState('');
  const [ jsValue, setJsValue] = useState('');
  const [title, setTitle] = useState('');
  const [isRoom, setIsRoom] = useState(false);
  const [owner, setOwner] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ collapsed, setCollapsed] = useState(false);
  const [container, setContainer] = useState('html');
  const [activeClients, setActiveClients] = useState([]);
  const { user } = useAuthContext();
  const { id } = useParams();
  const location = useLocation();
  const socketRef = useRef(null);
  const navigate = useNavigate();

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
            setIsRoom(response?.data?.codeDoc?.isRoom);
            setOwner(response?.data?.codeDoc?.owner.username)
            if(response?.data?.codeDoc?.owner?.username === user.name) {
              setIsAdmin(true);
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

  }, [])

  useEffect(() =>{
    const socketConnection = async() => {
      if(location?.state?.roomId) {
        const roomId = location?.state?.roomId;
        socketRef.current = await initSocket();
        
        socketRef.current.on(ACTIONS.CONNECT_ERROR, (err) => handleErrors(err));
        socketRef.current.on(ACTIONS.CONNECT_FAILED, (err) => handleErrors(err));

        socketRef.current.emit(ACTIONS.JOIN_ROOM, { roomId, username: user?.name});

        socketRef.current.on(ACTIONS.NEW_JOIN, ({username, clients}) => {
          if(user?.name !== username) {
            toast.success(`${username} joined the room`);
          }
          setActiveClients(clients)
        })

        socketRef.current.on(ACTIONS.DISCONNECTED, ({username}) => {
          if(user?.name !== username) {
            toast.success(`${username} left the room`);
          }
          setActiveClients((prev) => {
            return prev.filter((user) => user!== username.toString())
          })
        })
      }
    }
    
    socketConnection();

    return () => {
      handleDisconnect();
    };
  }, []);

  const handleDisconnect = () => {
    if(socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOIN_ROOM);
      socketRef.current.off(ACTIONS.DISCONNECTED);
    }
  }

  const handleErrors = (e) => {
    console.log('socket error', e);
    toast.error('Socket connection failed, try again later.');
    navigate('/collab');
  }

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
      <CollabNav htmlValue={htmlValue} cssValue={cssValue} jsValue={jsValue} title={title} setTitle={setTitle} roomId={location?.state?.roomId} isAdmin={isAdmin} id={id} owner={owner} handleDisconnect={handleDisconnect} clients={activeClients}/>
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
            <CodeEditor id="html" codeValue={htmlValue} setCodeValue={setHtmlValue} editorLang={"html"} isRoom={isRoom} roomId={location?.state?.roomId} socketRef={socketRef}/>
            <CodeEditor id="css" codeValue={cssValue} setCodeValue={setCssValue} editorLang={"css"} isRoom={isRoom} roomId={location?.state?.roomId} socketRef={socketRef}/>
            <CodeEditor id="js" codeValue={jsValue} setCodeValue={setJsValue} editorLang={"javascript"} isRoom={isRoom} roomId={location?.state?.roomId} socketRef={socketRef}/>
          </div> 
          <div className='editor__components__mobile'>
            {(container === 'html') ? 
            <CodeEditor id="html" codeValue={htmlValue} setCodeValue={setHtmlValue} editorLang={"html"} isRoom={isRoom} roomId={location?.state?.roomId} socketRef={socketRef}/>
            : (container === 'css') ? <CodeEditor id="css" codeValue={cssValue} setCodeValue={setCssValue} editorLang={"css"} isRoom={isRoom} roomId={location?.state?.roomId} socketRef={socketRef}/>
            : <CodeEditor id="js" codeValue={jsValue} setCodeValue={setJsValue} editorLang={"javascript"} isRoom={isRoom} roomId={location?.state?.roomId} socketRef={socketRef}/>
            }
          </div> 
        </div>
        <div className='iframe__component'>
          <iframe style={{height : collapsed ? '100vh' : '47vh'}} title="myDoc" srcDoc={`${doc}`}></iframe>
        </div>
    </div>
  )
}

export default CollabPlayground
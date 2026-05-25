import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";
import toast from 'react-hot-toast';
import axios from 'axios';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import CollabNav from "../../components/PlaygroundNav/CollabNav";
import FileExplorer from '../../components/FileExplorer/FileExplorer';
import CodeEditor from '../../components/CodeEditor/CodeEditor';
import { useAuthContext } from '../../hooks/useAuthContext';
import ACTIONS from '../../constants/Actions';
import { initSocket } from '../../socket';
import "./Playground.css"
import previewBuilder from '../../utils/previewBuilder';
const apiURL = import.meta.env.VITE_BACKEND_URL;

const CollabPlayground = () => {

  const [ files, setFiles] = useState([]);
  const [ activeFileId, setActiveFileId] = useState(null);
  const [title, setTitle] = useState('');
  const [isRoom, setIsRoom] = useState(false);
  const [owner, setOwner] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ collapsed, setCollapsed] = useState(false);
  const [activeClients, setActiveClients] = useState([]);
  const { user } = useAuthContext();
  const { id } = useParams();
  const location = useLocation();
  const socketRef = useRef(null);
  const ydocRef = useRef(null);
  const yProviderRef = useRef(null);
  const yFileContentsRef = useRef(null);
  const yTextObserversRef = useRef(new Map());
  const saveTimeoutsRef = useRef(new Map());
  const filesRef = useRef([]);
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
            const codeDoc = response?.data?.codeDoc;
            setFiles(codeDoc?.files || []);
            if (codeDoc?.files?.length > 0) {
              setActiveFileId(codeDoc.files[0].id);
            }
            setTitle(codeDoc?.title);
            setIsRoom(codeDoc?.isRoom);
            setOwner(codeDoc?.owner.username)
            if(codeDoc?.owner?.username === user.name) {
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

  const getYjsEndpoint = () => {
    const baseUrl = import.meta.env.VITE_YJS_URL || apiURL;
    const wsUrl = baseUrl.replace(/^http/, 'ws').replace(/\/$/, '');
    return `${wsUrl}/yjs`;
  };

  const persistFileContent = async (fileId, content) => {
    if (!user || !fileId) return;

    try {
      const config = {
        headers: {
          Authorization: user?.accessToken
        }
      };
      await axios.put(`${apiURL}/codes/${id}/files/${fileId}`, { content }, config);
    } catch (error) {
      console.error('Failed to persist file content via REST:', error?.message || error);
    }
  };

  const scheduleSave = (fileId, content) => {
    if (!fileId) return;
    const existingTimeout = saveTimeoutsRef.current.get(fileId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      persistFileContent(fileId, content);
      saveTimeoutsRef.current.delete(fileId);
    }, 1000);

    saveTimeoutsRef.current.set(fileId, timeout);
  };

  const rebuildPreview = (sourceFiles) => {
    const source = sourceFiles ?? filesRef.current;
    const contentFiles = source.map((f) => {
      const yText = yFileContentsRef.current?.get(f.id);
      return { ...f, content: yText ? yText.toString() : f.content };
    });

    const { srcDoc, blobUrls } = previewBuilder.buildPreview(contentFiles, undefined, title);
    previewBuilder.revokeBlobUrls(previewBlobUrlsRef.current || []);
    previewBlobUrlsRef.current = blobUrls || [];
    setPreviewSrcDoc(srcDoc);
  };

  const attachYTextObserver = (fileId, yText) => {
    if (!yText || yTextObserversRef.current.has(fileId)) return;
    const cb = () => {
      const content = yText.toString();
      scheduleSave(fileId, content);
      // update preview only, do NOT call setFiles to avoid edit loops
      rebuildPreview();
    };
    yText.observe(cb);
    yTextObserversRef.current.set(fileId, cb);
  };

  const initializeYjs = (loadedFiles, roomId) => {
    if (!roomId || ydocRef.current) return;

    const doc = new Y.Doc();
    ydocRef.current = doc;
    yProviderRef.current = new WebsocketProvider(getYjsEndpoint(), roomId, doc);
    // attach local user presence to Yjs awareness so bindings (e.g. y-monaco) can show cursors
    try {
      if (yProviderRef.current && yProviderRef.current.awareness) {
        yProviderRef.current.awareness.setLocalStateField('user', {
          name: user?.name,
          color: user?.color || '#3b82f6'
        });
      }
    } catch (err) {
      console.warn('Failed to set Yjs awareness local state', err);
    }
    yFileContentsRef.current = doc.getMap('fileContents');

    // Ensure a Y.Text exists for every loaded file and attach lightweight observers
    loadedFiles.forEach((file) => {
      if (!yFileContentsRef.current.has(file.id)) {
        const yText = new Y.Text();
        yText.insert(0, file.content || '');
        yFileContentsRef.current.set(file.id, yText);
      }
      // attach observer for persistence + preview rebuild (no setFiles)
      const yText = yFileContentsRef.current.get(file.id);
      attachYTextObserver(file.id, yText);
    });

    // Observe the map itself for structural changes (keys added/removed).
    // Key-level changes correspond to file create/delete; do NOT react to Y.Text inner updates here.
    // Ensure a Y.Text exists for every loaded file and attach lightweight observers.
    // Structural file changes are handled by Socket.io event listeners.

    yProviderRef.current.on('status', (event) => {
      console.log('Yjs provider status:', event.status);
    });

    yProviderRef.current.on('sync', (isSynced) => {
      console.log('Yjs provider synced:', isSynced);
    });
  };

  useEffect(() => {
    if (location?.state?.roomId && user && files.length > 0 && !ydocRef.current) {
      initializeYjs(files, location.state.roomId);
    }
  }, [location?.state?.roomId, user, files]);

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

        // File operation handlers
        socketRef.current.on(ACTIONS.FILE_CREATE, ({ file }) => {
          setFiles(prev => [...prev, file]);
          
          if (yFileContentsRef.current) {
            // 1. Initialize the Y.Text entry ONLY if it doesn't exist yet
            if (!yFileContentsRef.current.has(file.id)) {
              const yText = new Y.Text();
              yText.insert(0, file.content || '');
              yFileContentsRef.current.set(file.id, yText);
            }
            
            // 2. ALWAYS extract the yText and attach the observer
            const yText = yFileContentsRef.current.get(file.id);
            attachYTextObserver(file.id, yText);
          }
        });

        socketRef.current.on(ACTIONS.FILE_DELETE, ({fileId}) => {
          setFiles(prev => prev.filter(f => f.id !== fileId));
          if (activeFileId === fileId) {
            setActiveFileId(null);
          }
          if (yFileContentsRef.current) {
            const yText = yFileContentsRef.current.get(fileId);
            const cb = yTextObserversRef.current.get(fileId);
            if (yText && cb) {
              yText.unobserve(cb);
              yTextObserversRef.current.delete(fileId);
            }
            yFileContentsRef.current.delete(fileId);
          }
        });

        socketRef.current.on(ACTIONS.FILE_RENAME, ({fileId, name}) => {
          setFiles(prev => prev.map(f => f.id === fileId ? {...f, name} : f));
        });

        socketRef.current.on(ACTIONS.FILE_REORDER, ({fileOrder}) => {
          const fileMap = new Map(files.map(f => [f.id, f]));
          const reorderedFiles = fileOrder.map((id, index) => {
            const file = fileMap.get(id);
            return {...file, order: index};
          });
          setFiles(reorderedFiles);
        });
      }
    }
    
    socketConnection();

    return () => {
      handleDisconnect();
      // clear pending persistence timeouts to avoid memory leaks
      if (saveTimeoutsRef.current) {
        saveTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
        saveTimeoutsRef.current.clear();
      }

      // detach all Y.Text observers
      if (yTextObserversRef.current && yFileContentsRef.current) {
        yTextObserversRef.current.forEach((cb, fileId) => {
          const yText = yFileContentsRef.current.get(fileId);
          if (yText && cb) {
            try { yText.unobserve(cb); } catch (e) { /* ignore */ }
          }
        });
        yTextObserversRef.current.clear();
      }

      // clear local awareness state so other peers no longer see us
      if (yProviderRef.current && yProviderRef.current.awareness) {
        try {
          yProviderRef.current.awareness.setLocalState(null);
        } catch (e) {
          console.warn('Failed to clear local awareness state', e);
        }
      }

      // disconnect and destroy the provider, then destroy the Y.Doc
      if (yProviderRef.current) {
        try { yProviderRef.current.disconnect(); } catch (e) { /* ignore */ }
        try { yProviderRef.current.destroy(); } catch (e) { /* ignore */ }
        yProviderRef.current = null;
      }

      if (ydocRef.current) {
        try { ydocRef.current.destroy(); } catch (e) { /* ignore */ }
        ydocRef.current = null;
      }
    };
  }, []);

  const handleDisconnect = () => {
    if(socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOIN_ROOM);
      socketRef.current.off(ACTIONS.DISCONNECTED);
      socketRef.current.off(ACTIONS.FILE_CREATE);
      socketRef.current.off(ACTIONS.FILE_DELETE);
      socketRef.current.off(ACTIONS.FILE_RENAME);
      socketRef.current.off(ACTIONS.FILE_REORDER);
    }
  }

  const handleErrors = (e) => {
    console.log('socket error', e);
    toast.error('Socket connection failed, try again later.');
    navigate('/collab');
  }

  const handleCreateFile = async (fileData) => {
    try {
      const config = {
        headers: {
          Authorization: user?.accessToken
        }
      };
      const response = await axios.post(`${apiURL}/codes/${id}/files`, fileData, config);
      if (response.status === 201) {
        const newFile = response.data.file;
        setFiles(response.data.files);
        setActiveFileId(newFile.id);

        if (yFileContentsRef.current && !yFileContentsRef.current.has(newFile.id)) {
          const yText = new Y.Text();
          yText.insert(0, newFile.content || '');
          yFileContentsRef.current.set(newFile.id, yText);
          attachYTextObserver(newFile.id, yText);
        }

        // Broadcast to other collaborators
        if(socketRef.current && location?.state?.roomId) {
          socketRef.current.emit(ACTIONS.FILE_CREATE, {
            file: newFile,
            room: location?.state?.roomId
          });
        }
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to create file');
    }
  };

  const handleUpdateFile = async (fileId, content) => {
    try {
      const config = {
        headers: {
          Authorization: user?.accessToken
        }
      };
      const response = await axios.put(`${apiURL}/codes/${id}/files/${fileId}`, { content }, config);
      if (response.status === 200) {
        setFiles(response.data.files);
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to update file');
    }
  };

  const handleRenameFile = async (fileId, newName) => {
    try {
      const config = {
        headers: {
          Authorization: user?.accessToken
        }
      };
      const response = await axios.put(`${apiURL}/codes/${id}/files/${fileId}`, { name: newName }, config);
      if (response.status === 200) {
        setFiles(response.data.files);
        
        // Broadcast to other collaborators
        if(socketRef.current && location?.state?.roomId) {
          socketRef.current.emit(ACTIONS.FILE_RENAME, {
            fileId,
            name: newName,
            room: location?.state?.roomId
          });
        }
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to rename file');
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      const config = {
        headers: {
          Authorization: user?.accessToken
        }
      };
      const response = await axios.delete(`${apiURL}/codes/${id}/files/${fileId}`, config);
      if (response.status === 200) {
        setFiles(response.data.files);
        
        if (activeFileId === fileId) {
          setActiveFileId(response.data.files[0]?.id || null);
        }

          if (yFileContentsRef.current) {
            const yText = yFileContentsRef.current.get(fileId);
            const cb = yTextObserversRef.current.get(fileId);
            if (yText && cb) {
              yText.unobserve(cb);
              yTextObserversRef.current.delete(fileId);
            }
            yFileContentsRef.current.delete(fileId);
          }

        // Broadcast to other collaborators
        if(socketRef.current && location?.state?.roomId) {
          socketRef.current.emit(ACTIONS.FILE_DELETE, {
            fileId,
            room: location?.state?.roomId
          });
        }
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to delete file');
    }
  };

  const compileCode = () => {
    // build preview from files and return srcDoc via previewBuilder
    // (handled by effect below; keep function for compatibility)
    return '';
  };

  const getLegacyValues = () => {
    const htmlFile = files.find(f => f.extension === 'html');
    const cssFile = files.find(f => f.extension === 'css');
    const jsFile = files.find(f => f.extension === 'js');
    return {
      htmlValue: htmlFile?.content || '',
      cssValue: cssFile?.content || '',
      jsValue: jsFile?.content || ''
    };
  };

  const { htmlValue, cssValue, jsValue } = getLegacyValues();
  const activeFile = files.find(f => f.id === activeFileId);

  const previewBlobUrlsRef = useRef([]);
  const [previewSrcDoc, setPreviewSrcDoc] = useState('');

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    // Rebuild preview from the canonical source: if Yjs text map exists use it, else use `files` content
    rebuildPreview();

    return () => {
      previewBuilder.revokeBlobUrls(previewBlobUrlsRef.current || []);
      previewBlobUrlsRef.current = [];
    };
  }, [files, title]);

  return (
    <div className='playground__page__wrapper'>
      <div className='playground__nav__wrapper'>
        <CollabNav htmlValue={htmlValue} cssValue={cssValue} jsValue={jsValue} title={title} setTitle={setTitle} roomId={location?.state?.roomId} isAdmin={isAdmin} id={id} owner={owner} handleDisconnect={handleDisconnect} clients={activeClients}/>
        <button onClick={() => {setCollapsed(!collapsed)}} className='collapse-btn'>
          {collapsed ? (<IoIosArrowDropdown />) : (<IoIosArrowDropup />)}
        </button>
      </div>
      <div className='playground__editor__container' style={{display : collapsed ? 'none' : 'grid'}}>
        <div className='file-explorer-pane'>
          <FileExplorer
            files={files}
            activeFileId={activeFileId}
            onSelectFile={setActiveFileId}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
            onRenameFile={handleRenameFile}
          />
        </div>
        <div className='code-editor-pane'>
          <CodeEditor
            file={activeFile}
            onFileChange={handleUpdateFile}
            isRoom={isRoom}
            yProvider={yProviderRef.current}
            yFileContents={yFileContentsRef.current}
          />
        </div>
        <div className='preview-pane'>
          <iframe title="myDoc" srcDoc={previewSrcDoc}></iframe>
        </div>
      </div>
    </div>
  )
}

export default CollabPlayground
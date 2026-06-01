import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";
import toast from 'react-hot-toast';
import axios from 'axios';
import PlaygroundNav from '../../components/PlaygroundNav/PlaygroundNav';
import FileExplorer from '../../components/FileExplorer/FileExplorer';
import CodeEditor from '../../components/CodeEditor/CodeEditor';
import Whiteboard from '../../components/Whiteboard/Whiteboard';
import DraggableResizableModal from '../../components/Modal/DraggableResizableModal';
import { useAuthContext } from '../../hooks/useAuthContext';
import {
  FiMaximize2,
  FiMinimize2
} from "react-icons/fi";
import "./Playground.css"
const apiURL = import.meta.env.VITE_BACKEND_URL;
import previewBuilder from '../../utils/previewBuilder';

const Playground = () => {

  const { user } = useAuthContext();
  const { id } = useParams();

  const [ files, setFiles] = useState([]);
  const [ activeFileId, setActiveFileId] = useState(null);
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState(null);
  const [whiteboardData, setWhiteboardData] = useState('');
  const [isBrainstormOpen, setIsBrainstormOpen] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const whiteboardSaveRef = useRef(null);
  const saveTimeoutsRef = useRef(new Map());

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
            setWhiteboardData(codeDoc?.whiteboardData || '');
            setOwner(codeDoc?.owner.username)
            if(codeDoc?.owner?.username !== user.name) {
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

  const activeFile = files.find(f => f.id === activeFileId);
  const openBrainstorm = () => setIsBrainstormOpen(true);
  const closeBrainstorm = () => setIsBrainstormOpen(false);

  const handleCreateFile = async (fileData) => {
    try {
      const config = {
        headers: {
          Authorization: user?.accessToken
        }
      };
      const response = await axios.post(`${apiURL}/codes/${id}/files`, fileData, config);
      if (response.status === 201) {
        setFiles(response.data.files);
        setActiveFileId(response.data.file.id);
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to create file');
    }
  };

  const persistFileContent = async (fileId, content) => {
    try {
      const config = {
        headers: {
          Authorization: user?.accessToken
        }
      };
      await axios.put(`${apiURL}/codes/${id}/files/${fileId}`, { content }, config);
    } catch (error) {
      console.log(error);
      toast.error('Failed to save file');
    }
  };

  const schedulePersistFileContent = (fileId, content) => {
    if (!fileId) return;
    const existingTimeout = saveTimeoutsRef.current.get(fileId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = window.setTimeout(() => {
      persistFileContent(fileId, content);
      saveTimeoutsRef.current.delete(fileId);
    }, 800);

    saveTimeoutsRef.current.set(fileId, timeout);
  };

  const handleUpdateFile = (fileId, content) => {
    setFiles((prev) => prev.map((file) => file.id === fileId ? { ...file, content } : file));
    schedulePersistFileContent(fileId, content);
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
        // Reset active file if deleted
        if (activeFileId === fileId) {
          setActiveFileId(response.data.files[0]?.id || null);
        }
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to delete file');
    }
  };

  const previewBlobUrlsRef = useRef([]);
  const previewTimeoutRef = useRef(null);
  const [previewSrcDoc, setPreviewSrcDoc] = useState('');

  useEffect(() => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    previewTimeoutRef.current = window.setTimeout(() => {
      const { srcDoc, blobUrls } = previewBuilder.buildPreview(files, undefined, title);
      previewBuilder.revokeBlobUrls(previewBlobUrlsRef.current || []);
      previewBlobUrlsRef.current = blobUrls || [];
      setPreviewSrcDoc(srcDoc);
    }, 2000);

    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, [files, title]);

  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
      previewBuilder.revokeBlobUrls(previewBlobUrlsRef.current || []);
      previewBlobUrlsRef.current = [];
    };
  }, []);



  return (
    <div className="playground__page__wrapper">

    <div className="playground__nav__wrapper">

        <PlaygroundNav
            title={title}
            setTitle={setTitle}
            isGuest={isGuest}
            id={id}
            owner={owner}
            onSaveWhiteboard={() => whiteboardSaveRef.current?.()}
            onOpenBrainstorm={openBrainstorm}
        />

        <button
            onClick={() =>
                setIsPreviewMode(!isPreviewMode)
            }
            className="preview-toggle-btn"
            title={
                isPreviewMode
                    ? "Exit Preview Mode"
                    : "Enter Preview Mode"
            }
        >
            {isPreviewMode
                ? <FiMinimize2 />
                : <FiMaximize2 />}
        </button>

    </div>

    <div
        className={`playground__editor__container ${
            isPreviewMode
                ? "preview-mode"
                : ""
        }`}
    >

        <div className="file-explorer-pane">

            <FileExplorer
                files={files}
                activeFileId={activeFileId}
                onSelectFile={setActiveFileId}
                onCreateFile={handleCreateFile}
                onDeleteFile={handleDeleteFile}
                onRenameFile={handleRenameFile}
            />

        </div>

        <div className="code-editor-pane">

            <CodeEditor
                file={activeFile}
                onFileChange={handleUpdateFile}
                isRoom={false}
            />

        </div>

        <div className="preview-pane">

            <iframe
                title="myDoc"
                srcDoc={previewSrcDoc}
            />

        </div>

    </div>

    <DraggableResizableModal
        isOpen={isBrainstormOpen}
        closeModal={closeBrainstorm}
        title="Brainstorm Board"
    >

        <Whiteboard
            isRoom={false}
            yDoc={null}
            id={id}
            initialData={whiteboardData}
            whiteboardSaveRef={whiteboardSaveRef}
            apiURL={apiURL}
            accessToken={user?.accessToken}
        />

    </DraggableResizableModal>

</div>
  )
}

export default Playground
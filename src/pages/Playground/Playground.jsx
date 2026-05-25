import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";
import toast from 'react-hot-toast';
import axios from 'axios';
import PlaygroundNav from '../../components/PlaygroundNav/PlaygroundNav';
import FileExplorer from '../../components/FileExplorer/FileExplorer';
import CodeEditor from '../../components/CodeEditor/CodeEditor';
import { useAuthContext } from '../../hooks/useAuthContext';
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
  const [isGuest, setIsGuest] = useState(false);
  const [ collapsed, setCollapsed] = useState(false);

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
  const [previewSrcDoc, setPreviewSrcDoc] = useState('');

  useEffect(() => {
    const { srcDoc, blobUrls } = previewBuilder.buildPreview(files, undefined, title);
    // revoke previous blobs
    previewBuilder.revokeBlobUrls(previewBlobUrlsRef.current || []);
    previewBlobUrlsRef.current = blobUrls || [];
    setPreviewSrcDoc(srcDoc);

    return () => {
      previewBuilder.revokeBlobUrls(previewBlobUrlsRef.current || []);
      previewBlobUrlsRef.current = [];
    };
  }, [files, title]);

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

  return (
    <div className='playground__page__wrapper'>
      <div className='playground__nav__wrapper'>
        <PlaygroundNav htmlValue={htmlValue} cssValue={cssValue} jsValue={jsValue} title={title} setTitle={setTitle} isGuest={isGuest} id={id} owner={owner}/>
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
            isRoom={false}
          />
        </div>
        <div className='preview-pane'>
          <iframe title="myDoc" srcDoc={previewSrcDoc}></iframe>
        </div>
      </div>
    </div>
  )
}

export default Playground
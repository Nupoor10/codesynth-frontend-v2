import React, {useEffect} from 'react';
import Editor from '@monaco-editor/react';
import { FaHtml5, FaCss3Alt } from "react-icons/fa"
import { RiJavascriptFill } from "react-icons/ri";
import ACTIONS from '../../constants/Actions';
import "./CodeEditor.css"

const CodeEditor = ({codeValue, setCodeValue, isRoom, roomId, editorLang, socketRef}) => {

  const handleEditorChange = (value) => {
    setCodeValue(value);
    if(socketRef?.current && isRoom && roomId) {
      socketRef.current.emit(ACTIONS.CODE_CHANGE, {editorLang, code: value, room: roomId})
    }
  }

  useEffect(() => {
    if (socketRef?.current && isRoom && roomId) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({lang, code}) => {
        if (lang === editorLang && code !== null) {
          setCodeValue(code);
        }
      });
    }

    return () => {
        socketRef?.current?.off(ACTIONS.CODE_CHANGE);
    };
  }, [socketRef?.current, isRoom, roomId]);

  return (
    <div className='code__editor__component'>
      <div className='editor__toolbar'>
        <h5>
            {editorLang === "html" ? 
            (<FaHtml5 />) : editorLang === "css" ? 
            (<FaCss3Alt />) : (<RiJavascriptFill />)}
            {editorLang.toUpperCase()}
        </h5>
      </div>
      <Editor
        defaultLanguage={editorLang}
        theme='vs-dark'
        value={codeValue}
        onChange={handleEditorChange}
      />
    </div>
  )
}

export default CodeEditor;
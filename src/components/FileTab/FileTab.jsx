import React from 'react';
import { FaHtml5, FaCss3Alt } from 'react-icons/fa';
import { RiJavascriptFill } from 'react-icons/ri';
import './FileTab.css';

const FileTab = ({ file }) => {
  if (!file) {
    return (
      <div className="file-tab empty">
        <span>No file selected</span>
      </div>
    );
  }

  const getFileIcon = (extension) => {
    switch (extension) {
      case 'html':
        return <FaHtml5 style={{ color: '#e34c26' }} />;
      case 'css':
        return <FaCss3Alt style={{ color: '#563d7c' }} />;
      case 'js':
        return <RiJavascriptFill style={{ color: '#f7df1e' }} />;
      default:
        return <span>📄</span>;
    }
  };

  return (
    <div className="file-tab">
      <div className="file-tab-icon">
        {getFileIcon(file.extension)}
      </div>
      <div className="file-tab-info">
        <div className="file-tab-name">{file.name}</div>
        <div className="file-tab-extension">.{file.extension}</div>
      </div>
    </div>
  );
};

export default FileTab;

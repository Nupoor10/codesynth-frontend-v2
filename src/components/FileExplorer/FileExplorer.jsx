import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FaHtml5, FaCss3Alt, FaTrash, FaTimes, FaPlus } from "react-icons/fa";
import { RiJavascriptFill } from "react-icons/ri";
import "./FileExplorer.css";

const FileExplorer = ({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileExtension, setNewFileExtension] = useState("");
  const [createError, setCreateError] = useState("");
  const [renamingFileId, setRenamingFileId] = useState(null);
  const [renamingFileName, setRenamingFileName] = useState("");

  const getFileIcon = (extension) => {
    switch (extension) {
      case "html":
        return <FaHtml5 style={{ color: "#e34c26" }} />;
      case "css":
        return <FaCss3Alt style={{ color: "#563d7c" }} />;
      case "js":
        return <RiJavascriptFill style={{ color: "#f7df1e" }} />;
      default:
        return <span>📄</span>;
    }
  };

  const handleCreateFile = () => {
    const nameTrimmed = newFileName.trim();
    if (!nameTrimmed) {
      setCreateError(
        "Please provide a file name with extension (e.g. about.html)",
      );
      return;
    }

    if (!nameTrimmed.includes(".")) {
      setCreateError("Please include an extension (e.g. about.html)");
      return;
    }

    const parts = nameTrimmed.split(".");
    const ext = parts.pop().toLowerCase();
    const name = parts.join(".") + "." + ext;

    if (!["html", "css", "js"].includes(ext)) {
      setCreateError("Invalid extension. Supported: html, css, js");
      return;
    }

    const exists = files.some(
      (f) => f.name.toLowerCase() === name.toLowerCase(),
    );
    if (exists) {
      setCreateError("File with this name already exists");
      return;
    }

    setCreateError("");
    onCreateFile({ name, extension: ext });
    setNewFileName("");
    setNewFileExtension("");
    setIsCreating(false);
  };

  const getBaseName = (name) => {
    const index = name.lastIndexOf(".");
    return index !== -1 ? name.slice(0, index) : name;
  };

  const protectedFileNames = ["index.html"];

  const handleRenameFile = (fileId, extension) => {
    const newName = renamingFileName.trim();
    if (!newName) {
      setRenamingFileId(null);
      setRenamingFileName("");
      return;
    }

    if (
      newName !== getBaseName(files.find((f) => f.id === fileId)?.name || "")
    ) {
      onRenameFile(fileId, `${newName}.${extension}`);
    }
    setRenamingFileId(null);
    setRenamingFileName("");
  };

  const sortedFiles = [...files].sort((a, b) => a.order - b.order);

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <h3>Files</h3>
        <button
          className="btn-create-file"
          onClick={() => setIsCreating(true)}
          title="Create new file"
        >
          <FaPlus />
        </button>
      </div>

      {isCreating &&
        createPortal(
          <div className="fe-modal-overlay">
            <div className="fe-modal">
              <button
                className="fe-modal-close"
                onClick={() => {
                  setIsCreating(false);
                  setCreateError("");
                  setNewFileName("");
                }}
                aria-label="Close"
              >
                <FaTimes />
              </button>
              <h4>Create new file</h4>
              <input
                type="text"
                placeholder="e.g. about.html"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFile();
                  if (e.key === "Escape") {
                    setIsCreating(false);
                    setCreateError("");
                  }
                }}
                autoFocus
              />

              {createError && <div className="create-error">{createError}</div>}

              <div className="fe-modal-actions">
                <button
                  onClick={handleCreateFile}
                  className="btn-create"
                  aria-label="Create file"
                >
                  Create
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <div className="files-list">
        {sortedFiles.map((file) => (
          <div key={file.id} className="file-item">
            {renamingFileId === file.id ? (
              <div className="file-rename-form">
                <input
                  type="text"
                  value={renamingFileName}
                  onChange={(e) => setRenamingFileName(e.target.value)}
                  onBlur={() => handleRenameFile(file.id, file.extension)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      handleRenameFile(file.id, file.extension);
                    if (e.key === "Escape") {
                      setRenamingFileId(null);
                      setRenamingFileName("");
                    }
                  }}
                  autoFocus
                />
                <span className="rename-extension">.{file.extension}</span>
              </div>
            ) : (
              <>
                <div
                  className={`file-item-content ${activeFileId === file.id ? "active" : ""}`}
                  onClick={() => onSelectFile(file.id)}
                >
                  <span className="file-icon">
                    {getFileIcon(file.extension)}
                  </span>
                  <span className="file-name">{file.name}</span>
                </div>
                <div className="file-actions">
                  {!protectedFileNames.includes(file.name) && (
                    <button
                      className="btn-rename"
                      onClick={() => {
                        setRenamingFileId(file.id);
                        setRenamingFileName(getBaseName(file.name));
                      }}
                      title="Rename file"
                    >
                      ✎
                    </button>
                  )}
                  {!protectedFileNames.includes(file.name) && (
                    <button
                      className="btn-delete"
                      onClick={() => onDeleteFile(file.id)}
                      title="Delete file"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileExplorer;

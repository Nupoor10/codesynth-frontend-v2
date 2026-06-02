import React, { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";
import toast from "react-hot-toast";
import axios from "axios";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import CollabNav from "../../components/PlaygroundNav/CollabNav";
import FileExplorer from "../../components/FileExplorer/FileExplorer";
import CodeEditor from "../../components/CodeEditor/CodeEditor";
import Whiteboard from "../../components/Whiteboard/Whiteboard";
import DraggableResizableModal from "../../components/Modal/DraggableResizableModal";
import { useAuthContext } from "../../hooks/useAuthContext";
import ACTIONS from "../../constants/Actions";
import { FiMaximize2, FiMinimize2 } from "react-icons/fi";
import { initSocket } from "../../socket";
import "./Playground.css";
import previewBuilder from "../../utils/previewBuilder";

const apiURL = import.meta.env.VITE_BACKEND_URL;

const CollabPlayground = () => {
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [title, setTitle] = useState("");
  const [isRoom, setIsRoom] = useState(false);
  const [whiteboardData, setWhiteboardData] = useState("");
  const [isBrainstormOpen, setIsBrainstormOpen] = useState(false);
  const [owner, setOwner] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeClients, setActiveClients] = useState([]);
  const [previewSrcDoc, setPreviewSrcDoc] = useState("");
  const [canonicalRoomId, setCanonicalRoomId] = useState("");

  const { user } = useAuthContext();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const whiteboardSaveRef = useRef(null);
  const socketRef = useRef(null);
  const ydocRef = useRef(null);
  const yProviderRef = useRef(null);
  const yFileContentsRef = useRef(null);
  const yTextObserversRef = useRef(new Map());
  const saveTimeoutsRef = useRef(new Map());

  const filesRef = useRef([]);
  const activeFileIdRef = useRef(null);
  const previewBlobUrlsRef = useRef([]);
  const previewTimeoutRef = useRef(null);

  const openBrainstorm = () => setIsBrainstormOpen(true);
  const closeBrainstorm = () => setIsBrainstormOpen(false);

  const handleSocketErrors = (error) => {
    console.error("Socket error:", error);
    toast.error("Real-time connection failed. Please refresh or try again.");
  };

  const initializeRealTimeChannels = async (loadedFiles, canonicalRoomId) => {
    if (ydocRef.current || socketRef.current) return;

    console.log(
      `🎯 Connecting both engines to Channel Room: ${canonicalRoomId}`,
    );

    const doc = new Y.Doc();
    ydocRef.current = doc;
    yProviderRef.current = new WebsocketProvider(
      getYjsEndpoint(),
      canonicalRoomId,
      doc,
    );
    yFileContentsRef.current = doc.getMap("fileContents");
    console.debug("[yjs] initialized yFileContents map", {
      room: canonicalRoomId,
      keys: Array.from(yFileContentsRef.current.keys()),
    });

    loadedFiles.forEach((file) => {
      const fileId = file.id || file._id;
      let yText = yFileContentsRef.current.get(fileId);

      if (!yText) {
        yText = new Y.Text();
        if (file.content) {
          yText.insert(0, file.content);
        }
        yFileContentsRef.current.set(fileId, yText);
      }

      console.debug("[yjs] attaching yText observer", { fileId });
      attachYTextObserver(fileId, yText);
    });

    yFileContentsRef.current.observeDeep((events) => {
      console.debug("[yjs-sync] Global map background modification heard");

      events.forEach((event) => {
        if (event.target instanceof Y.Text) {
          for (const [fileId, yText] of yFileContentsRef.current.entries()) {
            if (yText === event.target) {
              const currentTextContent = yText.toString();

              if (filesRef.current) {
                filesRef.current = filesRef.current.map((f) =>
                  f.id === fileId ? { ...f, content: currentTextContent } : f,
                );
              }
              break;
            }
          }
        }
      });

      schedulePreviewRebuild();
    });

    yProviderRef.current.on("sync", (isSynced) => {
      console.debug("[yjs] provider sync", {
        room: canonicalRoomId,
        isSynced,
        time: Date.now(),
      });
      if (isSynced) rebuildPreview();
    });

    socketRef.current = await initSocket();
    socketRef.current.on(ACTIONS.CONNECT_ERROR, handleSocketErrors);
    socketRef.current.on(ACTIONS.CONNECT_FAILED, handleSocketErrors);

    socketRef.current.on(ACTIONS.NEW_JOIN, ({ username, clients }) => {
      console.debug("[socket] NEW_JOIN received", { username, clients });
      if (user?.name !== username) toast.success(`${username} joined the room`);
      setActiveClients(Array.from(new Set(clients.map((c) => String(c)))));
    });

    socketRef.current.on(ACTIONS.DISCONNECTED, ({ username, clients }) => {
      console.debug("[socket] DISCONNECTED received", { username, clients });
      if (user?.name !== username) toast.error(`${username} left the room`);
      if (clients) {
        setActiveClients(Array.from(new Set(clients.map((c) => String(c)))));
      }
    });

    socketRef.current.on(ACTIONS.FILE_CREATE, ({ file }) => {
      console.debug("[socket] FILE_CREATE received", { fileId: file?.id });
      setFiles((prev) => {
        if (prev.some((f) => f.id === file.id)) return prev;

        if (
          yFileContentsRef.current &&
          !yFileContentsRef.current.has(file.id)
        ) {
          const yText = new Y.Text();
          yText.insert(0, file.content || "");
          yFileContentsRef.current.set(file.id, yText);
          console.debug(
            "[yjs] FILE_CREATE - attaching yText observer for new file",
            { fileId: file.id },
          );
          attachYTextObserver(file.id, yText);
        }
        return [...prev, file];
      });
      setTimeout(() => schedulePreviewRebuild(), 100);
    });

    socketRef.current.emit(ACTIONS.JOIN_ROOM, {
      roomId: canonicalRoomId,
      username: user?.name,
      dbUserId: user?._id || user?.id,
    });
    console.debug("[socket] emitted JOIN_ROOM", {
      roomId: canonicalRoomId,
      username: user?.name,
    });

    socketRef.current.on(ACTIONS.FILE_DELETE, ({ fileId }) => {
      console.debug("[socket] FILE_DELETE received", { fileId });
      setFiles((prev) => {
        const filtered = prev.filter((f) => f.id !== fileId);
        if (activeFileIdRef.current === fileId) {
          setActiveFileId(filtered[0]?.id || null);
        }
        return filtered;
      });

      if (yFileContentsRef.current) {
        const yText = yFileContentsRef.current.get(fileId);
        const cb = yTextObserversRef.current.get(fileId);
        if (yText && cb) {
          try {
            yText.unobserve(cb);
          } catch (e) {}
          yTextObserversRef.current.delete(fileId);
        }
        yFileContentsRef.current.delete(fileId);
      }
      setTimeout(() => schedulePreviewRebuild(), 100);
    });

    socketRef.current.on(ACTIONS.FILE_RENAME, ({ fileId, name }) => {
      console.debug("[socket] FILE_RENAME received", { fileId, name });
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, name } : f)),
      );
    });

    socketRef.current.on("WORKSPACE_SAVED_BROADCAST", ({ username }) => {
      console.debug(
        "[socket] WORKSPACE_SAVED_BROADCAST received from",
        username,
      );
      if (user?.name !== username) {
        toast.success(`Workspace has been successfully saved by ${username}!`);
      }
    });
  };

  const cleanupRealTimeChannels = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.removeAllListeners();
      socketRef.current = null;
    }
    if (yProviderRef.current) {
      try {
        yProviderRef.current.disconnect();
        yProviderRef.current.destroy();
      } catch (e) {}
      yProviderRef.current = null;
    }
    if (ydocRef.current) {
      try {
        ydocRef.current.destroy();
      } catch (e) {}
      ydocRef.current = null;
    }
    console.log("🧹 Real-time tracking channels completely wiped");
  };

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    activeFileIdRef.current = activeFileId;
  }, [activeFileId]);

  useEffect(() => {
    const fetchCode = async () => {
      if (!id || !user) return;
      try {
        const config = { headers: { Authorization: user?.accessToken } };

        const roomResponse = await axios.get(
          `${apiURL}/rooms/get/${id}`,
          config,
        );
        let extractedRoomStringId = id;

        if (
          roomResponse &&
          roomResponse.status === 200 &&
          roomResponse.data.userRoom
        ) {
          extractedRoomStringId = roomResponse.data.userRoom.roomId;
        }

        const response = await axios.get(`${apiURL}/codes/get/${id}`, config);

        if (response && response.status === 200) {
          const codeDoc = response.data.codeDoc || response.data.code;
          if (!codeDoc) throw new Error("Workspace files missing");

          const loadedFiles = codeDoc.files || [];
          setFiles(loadedFiles);

          if (loadedFiles.length > 0) {
            setActiveFileId(loadedFiles[0].id);
          }

          setTitle(codeDoc.title || "Untitled");
          setIsRoom(Boolean(codeDoc.isRoom));
          setWhiteboardData(codeDoc.whiteboardData || "");
          setOwner(codeDoc.owner?.username || "Unknown");

          if (codeDoc.owner?.username === user.name) {
            setIsAdmin(true);
          }

          setCanonicalRoomId(extractedRoomStringId);

          initializeRealTimeChannels(loadedFiles, extractedRoomStringId);
        }
      } catch (error) {
        console.error("Critical alignment failure:", error);
        toast.error("Failed to initialize collaborative environment keys");
      }
    };

    fetchCode();

    return () => {
      cleanupRealTimeChannels();
    };
  }, [id, user]);

  const getYjsEndpoint = () => {
    if (import.meta.env.VITE_YJS_URL) {
      return import.meta.env.VITE_YJS_URL.replace(/\/$/, "");
    }
    return "ws://localhost:4040/yjs";
  };

  const persistFileContent = async (fileId, content) => {
    if (!user || !fileId) return;
    try {
      const config = { headers: { Authorization: user?.accessToken } };
      await axios.put(
        `${apiURL}/codes/${id}/files/${fileId}`,
        { content },
        config,
      );
    } catch (error) {
      console.error("Failed backend background saving persistence:", error);
    }
  };

  const scheduleSave = (fileId, content) => {
    if (!fileId) return;
    const existingTimeout = saveTimeoutsRef.current.get(fileId);
    if (existingTimeout) clearTimeout(existingTimeout);

    const timeout = setTimeout(() => {
      persistFileContent(fileId, content);
      saveTimeoutsRef.current.delete(fileId);
    }, 1500);

    saveTimeoutsRef.current.set(fileId, timeout);
  };

  const rebuildPreview = () => {
    const source = filesRef.current;
    if (!source || source.length === 0) return;

    console.debug("[preview] rebuildPreview start", {
      time: Date.now(),
      files: source.map((f) => f.id),
    });

    const contentFiles = source.map((f) => {
      const yText = yFileContentsRef.current?.get(f.id);
      return { ...f, content: yText ? yText.toString() : f.content };
    });

    const { srcDoc, blobUrls } = previewBuilder.buildPreview(
      contentFiles,
      undefined,
      title,
    );
    previewBuilder.revokeBlobUrls(previewBlobUrlsRef.current || []);
    previewBlobUrlsRef.current = blobUrls || [];
    setPreviewSrcDoc(srcDoc);
    console.debug("[preview] rebuildPreview done", {
      time: Date.now(),
      blobCount: (blobUrls || []).length,
    });
  };

  const schedulePreviewRebuild = () => {
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    previewTimeoutRef.current = window.setTimeout(() => {
      rebuildPreview();
    }, 400);
  };

  const attachYTextObserver = (fileId, yText) => {
    if (!yText || yTextObserversRef.current.has(fileId)) {
      console.debug("[ytext] attach skipped", {
        fileId,
        hasYText: !!yText,
        alreadyObserved: yTextObserversRef.current.has(fileId),
      });
      return;
    }
    const cb = () => {
      const content = yText.toString();
      console.debug("[ytext] change detected via Yjs", {
        fileId,
        len: content.length,
      });

      if (filesRef.current) {
        filesRef.current = filesRef.current.map((f) =>
          f.id === fileId ? { ...f, content } : f,
        );
      }

      scheduleSave(fileId, content);
      schedulePreviewRebuild();
    };
    yText.observe(cb);
    yTextObserversRef.current.set(fileId, cb);
    console.debug("[ytext] observer attached cleanly", { fileId });
  };

  const initializeYjs = (loadedFiles, roomId) => {
    if (!roomId || ydocRef.current) return;

    const doc = new Y.Doc();
    ydocRef.current = doc;
    yProviderRef.current = new WebsocketProvider(getYjsEndpoint(), roomId, doc);

    yFileContentsRef.current = doc.getMap("fileContents");

    loadedFiles.forEach((file) => {
      if (!yFileContentsRef.current.has(file.id)) {
        const yText = new Y.Text();
        yText.insert(0, file.content || "");
        yFileContentsRef.current.set(file.id, yText);
      }
      const yText = yFileContentsRef.current.get(file.id);
      attachYTextObserver(file.id, yText);
    });

    yProviderRef.current.on("sync", (isSynced) => {
      if (isSynced) rebuildPreview();
    });
  };

  useEffect(() => {
    return () => {
      if (yProviderRef.current) {
        try {
          yProviderRef.current.disconnect();
          yProviderRef.current.destroy();
        } catch (e) {}
        yProviderRef.current = null;
      }
      if (ydocRef.current) {
        try {
          ydocRef.current.destroy();
        } catch (e) {}
        ydocRef.current = null;
      }
    };
  }, [id]);

  const handleCreateFile = async (fileData) => {
    try {
      const config = { headers: { Authorization: user?.accessToken } };
      const response = await axios.post(
        `${apiURL}/codes/${id}/files`,
        fileData,
        config,
      );
      if (response.status === 201) {
        const newFile = response.data.file;

        setFiles((prev) => {
          if (prev.some((f) => f.id === newFile.id)) return prev;
          return [...prev, newFile];
        });
        setActiveFileId(newFile.id);

        if (
          yFileContentsRef.current &&
          !yFileContentsRef.current.has(newFile.id)
        ) {
          const yText = new Y.Text();
          yText.insert(0, newFile.content || "");
          yFileContentsRef.current.set(newFile.id, yText);
          attachYTextObserver(newFile.id, yText);
        }

        const activeRoomId = canonicalRoomId || location?.state?.roomId || id;
        if (socketRef.current && socketRef.current.connected) {
          console.debug("[socket] emitting FILE_CREATE", {
            fileId: newFile.id,
            room: activeRoomId,
          });
          socketRef.current.emit(ACTIONS.FILE_CREATE, {
            file: newFile,
            room: activeRoomId,
          });
        }
        setTimeout(() => schedulePreviewRebuild(), 100);
      }
    } catch (error) {
      toast.error("Failed to create file");
    }
  };

  const handleUpdateFile = async (fileId, content) => {
    if (filesRef.current) {
      filesRef.current = filesRef.current.map((f) =>
        f.id === fileId ? { ...f, content } : f,
      );
    }

    const isUsingMonacoBinding =
      isRoom && yFileContentsRef.current?.has(fileId);
    if (!isUsingMonacoBinding) {
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, content } : f)),
      );
    } else {
      scheduleSave(fileId, content);
    }

    console.debug("[file] schedule preview rebuild after update", { fileId });
    schedulePreviewRebuild();
  };

  const handleRenameFile = async (fileId, newName) => {
    try {
      const config = { headers: { Authorization: user?.accessToken } };
      const response = await axios.put(
        `${apiURL}/codes/${id}/files/${fileId}`,
        { name: newName },
        config,
      );
      if (response.status === 200) {
        const extension = newName.split(".").pop();

        if (filesRef.current) {
          filesRef.current = filesRef.current.map((f) =>
            f.id === fileId
              ? { ...f, name: newName, extension: extension || f.extension }
              : f,
          );
        }

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, name: newName, extension: extension || f.extension }
              : f,
          ),
        );

        const activeRoomId = canonicalRoomId || location?.state?.roomId || id;
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit(ACTIONS.FILE_RENAME, {
            fileId,
            name: newName,
            room: activeRoomId,
          });
        }
      }
    } catch (error) {
      toast.error("Failed to rename file");
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      const config = { headers: { Authorization: user?.accessToken } };
      const response = await axios.delete(
        `${apiURL}/codes/${id}/files/${fileId}`,
        config,
      );
      if (response.status === 200) {
        setFiles((prev) => {
          const filtered = prev.filter((f) => f.id !== fileId);
          if (activeFileIdRef.current === fileId) {
            setActiveFileId(filtered[0]?.id || null);
          }
          return filtered;
        });

        if (yFileContentsRef.current) {
          const yText = yFileContentsRef.current.get(fileId);
          const cb = yTextObserversRef.current.get(fileId);
          if (yText && cb) {
            try {
              yText.unobserve(cb);
            } catch (e) {}
            yTextObserversRef.current.delete(fileId);
          }
          yFileContentsRef.current.delete(fileId);
        }

        const activeRoomId = canonicalRoomId || location?.state?.roomId || id;
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit(ACTIONS.FILE_DELETE, {
            fileId,
            room: activeRoomId,
          });
        }
        setTimeout(() => schedulePreviewRebuild(), 100);
      }
    } catch (error) {
      toast.error("Failed to delete file");
    }
  };

  const activeFile = files.find((f) => f.id === activeFileId);

  return (
    <div className="playground__page__wrapper">
      <div className="playground__nav__wrapper">
        <CollabNav
          title={title}
          setTitle={setTitle}
          roomId={canonicalRoomId || id}
          isAdmin={isAdmin}
          id={id}
          owner={owner}
          handleDisconnect={() => navigate("/collab")}
          clients={activeClients}
          onSaveWhiteboard={() => whiteboardSaveRef.current?.()}
          onOpenBrainstorm={openBrainstorm}
          socket={socketRef.current}
        />
      </div>
      <div
        className={`playground__editor__container ${
          isPreviewMode ? "preview-mode" : ""
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
            isRoom={isRoom}
            yProvider={yProviderRef.current}
            yFileContents={yFileContentsRef.current}
          />
        </div>

        <div className="preview-pane">
          <iframe title="myDoc" srcDoc={previewSrcDoc} />
        </div>
      </div>

      <DraggableResizableModal
        isOpen={isBrainstormOpen}
        closeModal={closeBrainstorm}
        title="Brainstorm Board"
      >
        <Whiteboard
          isRoom={isRoom}
          yDoc={ydocRef.current}
          id={id}
          initialData={whiteboardData}
          whiteboardSaveRef={whiteboardSaveRef}
          apiURL={apiURL}
          accessToken={user?.accessToken}
        />
      </DraggableResizableModal>
    </div>
  );
};

export default CollabPlayground;

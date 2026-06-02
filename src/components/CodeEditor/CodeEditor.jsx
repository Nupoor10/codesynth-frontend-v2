import React, { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import FileTab from "../FileTab/FileTab";
import "./CodeEditor.css";

const editorOptions = {
  minimap: { enabled: true },
  cursorBlinking: "smooth",
  cursorSmoothCaretAnimation: "on",
  smoothScrolling: true,
  formatOnPaste: true,
  formatOnType: true,
  autoClosingBrackets: "always",
  autoClosingQuotes: "always",
  autoSurround: "languageDefined",
  fontSize: 14,
  fontFamily: "'Fira Code', Consolas, monospace",
  fontLigatures: true,
  tabSize: 2,
  insertSpaces: true,
  wordWrap: "on",
  lineNumbersMinChars: 3,
  readOnly: false,
  contextmenu: true,
  quickSuggestions: { other: true, comments: false, strings: false },
};

const getLanguageFromExtension = (extension) => {
  if (extension === "js") return "javascript";
  return extension;
};

const CodeEditor = ({ file, onFileChange, isRoom, yProvider, yFileContents }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const modelMapRef = useRef(new Map());
  const bindingMapRef = useRef(new Map());
  const yTextObserverMapRef = useRef(new Map());
  const ignoreChangeRef = useRef(false);
  const activeFileIdRef = useRef(null);

  const getFileId = (f) => f?.id || f?._id;

  const createModelForFile = (currentFile, yText) => {
    const fileId = getFileId(currentFile);
    const language = getLanguageFromExtension(currentFile.extension);
    const uri = monacoRef.current.Uri.parse(`inmemory://model/${fileId}.${currentFile.extension}`);

    let model = monacoRef.current.editor.getModel(uri);
    if (model) return model;

    const content = yText && yText.length > 0 ? yText.toString() : currentFile.content || "";
    model = monacoRef.current.editor.createModel(content, language, uri);
    return model;
  };

  const attachEditorToFile = (currentFile) => {
    if (!editorRef.current || !monacoRef.current || !currentFile) return;

    const fileId = getFileId(currentFile);
    const yText = yFileContents?.get(fileId);
    let model = modelMapRef.current.get(fileId);

    if (model?.isDisposed) {
      try {
        model.dispose();
      } catch (e) {}
      modelMapRef.current.delete(fileId);
      model = null;
    }

    if (!model) {
      model = createModelForFile(currentFile, yText);
      modelMapRef.current.set(fileId, model);
    }

    const currentEditorModel = editorRef.current.getModel();
    const shouldSetModel = !currentEditorModel || currentEditorModel !== model;
    const existingBinding = bindingMapRef.current.get(fileId);
    const shouldAttachBinding = isRoom && yProvider && yText && !existingBinding;

    if (!shouldSetModel && !shouldAttachBinding) {
      activeFileIdRef.current = fileId;
      return;
    }

    bindingMapRef.current.forEach((binding, bindingFileId) => {
      if (bindingFileId !== fileId) {
        try {
          binding.destroy();
        } catch (e) {}
        bindingMapRef.current.delete(bindingFileId);
        const oldObserver = yTextObserverMapRef.current.get(bindingFileId);
        if (oldObserver) {
          try {
            const oldYText = yFileContents?.get(bindingFileId);
            if (oldYText) oldYText.unobserve(oldObserver);
          } catch (e) {}
          yTextObserverMapRef.current.delete(bindingFileId);
        }
      }
    });

    if (shouldSetModel) {
      editorRef.current.setModel(model);
    }
    activeFileIdRef.current = fileId;

    if (isRoom && yProvider && yText) {
      try {
        const existingBinding = bindingMapRef.current.get(fileId);
        if (existingBinding) {
          try {
            existingBinding.destroy();
          } catch (e) {}
          bindingMapRef.current.delete(fileId);
        }

        const binding = new MonacoBinding(yText, model, new Set([editorRef.current]), yProvider.awareness);
        bindingMapRef.current.set(fileId, binding);

        if (!yTextObserverMapRef.current.has(fileId)) {
          const observer = () => {
            try {
              const v = yText.toString();
              if (model && model.getValue() !== v) {
                ignoreChangeRef.current = true;
                model.setValue(v);
                ignoreChangeRef.current = false;
              }
            } catch (e) {}
          };
          yText.observe(observer);
          yTextObserverMapRef.current.set(fileId, observer);
        }
      } catch (e) {
        console.error("[editor] failed to create MonacoBinding on tab switch", e);
      }
    }
  };

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    attachEditorToFile(file);
  };

  useEffect(() => {
    if (editorRef.current && monacoRef.current && file) {
      const fileId = getFileId(file);
      if (activeFileIdRef.current !== fileId) attachEditorToFile(file);
    }
  }, [file?.id, file?.extension, isRoom, yProvider, yFileContents]);

  useEffect(() => {
    const fileId = getFileId(file);
    if (!fileId || !isRoom || !yProvider || !yFileContents || !editorRef.current || !monacoRef.current) return;

    let cancelled = false;
    let timeoutId = null;

    const tryAttach = () => {
      if (cancelled) return;
      const yText = yFileContents.get(fileId);
      const hasBinding = bindingMapRef.current.has(fileId);
      if (hasBinding) return;
      if (yText) {
        try {
          attachEditorToFile(file);
        } catch (e) {
          console.error("[editor] tryAttach error", e);
        }
        return;
      }
      timeoutId = setTimeout(tryAttach, 100);
    };

    tryAttach();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [file, isRoom, yProvider, yFileContents]);

  useEffect(() => {
    if (!file || !editorRef.current || !monacoRef.current) return;
    const fileId = getFileId(file);
    const model = modelMapRef.current.get(fileId);
    if (!model) return;

    const isBound = bindingMapRef.current.has(fileId);
    if (isBound) return;

    const yText = yFileContents?.get(fileId);
    const expectedValue = yText ? yText.toString() : file.content || "";
    const currentValue = model.getValue();

    if (currentValue !== expectedValue) {
      ignoreChangeRef.current = true;
      try {
        model.setValue(expectedValue);
      } finally {
        ignoreChangeRef.current = false;
      }
    }
  }, [file?.content, file?.id, yFileContents]);

  useEffect(() => {
    return () => {
      bindingMapRef.current.forEach((binding) => {
        try {
          binding.destroy();
        } catch (e) {}
      });
      bindingMapRef.current.clear();

      yTextObserverMapRef.current.forEach((observer, fileId) => {
        try {
          const yText = yFileContents?.get(fileId);
          if (yText && observer) yText.unobserve(observer);
        } catch (e) {}
      });
      yTextObserverMapRef.current.clear();

      modelMapRef.current.forEach((model) => {
        try {
          model.dispose();
        } catch (e) {}
      });
      modelMapRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!file) return;
    const fileId = getFileId(file);

    const currentModel = modelMapRef.current.get(fileId);
    if (currentModel) {
      const currentUri = currentModel.uri.toString();
      const expectedUri = `inmemory://model/${fileId}.${file.extension}`;

      if (currentUri !== expectedUri) {
        console.debug("[editor] File rename detected, purging old model and binding", { fileId });

        const oldBinding = bindingMapRef.current.get(fileId);
        if (oldBinding) {
          try {
            oldBinding.destroy();
          } catch (e) {}
          bindingMapRef.current.delete(fileId);
        }

        try {
          currentModel.dispose();
        } catch (e) {}
        modelMapRef.current.delete(fileId);

        if (editorRef.current && monacoRef.current) attachEditorToFile(file);
      }
    }
  }, [file?.name, file?.extension]);

  const handleEditorChange = (value) => {
    if (ignoreChangeRef.current || !file || !onFileChange) return;
    const fileId = getFileId(file);
    const isUsingMonacoBinding = isRoom && yProvider && yFileContents?.has(fileId);
    if (isUsingMonacoBinding) return;
    onFileChange(fileId, value);
  };

  if (!file) {
    return (
      <div className="code__editor__component">
        <div className="editor__placeholder">
          <p>Select a file to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="code__editor__component">
      <FileTab file={file} />
      <Editor
        language={getLanguageFromExtension(file.extension)}
        theme="vs-dark"
        onMount={handleEditorMount}
        onChange={handleEditorChange}
        options={editorOptions}
      />
    </div>
  );
};

export default CodeEditor;

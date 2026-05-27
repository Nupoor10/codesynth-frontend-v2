import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';
import FileTab from '../FileTab/FileTab';
import './CodeEditor.css';

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
  quickSuggestions: { other: true, comments: false, strings: false }
};

const getLanguageFromExtension = (extension) => {
  if (extension === 'js') return 'javascript';
  return extension;
};

const CodeEditor = ({ file, onFileChange, isRoom, yProvider, yFileContents }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const modelMapRef = useRef(new Map());
  const bindingMapRef = useRef(new Map());
  const ignoreChangeRef = useRef(false); // Prevents infinite cursor echoing loops

  const createModelForFile = (currentFile, yText) => {
    console.debug('[editor] createModelForFile', { fileId: currentFile?.id, hasYText: !!yText });
    const language = getLanguageFromExtension(currentFile.extension);
    const uri = monacoRef.current.Uri.parse(`inmemory://model/${currentFile.id}.${currentFile.extension}`);
    const content = yText ? yText.toString() : (currentFile.content || '');
    const model = monacoRef.current.editor.createModel(content, language, uri);
    console.debug('[editor] model created', { fileId: currentFile?.id, modelId: model?.id, modelDisposed: model?.isDisposed });
    return model;
  };

  const attachEditorToFile = (currentFile) => {
    if (!editorRef.current || !monacoRef.current || !currentFile) return;

    const yText = yFileContents?.get(currentFile.id);
    let model = modelMapRef.current.get(currentFile.id);

    if (model?.isDisposed) {
      try { model.dispose(); } catch (e) {}
      modelMapRef.current.delete(currentFile.id);
      model = null;
    }

    if (!model) {
      model = createModelForFile(currentFile, yText);
      modelMapRef.current.set(currentFile.id, model);
    }

    console.debug('[editor] setting model on editor', { fileId: currentFile.id });
    editorRef.current.setModel(model);

    // Bind Yjs room collaborative text instance to the Monaco model safely
    if (isRoom && yProvider && yText && !bindingMapRef.current.has(currentFile.id)) {
      try {
        console.debug('[editor] creating MonacoBinding', { fileId: currentFile.id });
        const binding = new MonacoBinding(yText, model, new Set([editorRef.current]), yProvider.awareness);
        bindingMapRef.current.set(currentFile.id, binding);
        console.debug('[editor] MonacoBinding created', { fileId: currentFile.id });
      } catch (e) {
        console.error('[editor] failed to create MonacoBinding', e);
      }
    } else {
      console.debug('[editor] skipping binding creation', { fileId: currentFile.id, isRoom, hasYProvider: !!yProvider, hasYText: !!yText, hasBinding: bindingMapRef.current.has(currentFile.id) });
    }
  };

  const handleEditorMount = (editor, monaco) => {
    console.debug('[editor] onMount', { fileId: file?.id });
    editorRef.current = editor;
    monacoRef.current = monaco;
    attachEditorToFile(file);
  };

  useEffect(() => {
    if (editorRef.current && monacoRef.current && file?.id) {
      attachEditorToFile(file);
    }
  }, [file?.id, isRoom, yProvider, yFileContents]);

  // If the Yjs text for this file appears after the editor mounted (race condition),
  // retry attaching the editor -> model -> MonacoBinding until it's available.
  useEffect(() => {
    if (!file?.id || !isRoom || !yProvider || !editorRef.current || !monacoRef.current) return;

    let cancelled = false;
    let timeoutId = null;

    const tryAttach = () => {
      if (cancelled) return;
      const yText = yFileContents?.get?.(file.id);
      const hasBinding = bindingMapRef.current.has(file.id);
      console.debug('[editor] tryAttach', { fileId: file.id, hasYText: !!yText, hasBinding });
      
      // If binding already exists, stop retrying
      if (hasBinding) {
        console.debug('[editor] binding already exists, stopping retry', { fileId: file.id });
        return;
      }
      
      if (yText) {
        try {
          attachEditorToFile(file);
          console.debug('[editor] tryAttach - attached', { fileId: file.id });
        } catch (e) {
          console.error('[editor] tryAttach error', e);
        }
        return;
      }
      // Retry shortly until the Y.Text appears or component unmounts
      timeoutId = setTimeout(tryAttach, 150);
    };

    tryAttach();

    return () => { 
      cancelled = true; 
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [file?.id, isRoom, yProvider]);

  // Clean up all shared bindings and models strictly on unmount
  useEffect(() => {
    return () => {
      bindingMapRef.current.forEach((binding) => {
        try { binding.destroy(); } catch (e) {}
      });
      bindingMapRef.current.clear();
      modelMapRef.current.forEach((model) => {
        try { model.dispose(); } catch (e) {}
      });
      modelMapRef.current.clear();
    };
  }, []);

  // Propagate text changes back to state and trigger preview rebuild
  const handleEditorChange = (value) => {
    console.debug('[editor] onChange fired', { fileId: file?.id, len: (value||'').length });
    if (ignoreChangeRef.current) return;
    if (!file || !onFileChange) return;

    const hasRoomBinding = isRoom && yProvider && yFileContents?.has(file.id);
    console.debug('[editor] hasRoomBinding?', { fileId: file?.id, hasRoomBinding });
    
    // Always call onFileChange to trigger preview rebuild and state updates
    // When hasRoomBinding is true, onFileChange will skip yText updates since MonacoBinding handles sync
    onFileChange(file.id, value);
  };

  if (!file) {
    return (
      <div className='code__editor__component'>
        <div className='editor__placeholder'>
          <p>Select a file to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className='code__editor__component'>
      <FileTab file={file} />
      <Editor
        language={getLanguageFromExtension(file.extension)}
        theme='vs-dark'
        onMount={handleEditorMount}
        onChange={handleEditorChange}
        options={editorOptions}
      />
    </div>
  );
};

export default CodeEditor;
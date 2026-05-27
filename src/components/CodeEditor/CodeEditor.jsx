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
  const ignoreChangeRef = useRef(false);

  // Helper utility resolving identifier fallback variations (id vs _id)
  const getFileId = (f) => f?.id || f?._id;

  const createModelForFile = (currentFile, yText) => {
    const fileId = getFileId(currentFile);
    console.debug('[editor] createModelForFile', { fileId, hasYText: !!yText });
    
    const language = getLanguageFromExtension(currentFile.extension);
    const uri = monacoRef.current.Uri.parse(`inmemory://model/${fileId}.${currentFile.extension}`);
    
    // 💡 FIX: If a model already exists at this URI, reuse it instead of throwing a conflict or blanking out
    let model = monacoRef.current.editor.getModel(uri);
    if (model) {
      return model;
    }

    // Prioritize text from Yjs if it exists, otherwise fall back to database string content
    const content = yText && yText.length > 0 ? yText.toString() : (currentFile.content || '');
    model = monacoRef.current.editor.createModel(content, language, uri);
    
    return model;
  };

  const attachEditorToFile = (currentFile) => {
    if (!editorRef.current || !monacoRef.current || !currentFile) return;

    const fileId = getFileId(currentFile);
    const yText = yFileContents?.get(fileId);
    let model = modelMapRef.current.get(fileId);

    if (model?.isDisposed) {
      try { model.dispose(); } catch (e) {}
      modelMapRef.current.delete(fileId);
      model = null;
    }

    if (!model) {
      model = createModelForFile(currentFile, yText);
      modelMapRef.current.set(fileId, model);
    }

    console.debug('[editor] setting model on editor', { fileId });
    editorRef.current.setModel(model);

    // Bind Yjs room collaborative text instance to the Monaco model safely
    if (isRoom && yProvider && yText) {
      try {
        // 💡 FIX: Clear out any existing stale binding for this file 
        // to ensure the new active editor model attaches to the Yjs stream cleanly
        const existingBinding = bindingMapRef.current.get(fileId);
        if (existingBinding) {
          try { existingBinding.destroy(); } catch (e) {}
          bindingMapRef.current.delete(fileId);
        }

        console.debug('[editor] Creating fresh MonacoBinding for tab switch', { fileId });
        
        // Map the current editor instance directly to the newly swapped model
        const binding = new MonacoBinding(yText, model, new Set([editorRef.current]), yProvider.awareness);
        bindingMapRef.current.set(fileId, binding);
        
        console.debug('[editor] MonacoBinding successfully attached to swapped tab', { fileId });
      } catch (e) {
        console.error('[editor] failed to create MonacoBinding on tab switch', e);
      }
    }
  };

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    attachEditorToFile(file);
  };

  // Main attachment loop triggers handles file selection changes
  useEffect(() => {
    if (editorRef.current && monacoRef.current && file) {
      attachEditorToFile(file);
    }
  }, [file, isRoom, yProvider, yFileContents]);

  // Race condition guard: Checks if yText initialized late
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
          console.error('[editor] tryAttach error', e);
        }
        return;
      }
      
      // Keep polling until shared text arrives or tab unmounts
      timeoutId = setTimeout(tryAttach, 100);
    };

    tryAttach();

    return () => { 
      cancelled = true; 
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [file, isRoom, yProvider, yFileContents]);

  // Memory cleanup hook handles clean unmount lifecycles
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

  // 💡 FIX: Watch for file renames and clean up the old model/binding instantly
  useEffect(() => {
    if (!file) return;
    const fileId = getFileId(file);

    // Look through our active models to see if the filename/extension changed
    const currentModel = modelMapRef.current.get(fileId);
    if (currentModel) {
      const currentUri = currentModel.uri.toString();
      const expectedUri = `inmemory://model/${fileId}.${file.extension}`;

      // If the current URI doesn't match the new extension/name, purge it
      if (currentUri !== expectedUri) {
        console.debug('[editor] File rename detected, purging old model and binding', { fileId });

        // 1. Destroy old Yjs binding
        const oldBinding = bindingMapRef.current.get(fileId);
        if (oldBinding) {
          try { oldBinding.destroy(); } catch (e) {}
          bindingMapRef.current.delete(fileId);
        }

        // 2. Dispose of old Monaco model
        try { currentModel.dispose(); } catch (e) {}
        modelMapRef.current.delete(fileId);

        // 3. Force re-attach with new name
        if (editorRef.current && monacoRef.current) {
          attachEditorToFile(file);
        }
      }
    }
  }, [file?.name, file?.extension]); // Triggers instantly when name or extension updates

  const handleEditorChange = (value) => {
    if (ignoreChangeRef.current || !file || !onFileChange) return;
    const fileId = getFileId(file);
    onFileChange(fileId, value);
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
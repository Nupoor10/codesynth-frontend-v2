import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';
import FileTab from '../FileTab/FileTab';
import './CodeEditor.css';

const editorOptions = {
  // --- Accessibility & Navigation ---
  minimap: { enabled: true },       // Shows the mini map sidebar
  cursorBlinking: "smooth",         // Smooth professional cursor blinking animation
  cursorSmoothCaretAnimation: "on", // Smooth fluid cursor movement when typing
  smoothScrolling: true,            // Animates scrolling instead of jarring jumps
  
  // --- Formatting & Automation ---
  formatOnPaste: true,              // Automatically formats code blocks pasted into the editor
  formatOnType: true,               // Formats code dynamically as you type characters
  autoClosingBrackets: "always",    // Typing '(' automatically injects ')'
  autoClosingQuotes: "always",      // Typing '"' automatically injects '"'
  autoSurround: "languageDefined",  // Highlighting text and typing '(' surrounds it
  
  // --- Code Intelligence & Display ---
  fontSize: 14,                     // Set crisp UI layout typography sizing
  fontFamily: "'Fira Code', Consolas, monospace",
  fontLigatures: true,              // Enables sleek symbol rendering (e.g., converts '=>' to an arrow)
  tabSize: 2,                       // Web standard indentation spacing
  insertSpaces: true,               // Converts Tab key pressures cleanly into spaces
  wordWrap: "on",                   // Prevents horizontal scrollbars by wrapping lines down
  lineNumbersMinChars: 3,           // Keeps the line number gutter compact
  
  // --- Controls & Security ---
  readOnly: false,                  // Set true if you want to lock guest users out of editing
  contextmenu: true,                // Enables right-click menus for formatting/searching
  quickSuggestions: {
    other: true,
    comments: false,                // Disables code suggestions inside comments
    strings: false                  // Disables code suggestions inside text strings
  }
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

  const attachEditorToFile = (currentFile) => {
    if (!editorRef.current || !monacoRef.current || !currentFile) return;

    const language = getLanguageFromExtension(currentFile.extension);
    let model = modelMapRef.current.get(currentFile.id);
    const yText = yFileContents?.get(currentFile.id);

    if (!model) {
      const uri = monacoRef.current.Uri.parse(`inmemory://model/${currentFile.id}.${currentFile.extension}`);
      model = monacoRef.current.editor.createModel(currentFile.content || '', language, uri);
      modelMapRef.current.set(currentFile.id, model);
    }

    editorRef.current.setModel(model);

    if (isRoom && yProvider && yText && !bindingMapRef.current.has(currentFile.id)) {
      const binding = new MonacoBinding(yText, model, new Set([editorRef.current]), yProvider.awareness);
      bindingMapRef.current.set(currentFile.id, binding);
    }
  };

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    attachEditorToFile(file);
  };

  useEffect(() => {
    attachEditorToFile(file);
  }, [file?.id, file?.content, isRoom, yProvider, yFileContents]);

  // Clean up bindings for files that are no longer active and dispose models on unmount
  useEffect(() => {
    // remove bindings not related to current file
    bindingMapRef.current.forEach((binding, id) => {
      if (file?.id !== id) {
        try {
          binding.destroy();
        } catch (e) {
          console.warn('Failed to destroy MonacoBinding', e);
        }
        bindingMapRef.current.delete(id);
      }
    });

    return () => {
      // component unmount: destroy all bindings and dispose models
      bindingMapRef.current.forEach((binding) => {
        try { binding.destroy(); } catch (e) { /* ignore */ }
      });
      bindingMapRef.current.clear();
      modelMapRef.current.forEach((model) => {
        try { model.dispose(); } catch (e) { /* ignore */ }
      });
      modelMapRef.current.clear();
    };
  }, [file?.id]);

  const handleEditorChange = (value) => {
    if (!isRoom && file && onFileChange) {
      onFileChange(file.id, value);
    }
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
        defaultLanguage={getLanguageFromExtension(file.extension)}
        defaultValue={file.content}
        theme='vs-dark'
        onMount={handleEditorMount}
        onChange={handleEditorChange}
        options={editorOptions}
      />
    </div>
  );
};

export default CodeEditor;
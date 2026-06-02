# CodeSynth Frontend

A Vite-powered React frontend for the CodeSynth collaboration platform. Supports authenticated code playgrounds, live preview, shared collaborative rooms, and persisted whiteboard state.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Built With](#built-with)
- [Screenshots](#screenshots)
- [Local Setup](#local-setup)
  - [Prerequisites](#prerequisites)
  - [Environment](#environment)
  - [Run locally](#run-locally)
- [Notes](#notes)

## Overview

This repository contains the frontend for CodeSynth. It is built with React and Vite, and connects to the backend API for authentication, code storage, room management, and whiteboard persistence. Real-time collaboration is enabled using Yjs and Socket.IO.

## Features

- User registration and login with JWT authentication
- Code playground editor for HTML, CSS, and JavaScript
- Live preview rendered inside the browser
- Saved user code documents with My Codes library
- Real-time collaborative rooms with shared room state
- Shared whiteboard with save/update support
- Participant lists and room join/leave notifications

## Built With

- React
- Vite
- `@monaco-editor/react` for the code editor
- `axios` for API requests
- `socket.io-client` for real-time room notifications
- `yjs`, `y-monaco`, and `y-websocket` for collaborative editor synchronization
- `uuid` for room ID generation

## Screenshots

Add screenshots for the current frontend UI once available. Suggested placeholders:

- `screenshots/home.png`
- `screenshots/playground.png`
- `screenshots/collaboration-room.png`

## Local Setup

### Prerequisites

- Node.js 18+ installed

### Environment

Copy the example env file and configure the backend URLs:

```powershell
copy .env.example .env
```

Required variables:

- `VITE_BACKEND_URL` - backend API base URL
- `VITE_SOCKET_URL` - Socket.IO server URL
- `VITE_YJS_URL` - Yjs websocket provider URL (typically backend host with `/yjs`)

### Run locally

Install dependencies:

```powershell
npm install
```

Start the frontend:

```powershell
npm run dev
```

Open the local URL shown by Vite in your browser.

## Notes

- The current frontend implements collaboration and code playground workflows.
- Obsolete features such as chatbot, Cohere doc generation, notes pages, and community pages are not part of the current live codebase.
- Replace screenshot placeholders after capturing current UI views.

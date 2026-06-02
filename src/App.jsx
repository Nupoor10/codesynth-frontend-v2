import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthContext } from './hooks/useAuthContext';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Home from './pages/Home/Home';
import UserCodes from './pages/UserCodes/UserCodes';
import Playground from './pages/Playground/Playground';
import Collaborate from './pages/Collaborate/Collaborate';
import CollabPlayground from './pages/Playground/CollabPlayground';
import './App.css'

function App() {
  const { user } = useAuthContext();

  const PrivateRoute = ({ children }) => {
    return user ? children : <Navigate to="/" replace />;
  };

  const PublicRoute = ({ children }) => {
    return user ? <Navigate to="/home" replace /> : children;
  };

  return (
    <>
      <Router>
        <Routes>
          <Route path='/' element={<PublicRoute><Login /></PublicRoute>} />
          <Route path='/register' element={<PublicRoute><Register /></PublicRoute>} />

          <Route path='/home' element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path='/mycodes' element={<PrivateRoute><UserCodes /></PrivateRoute>} />
          <Route path='/code/:id' element={<PrivateRoute><Playground /></PrivateRoute>} />
          <Route path='/collab' element={<PrivateRoute><Collaborate /></PrivateRoute>} />
          <Route path='/collab/:id' element={<PrivateRoute><CollabPlayground /></PrivateRoute>} />

          <Route path='*' element={<Navigate to={user ? '/home' : '/'} replace />} />
        </Routes>
        <Toaster
          position="top-center"
          reverseOrder={false}
        />
      </Router>
    </>
  )
}

export default App

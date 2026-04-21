import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import ProjectHub from './pages/ProjectHub';
import Login from './pages/Login';
import Register from './pages/Register';
import Network from './pages/Network';
import ForgotPassword from './pages/ForgotPassword'; // 1. IMPORT THE NEW PAGE

// PrivateRoute component to protect routes from unauthenticated access
const PrivateRoute = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);
  
  if (loading) return null; 
  
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* --- PUBLIC ROUTES --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* 2. ADD THIS LINE HERE */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* --- PROTECTED ROUTES --- */}
          <Route path="/" element={<PrivateRoute><Feed /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/profile/:id" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/projects" element={<PrivateRoute><ProjectHub /></PrivateRoute>} />
          <Route path="/network" element={<PrivateRoute><Network /></PrivateRoute>} />
          
          {/* --- FALLBACK --- */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
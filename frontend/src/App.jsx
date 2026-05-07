import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './context/useAuthStore';

// Components
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import TenantSetup from './components/Auth/TenantSetup';
import AcceptInvite from './components/Auth/AcceptInvite';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import Dashboard from './components/Dashboard/Dashboard';
import ProjectList from './components/Projects/ProjectList';
import ProjectDetails from './components/Projects/ProjectDetails';
import Landing from './components/Public/Landing';

function App() {
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/tenant-setup" element={<TenantSetup />} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/projects" element={<Layout><ProjectList /></Layout>} />
          <Route path="/projects/:id" element={<Layout><ProjectDetails /></Layout>} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

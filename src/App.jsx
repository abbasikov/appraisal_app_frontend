import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Unauthorized from './pages/Unauthorized';
import ClientList from './pages/clients/ClientList';
import AddClient from './pages/clients/AddClient';
import EditClient from './pages/clients/EditClient';
import ProjectList from './pages/projects/ProjectList';
import AddProject from './pages/projects/AddProject';
import EditProject from './pages/projects/EditProject';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Client and Project routes */}
            <Route 
              path="/clients" 
              element={
                <ProtectedRoute roles={['admin', 'editor']}>
                  <ClientList />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/clients/new" 
              element={
                <ProtectedRoute roles={['admin', 'editor']}>
                  <AddClient />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/clients/:id/edit" 
              element={
                <ProtectedRoute roles={['admin', 'editor']}>
                  <EditClient />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/projects" 
              element={
                <ProtectedRoute roles={['admin', 'editor']}>
                  <ProjectList />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/projects/new" 
              element={
                <ProtectedRoute roles={['admin', 'editor']}>
                  <AddProject />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/projects/:id/edit" 
              element={
                <ProtectedRoute roles={['admin', 'editor']}>
                  <EditProject />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/appraisals" 
              element={
                <ProtectedRoute>
                  <div>Appraisals Page (Coming Soon)</div>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute roles={['admin', 'editor']}>
                  <div>Reports Page (Coming Soon)</div>
                </ProtectedRoute>
              } 
            />
            
            {/* Admin only routes */}
            <Route 
              path="/users" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <div>Users Management (Coming Soon)</div>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
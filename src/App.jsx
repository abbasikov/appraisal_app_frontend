import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
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
import ProjectDetails from './pages/projects/ProjectDetails';
import TemplateList from './pages/templates/TemplateList';
import TemplateUpload from './pages/templates/TemplateUpload';
import TemplateDetails from './pages/templates/TemplateDetails';
import FieldMappingEditor from './pages/templates/FieldMappingEditor';
import ReportGenerator from './pages/templates/ReportGenerator';
import UserManagement from './pages/users/UserManagement';
import AccountList from './pages/accounts/AccountList';
import AddAccount from './pages/accounts/AddAccount';
import EditAccount from './pages/accounts/EditAccount';
import SetupPassword from './pages/SetupPassword';
import WorkOnAppraisal from './pages/appraisal/WorkOnAppraisal';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/setup-password" element={<SetupPassword />} />
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
            
            {/* Account routes */}
            <Route 
              path="/accounts" 
              element={
                <ProtectedRoute>
                  <AccountList />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/accounts/add" 
              element={
                <ProtectedRoute roles={['admin', 'editor']}>
                  <AddAccount />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/accounts/:id/edit" 
              element={
                <ProtectedRoute roles={['admin', 'editor']}>
                  <EditAccount />
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
              path="/projects/:id" 
              element={
                <ProtectedRoute roles={['admin', 'editor']}>
                  <ProjectDetails />
                </ProtectedRoute>
              } 
            />
            
            {/* Template routes */}
            <Route 
              path="/templates" 
              element={
                <ProtectedRoute>
                  <TemplateList />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/templates/upload" 
              element={
                <ProtectedRoute roles={['admin', 'editor']}>
                  <TemplateUpload />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/templates/:id" 
              element={
                <ProtectedRoute>
                  <TemplateDetails />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/templates/:id/mappings" 
              element={
                <ProtectedRoute roles={['admin', 'editor']}>
                  <FieldMappingEditor />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/templates/:id/generate" 
              element={
                <ProtectedRoute roles={['admin', 'editor']}>
                  <ReportGenerator />
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
              path="/projects/:id/appraisal" 
              element={
                <ProtectedRoute roles={['admin', 'editor']}>
                  <WorkOnAppraisal />
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
            
            {/* User Management routes */}
            <Route 
              path="/users" 
              element={
                <ProtectedRoute roles={['admin', 'editor']}>
                  <UserManagement />
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
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
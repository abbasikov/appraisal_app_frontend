import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import OTPInput from '../components/OTPInput';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { api } from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requiresOTP, setRequiresOTP] = useState(false);
  const [otpError, setOtpError] = useState('');
  
  const { login, loginWithMFA } = useAuth();
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, removeToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) return;
    
    setLoading(true);

    try {
      const response = await login(formData);
      
      // Check if OTP is required
      if (response.requiresOTP) {
        setRequiresOTP(true);
      } else if (response.access_token) {
        // Successful login with token
        showSuccess('Login successful! Redirecting...', 3000);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        showError('Unexpected response from server', 5000);
      }
    } catch (error) {
      setFormData(prev => ({ ...prev, password: '' }));
      
      if (error.response?.status === 401) {
        const detail = error.response.data.detail;
        if (detail.includes('Email not verified')) {
          showError('Email not verified. Please check your email and verify your account.', 6000);
        } else {
          showError('Incorrect username/email or password', 5000);
        }
      } else {
        showError('Login failed. Please try again.', 5000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (otpCode) => {
    setLoading(true);
    setOtpError('');

    try {
      await loginWithMFA(formData, otpCode);
      showSuccess('Login successful! Redirecting...', 3000);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      // Stay on OTP screen and show error
      if (error.response?.status === 401) {
        setOtpError('Invalid OTP code. Please try again.');
      } else {
        setOtpError('Login failed. Please try again.');
      }
      // Don't navigate away, stay on OTP screen
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or{' '}
              <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                create a new account
              </Link>
            </p>
          </div>
          
          {requiresOTP ? (
            <div className="mt-8 space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Two-Factor Authentication
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Please enter the 6-digit code from your authenticator app
                </p>
              </div>
              
              <OTPInput 
                onSubmit={handleOTPSubmit}
                loading={loading}
                error={otpError}
              />
              
              <button
                onClick={() => {
                  setRequiresOTP(false);
                  setOtpError('');
                  setFormData(prev => ({ ...prev, password: '' }));
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-500"
              >
                ← Back to login
              </button>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username or Email
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your username or email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center z-20"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </Link>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
          )}
        </div>
      </div>
    </>
  );
};

export default Login;
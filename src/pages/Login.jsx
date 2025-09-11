import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import OTPInput from '../components/OTPInput';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  DocumentTextIcon,
  ShieldCheckIcon,
  UserIcon,
  LockClosedIcon,
  SparklesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requiresOTP, setRequiresOTP] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState('');
  
  const { login, loginWithMFA } = useAuth();
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, removeToast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = 'Username or email is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loading || !validateForm()) return;
    
    setLoading(true);
    setErrors({});

    try {
      const response = await login(formData);
      
      if (response.requiresOTP) {
        setRequiresOTP(true);
      } else if (response.access_token) {
        showSuccess('Login successful! Redirecting...', 3000);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
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
          setErrors({ password: 'Incorrect username/email or password' });
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
      showSuccess('Login successful!', 3000);
      navigate('/dashboard');
    } catch (error) {
      setOtpError('Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-r from-indigo-400/20 to-blue-400/20 animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full bg-gradient-to-r from-purple-400/10 to-pink-400/10 animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center animate-slide-up">
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform rotate-3 hover:rotate-6 transition-transform duration-300">
                <DocumentTextIcon className="w-10 h-10 text-white" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <SparklesIcon className="w-3 h-3 text-yellow-900" />
                </div>
              </div>
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600 text-lg">
              Sign in to your AppraisalPro account
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
            {!requiresOTP ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Username or Email
                  </label>
                  <div className="relative group">
                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center transition-colors duration-200 ${
                      focusedField === 'username' ? 'text-blue-500' : 'text-gray-400'
                    }`}>
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField('')}
                      className={`block w-full pl-12 pr-4 py-4 bg-gray-50/50 border-2 rounded-2xl text-gray-900 placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-0 ${
                        errors.username 
                          ? 'border-red-300 focus:border-red-500 bg-red-50/50' 
                          : focusedField === 'username'
                          ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="Enter your username or email"
                    />
                    {focusedField === 'username' && (
                      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-sm"></div>
                    )}
                  </div>
                  {errors.username && (
                    <p className="text-sm text-red-600 flex items-center space-x-1 animate-shake">
                      <span>⚠️</span>
                      <span>{errors.username}</span>
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <div className="relative group">
                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center transition-colors duration-200 ${
                      focusedField === 'password' ? 'text-blue-500' : 'text-gray-400'
                    }`}>
                      <LockClosedIcon className="h-5 w-5" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField('')}
                      className={`block w-full pl-12 pr-12 py-4 bg-gray-50/50 border-2 rounded-2xl text-gray-900 placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-0 ${
                        errors.password 
                          ? 'border-red-300 focus:border-red-500 bg-red-50/50' 
                          : focusedField === 'password'
                          ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                    {focusedField === 'password' && (
                      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-sm"></div>
                    )}
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600 flex items-center space-x-1 animate-shake">
                      <span>⚠️</span>
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-all duration-200 flex items-center space-x-1 group"
                  >
                    <span>Forgot password?</span>
                    <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center items-center py-4 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                    </>
                  )}
                  {!loading && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-200 -z-10"></div>
                  )}
                </button>
              </form>
            ) : (
              /* OTP Section */
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheckIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-gray-600">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
                  <OTPInput 
                    onSubmit={handleOTPSubmit}
                    loading={loading}
                    error={otpError}
                  />
                </div>
                
                <button
                  onClick={() => {
                    setRequiresOTP(false);
                    setOtpError('');
                    setFormData(prev => ({ ...prev, password: '' }));
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium hover:underline transition-all duration-200"
                >
                  ← Back to login
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center space-y-4 animate-slide-up" style={{ animationDelay: '400ms' }}>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              {/* <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-500">New to AppraisalPro?</span>
              </div> */}
            </div>
            
            {/* <Link 
              to="/signup" 
              className="group inline-flex items-center space-x-2 font-semibold text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-105"
            >
              <span>Create your account</span>
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link> */}
            
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              By signing in, you agree to our Terms of Service and Privacy Policy. 
              Secure authentication powered by industry standards.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </>
  );
};

export default Login;
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import { 
  EyeIcon, 
  EyeSlashIcon,
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  PhoneIcon,
  UserCircleIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'editor'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [completedFields, setCompletedFields] = useState(new Set());
  
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, removeToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loading) return;
    
    setLoading(true);

    try {
      await authService.signup(formData);
      showSuccess('Account created successfully! Please check your email for verification.', 3000);
      setTimeout(() => {
        navigate('/verify-email', { state: { email: formData.email } });
      }, 2000);
    } catch (error) {
      setFormData(prev => ({ ...prev, password: '' }));
      
      if (error.response?.status === 400) {
        showError(error.response.data.detail, 6000);
      } else {
        showError('Registration failed. Please try again.', 5000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Track completed fields
    if (value.trim()) {
      setCompletedFields(prev => new Set([...prev, name]));
    } else {
      setCompletedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(name);
        return newSet;
      });
    }
  };

  const getFieldIcon = (fieldName) => {
    const icons = {
      first_name: UserIcon,
      last_name: UserIcon,
      username: UserCircleIcon,
      email: EnvelopeIcon,
      password: LockClosedIcon,
      phone: PhoneIcon
    };
    return icons[fieldName] || UserIcon;
  };

  const renderField = ({ name, label, type = 'text', required = false, placeholder }) => {
    const Icon = getFieldIcon(name);
    const isCompleted = completedFields.has(name);
    const isFocused = focusedField === name;
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
          {isCompleted && <CheckIcon className="w-4 h-4 text-green-500" />}
        </label>
        <div className="relative group">
          <div className={`absolute inset-y-0 left-0 pl-4 flex items-center transition-colors duration-200 ${
            isFocused ? 'text-blue-500' : isCompleted ? 'text-green-500' : 'text-gray-400'
          }`}>
            <Icon className="h-5 w-5" />
          </div>
          <input
            id={name}
            name={name}
            type={name === 'password' && showPassword ? 'text' : type}
            required={required}
            value={formData[name]}
            onChange={handleChange}
            onFocus={() => setFocusedField(name)}
            onBlur={() => setFocusedField('')}
            className={`block w-full pl-12 ${name === 'password' ? 'pr-12' : 'pr-4'} py-4 bg-gray-50/50 border-2 rounded-2xl text-gray-900 placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-0 ${
              isFocused
                ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/10'
                : isCompleted
                ? 'border-green-300 bg-green-50/30'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            placeholder={placeholder}
          />
          
          {/* Password toggle button */}
          {name === 'password' && (
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
          )}
          
          {/* Focus glow effect */}
          {isFocused && (
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-sm"></div>
          )}
        </div>
      </div>
    );
  };

  const progressPercentage = (completedFields.size / 6) * 100;

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-r from-blue-400/20 to-indigo-400/20 animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-40 h-40 rounded-full bg-gradient-to-r from-green-400/10 to-emerald-400/10 animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative w-full max-w-lg space-y-8">
          {/* Header */}
          <div className="text-center animate-slide-up">
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform -rotate-3 hover:rotate-3 transition-transform duration-300">
                <UserCircleIcon className="w-10 h-10 text-white" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center animate-bounce">
                  <SparklesIcon className="w-3 h-3 text-green-900" />
                </div>
              </div>
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-blue-800 bg-clip-text text-transparent mb-2">
              Join AppraisalPro
            </h2>
            <p className="text-gray-600 text-lg">
              Create your account and start managing appraisals
            </p>
          </div>

          {/* Progress Bar */}
          <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Profile completion</span>
                <span className="text-sm font-bold text-blue-600">{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Main Form Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                {renderField({
                  name: 'first_name',
                  label: 'First Name',
                  required: true,
                  placeholder: 'John'
                })}
                {renderField({
                  name: 'last_name',
                  label: 'Last Name',
                  required: true,
                  placeholder: 'Doe'
                })}
              </div>

              {/* Username */}
              {renderField({
                name: 'username',
                label: 'Username',
                required: true,
                placeholder: 'johndoe123'
              })}

              {/* Email */}
              {renderField({
                name: 'email',
                label: 'Email Address',
                type: 'email',
                required: true,
                placeholder: 'john@example.com'
              })}

              {/* Password */}
              {renderField({
                name: 'password',
                label: 'Password',
                type: 'password',
                required: true,
                placeholder: 'Choose a strong password'
              })}

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                      formData.role === 'editor' 
                        ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20' 
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, role: 'editor' }))}
                  >
                    <div className="text-center">
                      <div className={`w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center ${
                        formData.role === 'editor' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <p className="font-medium text-gray-900">Editor</p>
                      <p className="text-xs text-gray-600">Create & edit content</p>
                    </div>
                    <input
                      type="radio"
                      name="role"
                      value="editor"
                      checked={formData.role === 'editor'}
                      onChange={handleChange}
                      className="absolute top-2 right-2 w-4 h-4"
                    />
                  </div>
                  
                  <div 
                    className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                      formData.role === 'reader' 
                        ? 'border-green-500 bg-green-50 shadow-lg shadow-green-500/20' 
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, role: 'reader' }))}
                  >
                    <div className="text-center">
                      <div className={`w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center ${
                        formData.role === 'reader' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        <EyeIcon className="w-4 h-4" />
                      </div>
                      <p className="font-medium text-gray-900">Reader</p>
                      <p className="text-xs text-gray-600">View-only access</p>
                    </div>
                    <input
                      type="radio"
                      name="role"
                      value="reader"
                      checked={formData.role === 'reader'}
                      onChange={handleChange}
                      className="absolute top-2 right-2 w-4 h-4"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg p-2">
                  ℹ️ Admin accounts are created separately by system administrators
                </p>
              </div>

              {/* Phone (Optional) */}
              {renderField({
                name: 'phone',
                label: 'Phone (Optional)',
                type: 'tel',
                placeholder: '+1 (555) 123-4567'
              })}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center items-center py-4 px-6 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 text-white text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                    Creating account...
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
                {!loading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-200 -z-10"></div>
                )}
              </button>

              {/* Terms Notice */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-xs text-gray-600 text-center leading-relaxed">
                  By creating an account, you agree to our{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                    Privacy Policy
                  </a>
                  . We'll send you a verification email to get started.
                </p>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center space-y-4 animate-slide-up" style={{ animationDelay: '400ms' }}>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 text-gray-500">
                  Already have an account?
                </span>
              </div>
            </div>
            
            <Link 
              to="/login" 
              className="group inline-flex items-center space-x-2 font-semibold text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-105"
            >
              <span>Sign in here</span>
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>

            {/* Features Preview */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { icon: UserCircleIcon, label: 'User Management' },
                { icon: CheckIcon, label: 'Project Tracking' },
                { icon: SparklesIcon, label: 'Modern Interface' }
              ].map((feature, index) => (
                <div 
                  key={feature.label}
                  className="text-center p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20 hover:bg-white/70 transition-all duration-200"
                  style={{ animationDelay: `${500 + index * 100}ms` }}
                >
                  <feature.icon className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-600 font-medium">{feature.label}</p>
                </div>
              ))}
            </div>
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
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </>
  );
};

export default Signup;
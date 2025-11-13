import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const Toast = ({ message, type = 'success', duration = 5000, persistent = false, progress = null, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Don't auto-dismiss if persistent
    if (persistent) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, persistent, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  // Style configurations for different toast types
  const getStyles = () => {
    switch(type) {
      case 'success':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-400',
          Icon: CheckCircleIcon
        };
      case 'error':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-400',
          Icon: XCircleIcon
        };
      case 'loading':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-400',
          Icon: null // We'll use a spinner instead
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-400',
          Icon: CheckCircleIcon
        };
    }
  };

  const { bgColor, borderColor, textColor, iconColor, Icon } = getStyles();

  return (
    <div
      className={`max-w-md w-full ${bgColor} ${borderColor} border rounded-lg shadow-lg transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Icon/Spinner */}
          <div className="flex-shrink-0">
            {type === 'loading' ? (
              <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              Icon && <Icon className={`h-5 w-5 ${iconColor}`} />
            )}
          </div>

          {/* Content - Compact layout */}
          <div className="flex-1 min-w-0">
            {progress !== null && progress !== undefined && progress.total > 0 ? (
              // Compact view with progress
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${textColor} whitespace-nowrap`}>
                  {message}
                </span>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5 min-w-[80px]">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.round(((progress.current || 0) / (progress.total || 1)) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600 whitespace-nowrap">
                    {progress.current || 0}/{progress.total || 0}
                  </span>
                </div>
              </div>
            ) : (
              // Simple text view
              <p className={`text-sm font-medium ${textColor}`}>
                {message}
              </p>
            )}
          </div>

          {/* Close button */}
          {!persistent && (
            <button
              onClick={handleClose}
              className={`flex-shrink-0 ${textColor} hover:opacity-75 focus:outline-none`}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Toast;
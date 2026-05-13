import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md focus:ring-blue-500',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-sm hover:shadow-md focus:ring-gray-500',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md focus:ring-green-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md focus:ring-red-500',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm hover:shadow-md focus:ring-yellow-500',
    outline: 'border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  };

  /* lg+ matches original desktop; below lg adds touch-friendly min-height + slightly smaller type */
  const sizes = {
    sm: 'px-3 py-1.5 text-sm max-lg:min-h-10 max-lg:px-2.5 max-lg:text-xs',
    md: 'px-4 py-2 text-sm max-lg:min-h-11 max-lg:px-3 max-lg:text-xs',
    lg: 'px-6 py-3 text-base max-lg:min-h-12 max-lg:px-4 max-lg:py-2.5 max-lg:text-sm',
    xl: 'px-8 py-4 text-lg max-lg:min-h-12 max-lg:px-5 max-lg:py-3 max-lg:text-sm'
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" color={variant === 'primary' || variant === 'success' || variant === 'danger' || variant === 'warning' ? 'white' : 'gray'} />
          <span className="ml-2">Loading...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="mr-2 h-4 w-4 shrink-0" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="ml-2 h-4 w-4 shrink-0" />}
        </>
      )}
    </button>
  );
};

export default Button;
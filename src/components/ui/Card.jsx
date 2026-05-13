import React from 'react';

const Card = ({ children, className = '', hover = true, ...props }) => {
  const baseClasses = 'bg-white rounded-xl shadow-soft';
  const hoverClasses = hover ? 'hover-lift' : '';
  const classes = `${baseClasses} ${hoverClasses} ${className}`;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`border-b border-gray-100 px-6 py-4 max-lg:px-4 max-lg:py-3 ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardBody = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-6 py-4 max-lg:px-4 max-lg:py-3 ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={`border-t border-gray-100 bg-gray-50 px-6 py-4 max-lg:px-4 max-lg:py-3 rounded-b-xl ${className}`} {...props}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
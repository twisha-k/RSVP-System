import React from 'react';
import { Link } from 'react-router-dom';
import './AnimatedButton.css';

const AnimatedButton = ({ 
  to, 
  href, 
  onClick, 
  children, 
  size = 'medium', 
  className = '',
  type = 'link',
  ...props 
}) => {
  const sizeClass = size !== 'medium' ? `size-${size}` : '';
  const buttonClasses = `animated-button ${sizeClass} ${className}`.trim();

  const ButtonContent = () => (
    <>
      <span className="text">{children}</span>
      <svg className="arr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M16.175 13H4v-2h12.175l-5.6-5.6L12 4l8 8-8 8-1.425-1.4 5.6-5.6z" />
      </svg>
      <svg className="arr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M16.175 13H4v-2h12.175l-5.6-5.6L12 4l8 8-8 8-1.425-1.4 5.6-5.6z" />
      </svg>
      <div className="circle"></div>
    </>
  );

  if (type === 'link' && to) {
    return (
      <Link to={to} className={buttonClasses} {...props}>
        <ButtonContent />
      </Link>
    );
  }

  if (type === 'external' && href) {
    return (
      <a href={href} className={buttonClasses} {...props}>
        <ButtonContent />
      </a>
    );
  }

  return (
    <button className={buttonClasses} onClick={onClick} {...props}>
      <ButtonContent />
    </button>
  );
};

export default AnimatedButton;
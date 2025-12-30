import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 ${className}`}>
      {title && <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>}
      {children}
    </div>
  );
};

export default Card;
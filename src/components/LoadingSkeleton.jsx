import React from 'react';

const LoadingSkeleton = ({ count = 3, className = '' }) => {
  return (
    <div className={`skeleton-grid ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card" aria-hidden="true">
          <div className="skeleton-line short" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;

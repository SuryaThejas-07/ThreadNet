import React from 'react';

const BrandWordmark = ({ className = '' }) => {
  return (
    <span className={`brand-wordmark ${className}`.trim()} aria-label="ThreadNet">
      <span className="brand-wordmark-thread">Thread</span>
      <span className="brand-wordmark-net">Net</span>
    </span>
  );
};

export default BrandWordmark;

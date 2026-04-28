import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorBanner = ({ message }) => {
  if (!message) return null;

  return (
    <div className="error-banner" role="alert" aria-live="polite">
      <AlertCircle size={16} aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
};

export default ErrorBanner;

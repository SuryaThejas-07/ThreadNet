import React from 'react';

const EmptyState = ({ title, description, actionLabel, onAction }) => {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel ? (
        <button className="btn btn-outline" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
};

export default EmptyState;

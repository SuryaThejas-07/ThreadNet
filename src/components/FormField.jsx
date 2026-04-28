import React from 'react';

const FormField = ({
  id,
  label,
  error,
  icon: Icon,
  as = 'input',
  className = '',
  ...props
}) => {
  const Component = as;
  const describedBy = error ? `${id}-error` : undefined;

  return (
    <div className={`form-field ${className}`}>
      {label ? (
        <label className="form-label" htmlFor={id}>
          {label}
        </label>
      ) : null}

      <div className={`form-control ${Icon ? 'has-icon' : ''}`}>
        {Icon ? <Icon className="form-icon" size={18} aria-hidden="true" /> : null}
        <Component
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
        />
      </div>

      {error ? (
        <p id={describedBy} className="error-text" role="status">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default FormField;

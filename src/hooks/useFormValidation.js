import { useCallback, useState } from 'react';

const useFormValidation = (validator) => {
  const [errors, setErrors] = useState({});

  const validate = useCallback(
    (values) => {
      const nextErrors = validator(values);
      setErrors(nextErrors);
      return Object.keys(nextErrors).length === 0;
    },
    [validator],
  );

  const clearError = useCallback((fieldName) => {
    setErrors((previous) => {
      if (!previous[fieldName]) return previous;

      const next = { ...previous };
      delete next[fieldName];
      return next;
    });
  }, []);

  const resetErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validate,
    clearError,
    resetErrors,
  };
};

export default useFormValidation;

export const validateEmail = (value) => {
  const email = String(value || '').trim();
  if (!email) return 'Email is required.';

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return 'Enter a valid email address.';
  }

  return '';
};

export const validatePassword = (value) => {
  if (!value) return 'Password is required.';
  if (value.length < 8) return 'Password must be at least 8 characters.';
  return '';
};

export const validateLoginForm = (values) => {
  const errors = {};

  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(values.password);
  if (passwordError) errors.password = passwordError;

  if (!values.accountType) {
    errors.accountType = 'Choose an account type before signing in.';
  }

  return errors;
};

export const validateResourceDetails = (values) => {
  const errors = {};

  if (!values.quantity || String(values.quantity).trim().length < 2) {
    errors.quantity = 'Provide a clear quantity.';
  }

  if (!values.price || Number(values.price) <= 0) {
    errors.price = 'Price must be greater than zero.';
  }

  if (!values.location || String(values.location).trim().length < 2) {
    errors.location = 'Location is required.';
  }

  if (!values.description || String(values.description).trim().length < 12) {
    errors.description = 'Add at least 12 characters for description.';
  }

  return errors;
};

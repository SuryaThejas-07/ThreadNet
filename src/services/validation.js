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

// ===== DEAL VALIDATION =====
export const validateDealCreation = (payload, buyerId) => {
  const errors = [];

  // User validation
  if (!buyerId || buyerId.trim() === '') {
    errors.push('You must be logged in to make an offer');
  }

  // Listing validation
  if (!payload.listing) {
    errors.push('No listing selected');
  } else {
    if (!payload.listing.id) errors.push('Listing is missing ID');
    if (!payload.listing.ownerId) errors.push('Seller information is incomplete');
    if (!payload.listing.title) errors.push('Listing title is missing');
    if (!payload.listing.factoryName) errors.push('Factory name is missing');
  }

  // Offer validation
  if (!payload.offer || payload.offer <= 0) {
    errors.push('Offer must be greater than ₹0');
  }
  if (typeof payload.offer !== 'number') {
    errors.push('Offer must be a valid number');
  }

  // Quantity validation
  if (!payload.quantity || payload.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }

  return { isValid: errors.length === 0, errors };
};

// ===== OPERATION VALIDATION =====
export const validateOperationCreation = (dealData, assignedToId) => {
  const errors = [];

  // Deal validation
  if (!dealData) {
    errors.push('No deal data provided for operation');
  } else {
    if (!dealData.id) errors.push('Deal ID is missing');
    if (!dealData.city) errors.push('Location is missing');
    if (!dealData.itemName) errors.push('Item name is missing');
    if (!dealData.seller) errors.push('Seller information is incomplete');
    if (!dealData.buyer) errors.push('Buyer information is incomplete');
  }

  return { isValid: errors.length === 0, errors };
};

// ===== LISTING VALIDATION =====
export const validateListing = (listing) => {
  const errors = [];

  if (!listing.title || listing.title.trim() === '') {
    errors.push('Title is required');
  }
  if (!listing.factoryName || listing.factoryName.trim() === '') {
    errors.push('Factory name is required');
  }
  if (!listing.city || listing.city.trim() === '') {
    errors.push('City is required');
  }
  if (!listing.price || listing.price <= 0) {
    errors.push('Price must be greater than 0');
  }
  if (!listing.quantity || listing.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }

  return { isValid: errors.length === 0, errors };
};

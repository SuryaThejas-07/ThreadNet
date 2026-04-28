export const ROLES = {
  FACTORY_OWNER: 'factory_owner',
  LOGISTICS_PROVIDER: 'logistics_provider',
  ADMINISTRATOR: 'administrator',
};

export const normalizeRole = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, '_');

export const isFactoryOwnerRole = (value) => normalizeRole(value) === ROLES.FACTORY_OWNER;

export const isLogisticsProviderRole = (value) => normalizeRole(value) === ROLES.LOGISTICS_PROVIDER;

export const isAdministratorRole = (value) => normalizeRole(value) === ROLES.ADMINISTRATOR;

export const canAccessMarketplace = (value) => {
  const role = normalizeRole(value);
  return role === ROLES.FACTORY_OWNER || role === ROLES.LOGISTICS_PROVIDER || role === ROLES.ADMINISTRATOR;
};

export const canAccessInventory = (value) => {
  const role = normalizeRole(value);
  return role === ROLES.FACTORY_OWNER || role === ROLES.ADMINISTRATOR;
};

export const canAccessDeals = (value) => {
  const role = normalizeRole(value);
  return role === ROLES.FACTORY_OWNER || role === ROLES.ADMINISTRATOR;
};

export const canAccessOperations = (value) => {
  const role = normalizeRole(value);
  return role === ROLES.LOGISTICS_PROVIDER || role === ROLES.ADMINISTRATOR;
};

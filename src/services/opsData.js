const buildMonthSales = (base, swing = 9) =>
  Array.from({ length: 30 }, (_, index) => {
    const wave = Math.sin((index / 4.2) * Math.PI) * swing;
    const trend = index * 0.9;
    return Math.max(0, Math.round(base + wave + trend));
  });

export const inventorySeed = [
  {
    id: 'INV-1001',
    title: 'Cotton Fabric Scraps',
    type: 'Fabric',
    quantity: '520 kg',
    status: 'Approved',
    media: 4,
    updatedAt: '2026-04-24',
    version: 5,
    monthlySales30d: buildMonthSales(46, 6),
    monthlyRevenueInr: 1420000,
  },
  {
    id: 'INV-1002',
    title: 'Idle Stitching Machine',
    type: 'Machines',
    quantity: '2 Units',
    status: 'Draft',
    media: 2,
    updatedAt: '2026-04-22',
    version: 2,
    monthlySales30d: buildMonthSales(18, 4),
    monthlyRevenueInr: 640000,
  },
  {
    id: 'INV-1003',
    title: 'Reactive Dyes 500L',
    type: 'Chemicals',
    quantity: '500 L',
    status: 'Pending Approval',
    media: 1,
    updatedAt: '2026-04-25',
    version: 1,
    monthlySales30d: buildMonthSales(23, 5),
    monthlyRevenueInr: 890000,
  },
];

export const dealsSeed = [
  {
    id: 'DEAL-921',
    buyer: 'Surat Fashion Hub',
    seller: 'Tiruppur Mills',
    item: 'Cotton Scrap - 500kg',
    offer: 452,
    status: 'Negotiation',
    contract: 'Draft',
    order: 'Awaiting Acceptance',
    messages: 6,
    monthlySales30d: buildMonthSales(14, 3),
    monthlyDealValueInr: 1185000,
  },
  {
    id: 'DEAL-922',
    buyer: 'Coimbatore Recycle Co',
    seller: 'Ludhiana Logistics',
    item: 'Refrigerated Route Slot',
    offer: 1900,
    status: 'Accepted',
    contract: 'Signed',
    order: 'Pickup Scheduled',
    messages: 3,
    monthlySales30d: buildMonthSales(9, 2),
    monthlyDealValueInr: 1780000,
  },
];

export const logisticsSeed = [
  {
    id: 'OPS-31',
    route: 'Tiruppur → Coimbatore',
    stage: 'In Transit',
    milestone: 'Reached Hub 2',
    eta: '2h 10m',
    exception: 'None',
    driverPhone: '+919876500011',
    dispatcherPhone: '+919876500099',
    routeDistanceKm: 68,
    monthlySales30d: buildMonthSales(7, 2),
    monthlyRouteRevenueInr: 420000,
  },
  {
    id: 'OPS-32',
    route: 'Surat → Jaipur',
    stage: 'Pickup Scheduled',
    milestone: 'Driver Assigned',
    eta: '5h 30m',
    exception: 'Loading Delay',
    driverPhone: '+919876500012',
    dispatcherPhone: '+919876500099',
    routeDistanceKm: 732,
    monthlySales30d: buildMonthSales(11, 4),
    monthlyRouteRevenueInr: 870000,
  },
  {
    id: 'OPS-33',
    route: 'Panipat → Delhi',
    stage: 'Delivered',
    milestone: 'Proof Verified',
    eta: 'Completed',
    exception: 'None',
    driverPhone: '+919876500013',
    dispatcherPhone: '+919876500099',
    routeDistanceKm: 94,
    monthlySales30d: buildMonthSales(6, 1),
    monthlyRouteRevenueInr: 295000,
  },
];

export const adminUsersSeed = [
  { id: 'USR-1', name: 'Anita Rao', role: 'Cluster Admin', status: 'Active', monthlySales30d: buildMonthSales(28, 4) },
  { id: 'USR-2', name: 'Ravi Kumar', role: 'Factory Owner', status: 'Pending Verification', monthlySales30d: buildMonthSales(22, 5) },
  { id: 'USR-3', name: 'Meera Singh', role: 'Logistics Manager', status: 'Suspended', monthlySales30d: buildMonthSales(16, 3) },
];

export const moderationQueueSeed = [
  { id: 'MOD-11', item: 'Fabric Listing INV-1008', reason: 'Price anomaly', priority: 'High' },
  { id: 'MOD-12', item: 'Deal DEAL-930', reason: 'Missing documentation', priority: 'Medium' },
  { id: 'MOD-13', item: 'User USR-77', reason: 'Duplicate identity', priority: 'High' },
];

export const systemHealthSeed = [
  { metric: 'API Availability', value: '99.94%', status: 'Healthy' },
  { metric: 'Queue Lag', value: '1.8s', status: 'Healthy' },
  { metric: 'Storage Throughput', value: '78%', status: 'Watch' },
  { metric: 'Notification Worker', value: 'Down for 4m', status: 'Critical' },
];

export const analyticsSeries = {
  '7d': [
    { label: 'Mon', savings: 20, deals: 12, emissions: 8 },
    { label: 'Tue', savings: 24, deals: 16, emissions: 9 },
    { label: 'Wed', savings: 30, deals: 19, emissions: 12 },
    { label: 'Thu', savings: 32, deals: 23, emissions: 15 },
    { label: 'Fri', savings: 36, deals: 26, emissions: 18 },
    { label: 'Sat', savings: 28, deals: 17, emissions: 12 },
    { label: 'Sun', savings: 34, deals: 22, emissions: 16 },
  ],
  '30d': [
    { label: 'W1', savings: 90, deals: 55, emissions: 34 },
    { label: 'W2', savings: 112, deals: 62, emissions: 41 },
    { label: 'W3', savings: 126, deals: 73, emissions: 49 },
    { label: 'W4', savings: 140, deals: 81, emissions: 57 },
  ],
  '90d': [
    { label: 'Jan', savings: 320, deals: 190, emissions: 145 },
    { label: 'Feb', savings: 350, deals: 205, emissions: 157 },
    { label: 'Mar', savings: 388, deals: 234, emissions: 171 },
  ],
};

export const clusterComparisonSeed = [
  { cluster: 'Tiruppur', savings: 122, deals: 68 },
  { cluster: 'Surat', savings: 109, deals: 61 },
  { cluster: 'Ludhiana', savings: 88, deals: 47 },
  { cluster: 'Panipat', savings: 74, deals: 39 },
];

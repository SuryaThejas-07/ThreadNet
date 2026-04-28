const buildMonthSales = (base, swing = 9) =>
  Array.from({ length: 30 }, (_, index) => {
    const wave = Math.sin((index / 4.2) * Math.PI) * swing;
    const trend = index * 0.9;
    return Math.max(0, Math.round(base + wave + trend));
  });

const buildImageDataUri = ({ title, subtitle, accent1, accent2, accent3, badge }) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-label="${title}">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${accent1}" />
          <stop offset="55%" stop-color="${accent2}" />
          <stop offset="100%" stop-color="${accent3}" />
        </linearGradient>
        <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="36" />
        </filter>
      </defs>
      <rect width="1200" height="800" fill="url(#bg)" rx="36" />
      <circle cx="180" cy="140" r="120" fill="rgba(255,255,255,0.14)" filter="url(#blur)" />
      <circle cx="1040" cy="640" r="160" fill="rgba(255,255,255,0.10)" filter="url(#blur)" />
      <rect x="70" y="70" width="1160" height="660" rx="28" fill="rgba(8,16,24,0.28)" stroke="rgba(255,255,255,0.18)" />
      <text x="110" y="225" fill="white" font-family="Inter, Arial, sans-serif" font-size="72" font-weight="800">${title}</text>
      <text x="110" y="305" fill="rgba(255,255,255,0.82)" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="600">${subtitle}</text>
      <rect x="110" y="360" width="270" height="58" rx="29" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.24)" />
      <text x="245" y="399" fill="white" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="700">${badge}</text>
      <circle cx="970" cy="270" r="132" fill="rgba(255,255,255,0.12)" />
      <circle cx="970" cy="270" r="72" fill="rgba(8,16,24,0.18)" />
      <path d="M880 560h240v70H880z" fill="rgba(255,255,255,0.16)" />
      <path d="M846 590h308v34H846z" fill="rgba(255,255,255,0.12)" />
      <text x="1000" y="292" fill="white" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="64" font-weight="800">01</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const palette = {
  fabric: ['#0ea5e9', '#0f766e', '#1f2937'],
  machines: ['#f97316', '#d97706', '#111827'],
  chemicals: ['#8b5cf6', '#6366f1', '#111827'],
  transport: ['#22c55e', '#16a34a', '#0f172a'],
  services: ['#f43f5e', '#c026d3', '#111827'],
};

const makeVisual = (title, subtitle, kind = 'fabric', badge = 'Verified') => {
  const [accent1, accent2, accent3] = palette[kind] || palette.fabric;
  const coverImage = buildImageDataUri({ title, subtitle, accent1, accent2, accent3, badge });
  return {
    coverImage,
    galleryUrls: [
      coverImage,
      buildImageDataUri({ title, subtitle: `${subtitle} • detail view`, accent1: accent2, accent2: accent3, accent3: accent1, badge }),
    ],
  };
};

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
    factoryName: 'Rajesh Textiles',
    city: 'Tiruppur',
    matchScore: 98,
    distanceKm: 1.2,
    co2Impact: 2.4,
    condition: 'Grade A',
    ...makeVisual('Cotton Fabric Scraps', 'Off-white reclaimed fabric', 'fabric', 'Approved'),
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
    factoryName: 'Sundar Looms',
    city: 'Surat',
    matchScore: 91,
    distanceKm: 14.6,
    co2Impact: 6.1,
    condition: 'Grade B+',
    ...makeVisual('Idle Stitching Machine', 'Two units ready for reuse', 'machines', 'Draft'),
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
    factoryName: 'BlueChem Processing',
    city: 'Panipat',
    matchScore: 87,
    distanceKm: 26.4,
    co2Impact: 4.8,
    condition: 'Grade A-',
    ...makeVisual('Reactive Dyes 500L', 'Compliance checked chemical lot', 'chemicals', 'Pending'),
  },
];

export const marketplaceSeed = [
  {
    id: 'MKT-001',
    title: 'Cotton Fabric Scraps',
    city: 'Tiruppur',
    price: 450,
    emoji: '🧵',
    distance: 0,
    category: 'Fabric',
    quantity: '520 kg',
    status: 'Approved',
    factoryName: 'Rajesh Textiles',
    ownerId: 'OWNER-001',
    monthlySales30d: buildMonthSales(42, 5),
    monthlyRevenueInr: 1420000,
    matchScore: 98,
    ...makeVisual('Cotton Fabric Scraps', 'Off-white reclaimed stock', 'fabric', 'Live'),
  },
  {
    id: 'MKT-002',
    title: 'Idle Dyeing Machine',
    city: 'Surat',
    price: 1200,
    emoji: '⚙️',
    distance: 125,
    category: 'Machines',
    quantity: '2 Units',
    status: 'Draft',
    factoryName: 'Sundar Looms',
    ownerId: 'OWNER-002',
    monthlySales30d: buildMonthSales(18, 4),
    monthlyRevenueInr: 640000,
    matchScore: 91,
    ...makeVisual('Idle Dyeing Machine', 'Two industrial units', 'machines', 'Draft'),
  },
  {
    id: 'MKT-003',
    title: 'Skilled Tailors Available',
    city: 'Bangalore',
    price: 800,
    emoji: '👷',
    distance: 220,
    category: 'Services',
    quantity: '18 people',
    status: 'Active',
    factoryName: 'Expert Craftsmen Co',
    ownerId: 'OWNER-003',
    monthlySales30d: buildMonthSales(20, 3),
    monthlyRevenueInr: 520000,
    matchScore: 86,
    ...makeVisual('Skilled Tailors Available', 'Factory staff support team', 'services', 'Active'),
  },
  {
    id: 'MKT-004',
    title: 'Reactive Dyes (500L)',
    city: 'Panipat',
    price: 650,
    emoji: '🎨',
    distance: 85,
    category: 'Chemicals',
    quantity: '500 L',
    status: 'Pending Approval',
    factoryName: 'BlueChem Processing',
    ownerId: 'OWNER-004',
    monthlySales30d: buildMonthSales(23, 5),
    monthlyRevenueInr: 890000,
    matchScore: 87,
    ...makeVisual('Reactive Dyes (500L)', 'Lab checked chemical lot', 'chemicals', 'Pending'),
  },
  {
    id: 'MKT-005',
    title: 'Refrigerated Truck',
    city: 'Ludhiana',
    price: 2000,
    emoji: '🚛',
    distance: 320,
    category: 'Transport',
    quantity: '1 Vehicle',
    status: 'Active',
    factoryName: 'QuickHaul Logistics',
    ownerId: 'OWNER-005',
    monthlySales30d: buildMonthSales(15, 2),
    monthlyRevenueInr: 760000,
    matchScore: 94,
    ...makeVisual('Refrigerated Truck', 'Cold-chain transport slot', 'transport', 'Active'),
  },
  {
    id: 'MKT-006',
    title: 'Fabric Waste Collection',
    city: 'Coimbatore',
    price: 520,
    emoji: '🧵',
    distance: 150,
    category: 'Fabric',
    quantity: '3 Tons',
    status: 'Approved',
    factoryName: 'EcoRecycle Solutions',
    ownerId: 'OWNER-006',
    monthlySales30d: buildMonthSales(31, 4),
    monthlyRevenueInr: 1100000,
    matchScore: 95,
    ...makeVisual('Fabric Waste Collection', 'Traceable waste pickup', 'fabric', 'Verified'),
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
    contractProgress: 72,
    buyerAvatar: makeVisual('Surat Fashion Hub', 'Buyer profile', 'fabric', 'Buyer').coverImage,
    sellerAvatar: makeVisual('Tiruppur Mills', 'Seller profile', 'transport', 'Seller').coverImage,
    itemImageUrl: makeVisual('Cotton Scrap - 500kg', 'Deal preview', 'fabric', 'Deal').coverImage,
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
    contractProgress: 91,
    buyerAvatar: makeVisual('Coimbatore Recycle Co', 'Buyer profile', 'chemicals', 'Buyer').coverImage,
    sellerAvatar: makeVisual('Ludhiana Logistics', 'Seller profile', 'transport', 'Seller').coverImage,
    itemImageUrl: makeVisual('Refrigerated Route Slot', 'Deal preview', 'transport', 'Deal').coverImage,
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
    carrierName: 'Blue Line Freight',
    truckNumber: 'TN 38 AB 2144',
    driverName: 'Karthik R.',
    routeImageUrl: makeVisual('Tiruppur → Coimbatore', 'Short-haul pickup route', 'transport', 'On route').coverImage,
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
    carrierName: 'Golden Move Logistics',
    truckNumber: 'GJ 01 ZZ 7801',
    driverName: 'Madan P.',
    routeImageUrl: makeVisual('Surat → Jaipur', 'Long-haul transfer route', 'transport', 'Pickup').coverImage,
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
    carrierName: 'City Loop Cargo',
    truckNumber: 'HR 26 CD 1909',
    driverName: 'Imran S.',
    routeImageUrl: makeVisual('Panipat → Delhi', 'Completed local delivery', 'transport', 'Delivered').coverImage,
  },
];

export const adminUsersSeed = [
  { id: 'USR-1', name: 'Anita Rao', role: 'Cluster Admin', status: 'Active', monthlySales30d: buildMonthSales(28, 4), avatarUrl: buildImageDataUri({ title: 'Anita Rao', subtitle: 'Cluster Admin', accent1: '#0f766e', accent2: '#22c55e', accent3: '#111827', badge: 'Admin' }) },
  { id: 'USR-2', name: 'Ravi Kumar', role: 'Factory Owner', status: 'Pending Verification', monthlySales30d: buildMonthSales(22, 5), avatarUrl: buildImageDataUri({ title: 'Ravi Kumar', subtitle: 'Factory Owner', accent1: '#b45309', accent2: '#f97316', accent3: '#111827', badge: 'Factory' }) },
  { id: 'USR-3', name: 'Meera Singh', role: 'Logistics Manager', status: 'Suspended', monthlySales30d: buildMonthSales(16, 3), avatarUrl: buildImageDataUri({ title: 'Meera Singh', subtitle: 'Logistics Manager', accent1: '#4338ca', accent2: '#8b5cf6', accent3: '#111827', badge: 'Ops' }) },
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

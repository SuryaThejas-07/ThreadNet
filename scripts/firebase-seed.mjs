/* global process, console */
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

const loadCredential = () => {
  if (serviceAccountJson) {
    return admin.credential.cert(JSON.parse(serviceAccountJson));
  }

  if (serviceAccountPath) {
    const absolutePath = path.isAbsolute(serviceAccountPath)
      ? serviceAccountPath
      : path.resolve(rootDir, serviceAccountPath);
    const raw = fs.readFileSync(absolutePath, 'utf-8');
    return admin.credential.cert(JSON.parse(raw));
  }

  return admin.credential.applicationDefault();
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: loadCredential(),
  });
}

const db = admin.firestore();
const ts = admin.firestore.FieldValue.serverTimestamp();

const buildMonthSales = (base, swing = 9) =>
  Array.from({ length: 30 }, (_, index) => {
    const wave = Math.sin((index / 4.2) * Math.PI) * swing;
    const trend = index * 0.9;
    return Math.max(0, Math.round(base + wave + trend));
  });

const seedDocs = [
  ['userProfiles', 'user_123', {
    uid: 'user_123',
    email: 'ravi@email.com',
    name: 'Ravi Kumar',
    role: 'factory_owner',
    roleLabel: 'Factory Owner',
    accountType: 'factory_owner',
    companyName: 'ABC Textiles',
    city: 'Surat',
    cluster: 'Gujarat',
    phone: '9876543210',
    avatarUrl: 'https://img.com/avatar.png',
    status: 'active',
    permissions: ['listing:create', 'deal:read'],
    savedViewsCount: 1,
    profileCompleted: true,
    createdAt: ts,
    updatedAt: ts,
    lastLoginAt: ts,
  }],
  ['listings', 'listing_123', {
    id: 'listing_123',
    title: 'Cotton Fabric Rolls',
    resourceType: 'fabric',
    factoryName: 'ABC Textiles',
    city: 'Surat',
    cluster: 'Gujarat',
    quantity: 1000,
    unit: 'meters',
    pricePerUnit: 50,
    condition: 'new',
    color: 'blue',
    gsmWeight: 180,
    matchScore: 0.85,
    distanceKm: 12,
    co2Impact: 25.5,
    status: 'active',
    visibility: 'public',
    statusUpdatedAt: ts,
    isArchived: false,
    mediaUrls: ['https://img.com/1.png', 'https://img.com/2.png'],
    monthlySales30d: buildMonthSales(44, 6),
    monthlyRevenueInr: 1580000,
    ownerId: 'user_123',
    createdAt: ts,
    updatedAt: ts,
    version: 1,
  }],
  ['deals', 'deal_123', {
    id: 'deal_123',
    listingId: 'listing_123',
    buyerId: 'user_456',
    sellerId: 'user_123',
    buyerName: 'Amit',
    sellerName: 'Ravi',
    item: 'Cotton Fabric Rolls',
    offer: 45,
    counterPrice: 48,
    status: 'Negotiation',
    contract: 'Pending',
    order: 'Pending',
    messages: 3,
    pipelineStage: 'negotiating',
    assignedTo: 'ops_001',
    lastStatusChangedAt: ts,
    isArchived: false,
    matchScore: 0.9,
    savingsEstimate: 5000,
    monthlySales30d: buildMonthSales(13, 3),
    monthlyDealValueInr: 1290000,
    cluster: 'Gujarat',
    createdAt: ts,
    updatedAt: ts,
  }],
  ['operations', 'operation_123', {
    dealId: 'deal_123',
    listingId: 'listing_123',
    route: 'Surat → Mumbai',
    originCity: 'Surat',
    destinationCity: 'Mumbai',
    carrierName: 'XYZ Logistics',
    driverName: 'Ramesh',
    truckNumber: 'GJ01AB1234',
    driverPhone: '+919876500099',
    dispatcherPhone: '+919876500088',
    stage: 'In Transit',
    milestone: 'Checkpoint 2',
    eta: '2h 10m',
    exception: 'None',
    routeDistanceKm: 288,
    delayMinutes: 0,
    monthlySales30d: buildMonthSales(8, 2),
    monthlyRouteRevenueInr: 498000,
    trackingUrl: 'https://tracking.example.com/operation_123',
    proofStatus: 'pending',
    proofOfDeliveryUrl: '',
    createdAt: ts,
    updatedAt: ts,
  }],
  ['adminUsers', 'admin_001', {
    id: 'admin_001',
    name: 'Admin User',
    role: 'administrator',
    status: 'Active',
    email: 'admin@threadnet.app',
    monthlySales30d: buildMonthSales(25, 5),
    updatedAt: ts,
  }],
  ['moderationQueue', 'mod_001', {
    id: 'mod_001',
    item: 'listing_123',
    reason: 'inappropriate content',
    priority: 'high',
    status: 'pending',
    resolvedBy: '',
    resolutionNote: '',
    updatedAt: ts,
    createdAt: ts,
  }],
  ['systemHealth', 'health_api', {
    metric: 'API Availability',
    value: '99.94%',
    status: 'Healthy',
    updatedAt: ts,
  }],
  ['analyticsSeries', 'analytics_30d_w1', {
    range: '30d',
    label: 'W1',
    savings: 100,
    deals: 42,
    emissions: 20,
    order: 1,
  }],
  ['analyticsClusterComparison', 'cluster_gujarat', {
    cluster: 'Gujarat',
    savings: 420,
    deals: 150,
    order: 1,
  }],
  ['savedViews', 'view_001', {
    ownerId: 'user_123',
    name: 'Surat Active Listings',
    page: 'inventory',
    filters: { city: 'Surat', status: 'active', cluster: 'Gujarat' },
    createdAt: ts,
    updatedAt: ts,
  }],
  ['notificationDelivery', 'delivery_001', {
    notificationId: 'notification_001',
    userId: 'user_123',
    channel: 'in_app',
    delivered: true,
    deliveredAt: ts,
    read: false,
    readAt: null,
    createdAt: ts,
    updatedAt: ts,
  }],
  ['factories', 'factory_abc', {
    name: 'ABC Textiles',
    city: 'Surat',
    cluster: 'Gujarat',
    lat: 21.1702,
    lng: 72.8311,
    type: 'fabric',
    verified: true,
    trustScore: 4.5,
    activeListingsCount: 10,
    activeDealsCount: 5,
    lastActiveAt: ts,
  }],
  ['dashboard', 'dashboard_gujarat_30d', {
    cluster: 'Gujarat',
    period: '30d',
    fabricSaved: 2000,
    exchanges: 150,
    factories: 80,
    moneySaved: 100000,
    updatedAt: ts,
  }],
  ['auditEvent', 'audit_001', {
    cluster: 'Gujarat',
    actor: 'admin_001',
    actorRole: 'administrator',
    action: 'approve_listing',
    status: 'success',
    entityType: 'listing',
    entityId: 'listing_123',
    beforeState: { status: 'pending' },
    afterState: { status: 'active' },
    createdAt: ts,
  }],
  ['recommendation', 'reco_001', {
    cluster: 'Gujarat',
    city: 'Surat',
    title: 'Reduce transport cost',
    summary: 'Use shared logistics',
    reasons: ['high demand', 'low supply'],
    confidence: 0.87,
    priority: 'high',
    savingsEstimate: 5000,
    expiresAt: null,
    createdAt: ts,
  }],
  ['chartSeries', 'chart_savings_001', {
    cluster: 'Gujarat',
    chartType: 'savings',
    metric: 'moneySaved',
    period: '30d',
    points: [
      { x: '2026-01-01', y: 100 },
      { x: '2026-01-02', y: 200 },
    ],
    updatedAt: ts,
  }],
  ['predictiveSurplusAlerts', 'alert_surplus_tiruppur_fabric', {
    cluster: 'Tiruppur',
    city: 'Tiruppur',
    resourceType: 'fabric',
    modelName: 'bqml_surplus_forecast_v1',
    predictionWindowDays: 7,
    surplusProbability: 0.86,
    predictedQuantity: 420,
    confidence: 0.82,
    severity: 'high',
    recommendation: 'Create listing bundles now and prioritize nearby buyers within 20km.',
    createdAt: ts,
    updatedAt: ts,
  }],
  ['predictiveSurplusAlerts', 'alert_surplus_surat_chemicals', {
    cluster: 'Surat',
    city: 'Surat',
    resourceType: 'chemicals',
    modelName: 'bqml_surplus_forecast_v1',
    predictionWindowDays: 10,
    surplusProbability: 0.68,
    predictedQuantity: 210,
    confidence: 0.75,
    severity: 'medium',
    recommendation: 'Start controlled markdown and route to verified processing partners.',
    createdAt: ts,
    updatedAt: ts,
  }],
];

const seedSubcollections = async () => {
  await db.doc('deals/deal_123/messages/msg_001').set({
    senderId: 'user_456',
    senderName: 'Amit',
    message: 'Can you reduce price?',
    type: 'text',
    readBy: ['user_123', 'user_456'],
    createdAt: ts,
  }, { merge: true });

  await db.doc('deals/deal_123/statusHistory/event_001').set({
    fromStatus: 'pending',
    toStatus: 'negotiating',
    actorId: 'user_123',
    actorRole: 'factory_owner',
    createdAt: ts,
  }, { merge: true });

  await db.doc('listings/listing_123/statusHistory/event_001').set({
    fromStatus: 'draft',
    toStatus: 'active',
    actorId: 'admin_001',
    actorRole: 'administrator',
    createdAt: ts,
  }, { merge: true });

  await db.doc('operations/operation_123/statusHistory/event_001').set({
    fromStage: 'Pickup Scheduled',
    toStage: 'In Transit',
    actorId: 'ops_001',
    actorRole: 'logistics_provider',
    createdAt: ts,
  }, { merge: true });
};

const seedConfig = async () => {
  await db.doc('config/featureFlags').set({
    smartRouting: true,
    autoModeration: false,
    contractAutoSign: false,
    enableSavedViews: true,
    enableDemoMode: true,
    enableRealtimeAudit: true,
    updatedBy: 'admin_001',
    updatedAt: ts,
  }, { merge: true });

  await db.doc('config/appSettings').set({
    defaultCluster: 'Gujarat',
    defaultPeriod: '30d',
    maintenanceMode: false,
    maxAttachmentSizeMb: 20,
    allowedAttachmentTypes: ['pdf', 'jpg', 'png'],
    updatedBy: 'admin_001',
    updatedAt: ts,
  }, { merge: true });
};

const main = async () => {
  console.log('Seeding top-level collections...');

  for (const [collectionName, docId, payload] of seedDocs) {
    await db.collection(collectionName).doc(docId).set(payload, { merge: true });
    console.log(`  ✓ ${collectionName}/${docId}`);
  }

  console.log('Seeding subcollections...');
  await seedSubcollections();

  console.log('Seeding config documents...');
  await seedConfig();

  console.log('Firebase seed completed successfully.');
};

main().catch((error) => {
  console.error('Firebase seed failed:');
  console.error(error);
  process.exit(1);
});

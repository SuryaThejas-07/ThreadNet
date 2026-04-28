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

const checks = [
  ['userProfiles', 'user_123'],
  ['listings', 'listing_123'],
  ['deals', 'deal_123'],
  ['operations', 'operation_123'],
  ['adminUsers', 'admin_001'],
  ['moderationQueue', 'mod_001'],
  ['systemHealth', 'health_api'],
  ['analyticsSeries', 'analytics_30d_w1'],
  ['analyticsClusterComparison', 'cluster_gujarat'],
  ['savedViews', 'view_001'],
  ['notificationDelivery', 'delivery_001'],
  ['factories', 'factory_abc'],
  ['dashboard', 'dashboard_gujarat_30d'],
  ['auditEvent', 'audit_001'],
  ['recommendation', 'reco_001'],
  ['chartSeries', 'chart_savings_001'],
  ['predictiveSurplusAlerts', 'alert_surplus_tiruppur_fabric'],
  ['predictiveSurplusAlerts', 'alert_surplus_surat_chemicals'],
];

const fieldChecks = [
  ['listings', 'listing_123', 'monthlySales30d'],
  ['deals', 'deal_123', 'monthlySales30d'],
  ['operations', 'operation_123', 'monthlySales30d'],
];

const subchecks = [
  'deals/deal_123/messages/msg_001',
  'deals/deal_123/statusHistory/event_001',
  'listings/listing_123/statusHistory/event_001',
  'operations/operation_123/statusHistory/event_001',
  'config/featureFlags',
  'config/appSettings',
];

const main = async () => {
  let failed = false;

  console.log('Running top-level collection checks...');
  for (const [collectionName, docId] of checks) {
    const snap = await db.collection(collectionName).doc(docId).get();
    if (!snap.exists) {
      failed = true;
      console.error(`  ✗ Missing ${collectionName}/${docId}`);
    } else {
      console.log(`  ✓ ${collectionName}/${docId}`);
    }
  }

  console.log('Running subcollection/config checks...');
  for (const docPath of subchecks) {
    const snap = await db.doc(docPath).get();
    if (!snap.exists) {
      failed = true;
      console.error(`  ✗ Missing ${docPath}`);
    } else {
      console.log(`  ✓ ${docPath}`);
    }
  }

  console.log('Running field-level checks...');
  for (const [collectionName, docId, fieldName] of fieldChecks) {
    const snap = await db.collection(collectionName).doc(docId).get();
    const data = snap.data() || {};
    if (!(fieldName in data)) {
      failed = true;
      console.error(`  ✗ Missing field ${collectionName}/${docId}.${fieldName}`);
    } else {
      console.log(`  ✓ ${collectionName}/${docId}.${fieldName}`);
    }
  }

  if (failed) {
    console.error('Firebase smoke test failed.');
    process.exit(1);
  }

  console.log('Firebase smoke test passed.');
};

main().catch((error) => {
  console.error('Firebase smoke test crashed:');
  console.error(error);
  process.exit(1);
});

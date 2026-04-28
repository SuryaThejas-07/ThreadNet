# Firebase Automation Runbook

This project now includes scripts to create/update collections, add required fields, and validate with sample documents.

## Files Added

- `scripts/firebase-seed.mjs`
- `scripts/firebase-smoke-test.mjs`
- `firestore.indexes.json`
- `firestore.rules`
- `firebase.json`

## One-Time Setup

1. Create a Firebase service account with Firestore Admin access.
2. Download the service account JSON file.
3. Set one of these environment values:
- `FIREBASE_SERVICE_ACCOUNT_PATH=path/to/service-account.json`
- `FIREBASE_SERVICE_ACCOUNT_JSON={...full json...}`

If neither is set, scripts will try Application Default Credentials.

## Commands

- Seed all required collections and sample docs:
```bash
npm run firebase:seed
```

- Verify one sample document per required collection/subcollection:
```bash
npm run firebase:smoke
```

- Run both in sequence:
```bash
npm run firebase:setup
```

## Deploy Indexes and Rules

This repo provides index/rule config files. To apply them:

```bash
firebase deploy --only firestore:indexes,firestore:rules
```

(Requires Firebase CLI login and project selection.)

## What The Seed Script Creates

Top-level collections/documents:

- `userProfiles/user_123`
- `listings/listing_123`
- `deals/deal_123`
- `operations/operation_123`
- `adminUsers/admin_001`
- `moderationQueue/mod_001`
- `systemHealth/health_api`
- `analyticsSeries/analytics_30d_w1`
- `analyticsClusterComparison/cluster_gujarat`
- `savedViews/view_001`
- `notificationDelivery/delivery_001`
- `factories/factory_abc`
- `dashboard/dashboard_gujarat_30d`
- `auditEvent/audit_001`
- `recommendation/reco_001`
- `chartSeries/chart_savings_001`

Subcollections/documents:

- `deals/deal_123/messages/msg_001`
- `deals/deal_123/statusHistory/event_001`
- `listings/listing_123/statusHistory/event_001`
- `operations/operation_123/statusHistory/event_001`

Config docs:

- `config/featureFlags`
- `config/appSettings`

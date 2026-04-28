# Firebase Schema (Required Additions Only)

This file assumes your current collections already exist (`user`, `listing`, `deal`, `operation`, etc.).
Only required additions are listed below.

## 1. Fields To Add In Existing Collections

### `user`
- `permissions`: string[]
- `savedViewsCount`: number
- `profileCompleted`: boolean

### `listing`
- `visibility`: `public` | `private`
- `statusUpdatedAt`: timestamp
- `isArchived`: boolean

### `deal`
- `pipelineStage`: `new` | `negotiating` | `accepted` | `closed`
- `assignedTo`: string
- `lastStatusChangedAt`: timestamp
- `isArchived`: boolean

### `operation`
- `routeDistanceKm`: number
- `delayMinutes`: number
- `trackingUrl`: string
- `proofStatus`: `pending` | `uploaded` | `verified`

### `moderation`
- `resolvedBy`: string
- `resolutionNote`: string
- `updatedAt`: timestamp

### `notification`
- `priority`: `low` | `medium` | `high`
- `deliveredAt`: timestamp | null
- `readAt`: timestamp | null

### `auditEvent`
- `actorRole`: string
- `beforeState`: map
- `afterState`: map

### `recommendation`
- `expiresAt`: timestamp | null
- `savingsEstimate`: number

### `chartSeries`
- `period`: `7d` | `30d` | `90d`
- `metric`: string

## 2. New Top-Level Collections To Add

### `userProfiles/{uid}`
Purpose: Firebase Auth profile + role source of truth.

Required fields:
- `uid`: string
- `email`: string
- `name`: string
- `role`: `factory_owner` | `logistics_provider` | `administrator`
- `roleLabel`: string
- `accountType`: same as `role`
- `status`: `active` | `inactive` | `suspended`
- `createdAt`: timestamp
- `updatedAt`: timestamp
- `lastLoginAt`: timestamp

### `savedViews/{viewId}`
Purpose: Save search/filter presets per page.

Required fields:
- `ownerId`: string
- `name`: string
- `page`: `dashboard` | `inventory` | `deals` | `analytics` | `operations` | `admin`
- `filters`: map
- `createdAt`: timestamp
- `updatedAt`: timestamp

### `notificationDelivery/{deliveryId}`
Purpose: Delivery and read tracking per notification/user.

Required fields:
- `notificationId`: string
- `userId`: string
- `channel`: `in_app` | `email` | `sms` | `push`
- `delivered`: boolean
- `deliveredAt`: timestamp | null
- `read`: boolean
- `readAt`: timestamp | null
- `createdAt`: timestamp
- `updatedAt`: timestamp

## 3. New Subcollections To Add

### `deals/{dealId}/messages/{messageId}`
Required fields:
- `senderId`: string
- `senderName`: string
- `message`: string
- `type`: `text` | `system`
- `readBy`: string[]
- `createdAt`: timestamp

### `deals/{dealId}/statusHistory/{eventId}`
Required fields:
- `fromStatus`: string
- `toStatus`: string
- `actorId`: string
- `actorRole`: string
- `createdAt`: timestamp

### `listings/{listingId}/statusHistory/{eventId}`
Required fields:
- `fromStatus`: string
- `toStatus`: string
- `actorId`: string
- `actorRole`: string
- `createdAt`: timestamp

### `operations/{operationId}/statusHistory/{eventId}`
Required fields:
- `fromStage`: string
- `toStage`: string
- `actorId`: string
- `actorRole`: string
- `createdAt`: timestamp

## 4. Minimum Indexes To Create

- `listing`: `status` + `city` + `updatedAt`
- `deal`: `status` + `updatedAt`
- `operation`: `stage` + `updatedAt`
- `savedViews`: `ownerId` + `page` + `updatedAt`
- `notificationDelivery`: `userId` + `read` + `createdAt`

## 5. Minimum Security Expectations

- Only authenticated users can read app data.
- Users can write only their own `userProfiles/{uid}`.
- Only admins can write moderation/admin/config style data.
- Deal participants can read/write their own `deals/{dealId}/messages`.
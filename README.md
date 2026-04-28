# 🧵 ThreadNet

**AI-assisted industrial resource allocation and supply-chain orchestration for manufacturing clusters.**

## Overview

ThreadNet is a React-based platform that connects factory networks, logistics partners, and administrators using Firebase-powered real-time data and Google Gemini AI services. It is built to model industrial supply-and-demand workflows, visualize cluster health on maps, recommend matches, and monitor deal progress across a distributed manufacturing ecosystem.

## What it does

- Connects factory listings, market demand, and logistics operations
- Displays interactive cluster maps and factory status markers
- Generates AI-backed deal recommendations and route analytics
- Tracks deal lifecycle progress from creation to closure
- Surfaces predictive alerts for surplus materials and capacity opportunities
- Enforces multi-role access and protected routes for users

## Core Features

- **Live dashboard** with supply chain KPIs, cluster metrics, and progress tracking
- **Interactive Atlas map** powered by MapLibre GL and OpenStreetMap tiles
- **AI recommendation engine** using Google Gemini for match scoring
- **Role-based pages** for operators, marketplace users, and admins
- **Deal lifecycle** and logistics workflows with transparent audit status
- **Predictive alerts** for emerging supply and demand imbalances
- **Multi-language UI** via I18nContext for Indian regional support

## Tech Stack

- React 18
- Vite 5
- Firebase Firestore, Authentication, Admin SDK
- Google Gemini API
- MapLibre GL
- Framer Motion
- Lucide React icons
- ESLint, Prettier, Vitest

## Project Structure

```text
ThreadNet/
├── src/
│   ├── components/          # reusable UI components
│   ├── contexts/            # Auth, theme, i18n providers
│   ├── hooks/               # custom hooks
│   ├── pages/               # routed pages and feature screens
│   ├── services/            # Firestore, AI, and app services
│   ├── firebase.js          # Firebase initialization
│   ├── App.jsx              # app shell + routing
│   ├── main.jsx             # application entry point
│   └── index.css            # global styles
├── scripts/                 # Firebase seed and smoke tests
├── .env.example             # environment variable template
├── package.json             # dependencies and scripts
└── README.md                # project documentation
```

## Important Pages

- `LandingPage.jsx` — public landing experience
- `Login.jsx` — authentication interface
- `Dashboard.jsx` — overall operations and cluster intelligence
- `ListingsInventory.jsx` — manage available factory/listing inventory
- `ListResource.jsx` — create or update supply resource listings
- `Marketplace.jsx` — browse and accept suggested marketplace matches
- `Matches.jsx` — review AI match recommendations
- `DealLifecycle.jsx` — monitor transaction and fulfillment progress
- `OperationsLogistics.jsx` — logistics and transport coordination
- `Analytics.jsx` — deeper data analytics and reporting
- `AdminConsole.jsx` — administration and RBAC controls

## Setup

### Prerequisites

- Node.js 18+
- npm 8+
- Firebase project configured with Firestore and Authentication
- Google Gemini API key for AI recommendation services

### Install

```bash
git clone <repository-url>
cd ThreadNet
npm install
```

### Configure

Copy `.env.example` to `.env.local` and update the values:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=threadnet-22ab4.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=threadnet-22ab4
VITE_FIREBASE_STORAGE_BUCKET=threadnet-22ab4.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key
FIREBASE_SERVICE_ACCOUNT_PATH=./threadnet-22ab4-firebase-adminsdk-fbsvc-bf8daa44a4.json
```

### Run

```bash
npm run dev
```

Open `http://localhost:5173`.

### Build

```bash
npm run build
npm run preview
```

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run preview` — preview built app
- `npm run lint` — ESLint scan
- `npm run format` — Prettier formatting
- `npm run test` — Vitest test runner
- `npm run firebase:seed` — seed Firebase test data
- `npm run firebase:smoke` — Firebase smoke validation
- `npm run firebase:setup` — seed + smoke tests

## Security

- Keep `.env.local` out of source control
- Do not commit the Firebase service account JSON file
- Use environment variables for API keys and sensitive settings
- Protect Firestore with security rules in production

## Summary

ThreadNet is a real-time, AI-enhanced industrial logistics dashboard designed for Indian manufacturing clusters. It combines map-driven visibility, predictive operations, and role-based workflows to improve matching, reduce waste, and surface the right supply opportunities at the right time.

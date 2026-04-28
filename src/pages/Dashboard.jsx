import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  BarChart3,
  BadgeCheck,
  CheckCircle2,
  Factory,
  MapPin,
  Pause,
  Play,
  RefreshCw,
  Route,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Package,
  Zap,
} from 'lucide-react';
import ErrorBanner from '../components/ErrorBanner';
import AtlasMap from '../components/AtlasMap';
import { subscribeToDashboardBundle } from '../services/dashboardService';
import { generateDashboardRecommendation } from '../services/geminiService';
import { subscribeToPredictiveSurplusAlerts } from '../services/predictiveAlertsService';
import { useI18n } from '../contexts/I18nContext';

const CITY_COORDS = {
  Tiruppur: { lat: 11.1085, lng: 77.3411 },
  Surat: { lat: 21.1702, lng: 72.8311 },
  Ludhiana: { lat: 30.901, lng: 75.8573 },
  Coimbatore: { lat: 11.0168, lng: 76.9558 },
  Panipat: { lat: 29.3909, lng: 76.9635 },
  Erode: { lat: 11.341, lng: 77.7172 },
  Karur: { lat: 10.9601, lng: 78.0766 },
  Vapi: { lat: 20.3715, lng: 72.9049 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Rajkot: { lat: 22.3039, lng: 70.8022 },
  Jalandhar: { lat: 31.326, lng: 75.5762 },
  'Delhi NCR': { lat: 28.6139, lng: 77.209 },
  Sonipat: { lat: 28.9931, lng: 77.0151 },
  Pollachi: { lat: 10.6585, lng: 77.0087 },
  Mettupalayam: { lat: 11.2996, lng: 76.9351 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  Karnal: { lat: 29.6857, lng: 76.9905 },
};

const INDIA_CENTER = { lat: 21.1466, lng: 79.0889 };

const toPanelPoint = (lat, lng, index = 0) => {
  const latitude = Number.isFinite(Number(lat)) ? Number(lat) : 20 + index * 0.9;
  const longitude = Number.isFinite(Number(lng)) ? Number(lng) : 74 + index * 0.9;

  const x = 12 + ((longitude - 68) / (97 - 68)) * 76;
  const y = 16 + ((37 - latitude) / (37 - 8)) * 66;

  return {
    x: Math.max(10, Math.min(90, x)),
    y: Math.max(12, Math.min(84, y)),
  };
};

const buildPoints = (values) => {
  if (!values.length) return '';

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);

  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 36 - ((value - min) / range) * 26;
      return `${x},${y}`;
    })
    .join(' ');
};

const buildIndexedPoints = (values, startIndex, totalPoints, min, max) => {
  if (!values.length || totalPoints <= 1) return '';
  const range = Math.max(max - min, 1);

  return values
    .map((value, index) => {
      const x = ((startIndex + index) / (totalPoints - 1)) * 100;
      const y = 36 - ((value - min) / range) * 26;
      return `${x},${y}`;
    })
    .join(' ');
};

  const buildIndexedAreaPoints = (values, startIndex, totalPoints, min, max) => {
    if (!values.length || totalPoints <= 1) return '';
    const range = Math.max(max - min, 1);

    const pointPairs = values.map((value, index) => {
      const x = ((startIndex + index) / (totalPoints - 1)) * 100;
      const y = 36 - ((value - min) / range) * 26;
      return `${x},${y}`;
    });

    const firstX = ((startIndex / (totalPoints - 1)) * 100).toFixed(2);
    const lastX = (((startIndex + values.length - 1) / (totalPoints - 1)) * 100).toFixed(2);

    return `${pointPairs.join(' ')} ${lastX},40 ${firstX},40`;
  };

const getThresholdBadge = (score, options = {}) => {
  const { invert = false } = options;

  if (!invert) {
    if (score >= 85) return { label: 'GREEN', className: 'badge-primary' };
    if (score >= 65) return { label: 'AMBER', className: 'badge-warning' };
    return { label: 'RED', className: 'badge-danger' };
  }

  if (score <= 7) return { label: 'GREEN', className: 'badge-primary' };
  if (score <= 15) return { label: 'AMBER', className: 'badge-warning' };
  return { label: 'RED', className: 'badge-danger' };
};

const clusterProfiles = {
  'All Clusters': {
    title: 'India-wide factory network',
    subtitle: 'Live insights across all active manufacturing hubs',
    nearbyCities: [
      { name: 'Tiruppur', x: 24, y: 56, factories: 18, verified: 15, match: 94, route: 'Knitwear corridor' },
      { name: 'Surat', x: 56, y: 34, factories: 14, verified: 11, match: 91, route: 'Textile exchange' },
      { name: 'Ludhiana', x: 28, y: 26, factories: 12, verified: 10, match: 88, route: 'Transport cluster' },
      { name: 'Coimbatore', x: 32, y: 66, factories: 10, verified: 9, match: 92, route: 'Recycle belt' },
      { name: 'Panipat', x: 70, y: 18, factories: 11, verified: 8, match: 86, route: 'North India route' },
    ],
    localFactories: [
      { name: 'Tiruppur Textiles', city: 'Tiruppur', type: 'Fabric', status: 'Verified' },
      { name: 'Surat Dyeing Hub', city: 'Surat', type: 'Dyeing', status: 'Verified' },
      { name: 'Ludhiana Logistics', city: 'Ludhiana', type: 'Transport', status: 'Verified' },
      { name: 'Coimbatore Recycle Co.', city: 'Coimbatore', type: 'Reuse', status: 'Review' },
      { name: 'Panipat Chemicals', city: 'Panipat', type: 'Chemicals', status: 'Verified' },
    ],
    stats: { fabricSaved: 2400000, exchanges: 1250, factories: 850, moneySaved: 450000000 },
    savings: [64, 69, 72, 80, 84, 91, 97],
    matchQuality: [
      { label: 'Fabric', value: 94 },
      { label: 'Machines', value: 87 },
      { label: 'Transport', value: 81 },
      { label: 'Reuse', value: 92 },
    ],
    lifecycle: [
      { label: 'Listed', value: 18 },
      { label: 'Matched', value: 13 },
      { label: 'Negotiating', value: 8 },
      { label: 'Closed', value: 6 },
    ],
    feed: [
      { time: '2 min ago', event: 'New fabric listing from Tiruppur mills' },
      { time: '5 min ago', event: 'Machine match found in Surat' },
      { time: '12 min ago', event: 'Local truck capacity released in Ludhiana' },
      { time: '18 min ago', event: 'Route optimization saved ₹5K across clusters' },
    ],
    verification: [
      { label: 'Verified factories', value: '850+', detail: 'Identity and documents checked' },
      { label: 'Audit events', value: '128', detail: 'Traceable actions this week' },
      { label: 'Live roles', value: '4', detail: 'Owner, logistics, admin, verifier' },
    ],
    auditTrail: [
      { time: '2m', actor: 'System', action: 'Listing approved after document scan', status: 'Verified' },
      { time: '14m', actor: 'Admin', action: 'Factory verification completed for Surat', status: 'Approved' },
      { time: '31m', actor: 'Logistics', action: 'Route reassigned to remove empty run', status: 'Recorded' },
      { time: '49m', actor: 'Owner', action: 'Counteroffer posted for fabric bundle', status: 'Logged' },
    ],
    demoWorkflow: [
      { title: 'Listing created', detail: 'Tiruppur fabric scrap posted with live media and owner verification.' },
      { title: 'AI match scored', detail: 'Nearby buyers and recyclers ranked by distance, trust, and savings.' },
      { title: 'Deal negotiated', detail: 'A local buyer submits a counteroffer and receives instant feedback.' },
      { title: 'Pickup scheduled', detail: 'Route and truck are assigned, then added to the audit trail.' },
    ],
  },
  Tiruppur: {
    title: 'Tiruppur cluster network',
    subtitle: 'Knitwear mills, local dye houses, and nearby recycling partners',
    nearbyCities: [
      { name: 'Tiruppur', x: 50, y: 54, factories: 16, verified: 13, match: 97, route: 'Core knitwear zone' },
      { name: 'Coimbatore', x: 72, y: 28, factories: 8, verified: 7, match: 93, route: 'Reuse corridor' },
      { name: 'Erode', x: 36, y: 22, factories: 6, verified: 5, match: 88, route: 'Same-day pickup' },
      { name: 'Karur', x: 22, y: 66, factories: 4, verified: 4, match: 84, route: 'Small-batch finishing' },
    ],
    localFactories: [
      { name: 'Tiruppur Textiles', city: 'Tiruppur', type: 'Fabric', status: 'Verified' },
      { name: 'Sri Kumaran Knits', city: 'Tiruppur', type: 'Knitwear', status: 'Verified' },
      { name: 'Nivetha Dye House', city: 'Coimbatore', type: 'Dyeing', status: 'Review' },
      { name: 'Kongu Recyclers', city: 'Erode', type: 'Reuse', status: 'Verified' },
    ],
    stats: { fabricSaved: 740000, exchanges: 420, factories: 214, moneySaved: 118000000 },
    savings: [42, 46, 53, 59, 67, 74, 82],
    matchQuality: [
      { label: 'Fabric', value: 97 },
      { label: 'Machines', value: 91 },
      { label: 'Transport', value: 86 },
      { label: 'Reuse', value: 95 },
    ],
    lifecycle: [
      { label: 'Listed', value: 16 },
      { label: 'Matched', value: 12 },
      { label: 'Negotiating', value: 7 },
      { label: 'Closed', value: 5 },
    ],
    feed: [
      { time: '2 min ago', event: 'New cotton scrap listing from Tiruppur mills' },
      { time: '5 min ago', event: 'Coimbatore recycler matched with a Tiruppur dye house' },
      { time: '10 min ago', event: 'Local capacity opened in Erode for same-day pickup' },
      { time: '16 min ago', event: 'Knitting line idle slot reserved by a nearby factory' },
    ],
    verification: [
      { label: 'Verified factories', value: '214', detail: 'Most local partners onboarded' },
      { label: 'Audit events', value: '48', detail: 'City-level actions this week' },
      { label: 'Trust score', value: '97%', detail: 'Strong local verification coverage' },
    ],
    auditTrail: [
      { time: '3m', actor: 'System', action: 'Tiruppur listing moved to pending approval', status: 'Verified' },
      { time: '18m', actor: 'Admin', action: 'Local recycler approved for reuse routing', status: 'Approved' },
      { time: '35m', actor: 'Owner', action: 'Same-day pickup requested for Erode hub', status: 'Logged' },
      { time: '52m', actor: 'Logistics', action: 'Carrier assignment completed', status: 'Recorded' },
    ],
    demoWorkflow: [
      { title: 'Local listing captured', detail: 'Tiruppur waste posted with verified photos and quantity.' },
      { title: 'Nearby match scored', detail: 'Coimbatore and Erode are ranked above distant buyers.' },
      { title: 'Counteroffer accepted', detail: 'A local factory accepts the price and confirms pickup.' },
      { title: 'Shipment tracked', detail: 'Route status updates land in the audit trail instantly.' },
    ],
  },
  Surat: {
    title: 'Surat cluster network',
    subtitle: 'Dyeing houses, textile processors, and regional buyers in West India',
    nearbyCities: [
      { name: 'Surat', x: 50, y: 54, factories: 15, verified: 12, match: 95, route: 'Dyeing hub' },
      { name: 'Vapi', x: 74, y: 36, factories: 7, verified: 6, match: 89, route: 'Processing link' },
      { name: 'Ahmedabad', x: 28, y: 22, factories: 8, verified: 7, match: 87, route: 'Buyer cluster' },
      { name: 'Rajkot', x: 18, y: 64, factories: 5, verified: 4, match: 83, route: 'Transport extension' },
    ],
    localFactories: [
      { name: 'Surat Dyeing House', city: 'Surat', type: 'Dyeing', status: 'Verified' },
      { name: 'Fashion Hub Surat', city: 'Surat', type: 'Buyer', status: 'Verified' },
      { name: 'Vapi Processors', city: 'Vapi', type: 'Processing', status: 'Review' },
      { name: 'Navsari Mills', city: 'Ahmedabad', type: 'Fabric', status: 'Verified' },
    ],
    stats: { fabricSaved: 620000, exchanges: 365, factories: 192, moneySaved: 96000000 },
    savings: [38, 42, 47, 52, 58, 66, 74],
    matchQuality: [
      { label: 'Fabric', value: 93 },
      { label: 'Machines', value: 88 },
      { label: 'Transport', value: 84 },
      { label: 'Reuse', value: 90 },
    ],
    lifecycle: [
      { label: 'Listed', value: 14 },
      { label: 'Matched', value: 10 },
      { label: 'Negotiating', value: 6 },
      { label: 'Closed', value: 4 },
    ],
    feed: [
      { time: '3 min ago', event: 'Dyeing batch from Surat moved into reuse queue' },
      { time: '8 min ago', event: 'Local factory requested machine rental support' },
      { time: '11 min ago', event: 'Buyer in Vapi accepted a recycled fabric offer' },
      { time: '20 min ago', event: 'Nearby transporter assigned to same-day pickup' },
    ],
    verification: [
      { label: 'Verified factories', value: '192', detail: 'West India partners onboarded' },
      { label: 'Audit events', value: '39', detail: 'Approval logs and route changes' },
      { label: 'Trust score', value: '95%', detail: 'Verified local exchanges are strong' },
    ],
    auditTrail: [
      { time: '4m', actor: 'System', action: 'Dyeing batch documented for reuse', status: 'Verified' },
      { time: '21m', actor: 'Admin', action: 'New partner cleared for Surat exchange', status: 'Approved' },
      { time: '28m', actor: 'Buyer', action: 'Counteroffer created for processed fabric', status: 'Logged' },
      { time: '57m', actor: 'Logistics', action: 'Pickup window assigned', status: 'Recorded' },
    ],
    demoWorkflow: [
      { title: 'Local surplus found', detail: 'Surat dyeing waste is listed and priced immediately.' },
      { title: 'AI ranks buyers', detail: 'Vapi and Ahmedabad buyers rise to the top of the queue.' },
      { title: 'Deal accepted', detail: 'Factory owner confirms a same-city trade.' },
      { title: 'Proof recorded', detail: 'Delivery proof and audit trail are automatically saved.' },
    ],
  },
  Ludhiana: {
    title: 'Ludhiana cluster network',
    subtitle: 'Transport, apparel, and cold-chain routing around Punjab',
    nearbyCities: [
      { name: 'Ludhiana', x: 50, y: 52, factories: 13, verified: 11, match: 92, route: 'Transport node' },
      { name: 'Jalandhar', x: 72, y: 28, factories: 7, verified: 6, match: 87, route: 'Apparel extension' },
      { name: 'Delhi NCR', x: 26, y: 20, factories: 9, verified: 7, match: 85, route: 'Buyer corridor' },
      { name: 'Sonipat', x: 24, y: 68, factories: 5, verified: 4, match: 82, route: 'Logistics spur' },
    ],
    localFactories: [
      { name: 'Ludhiana Transport Co.', city: 'Ludhiana', type: 'Transport', status: 'Verified' },
      { name: 'Silver Knitwear', city: 'Ludhiana', type: 'Apparel', status: 'Verified' },
      { name: 'Punjab Logistics Yard', city: 'Jalandhar', type: 'Logistics', status: 'Review' },
      { name: 'North Dye Works', city: 'Delhi NCR', type: 'Dyeing', status: 'Verified' },
    ],
    stats: { fabricSaved: 510000, exchanges: 280, factories: 156, moneySaved: 84000000 },
    savings: [34, 36, 39, 45, 51, 58, 63],
    matchQuality: [
      { label: 'Fabric', value: 90 },
      { label: 'Machines', value: 84 },
      { label: 'Transport', value: 89 },
      { label: 'Reuse', value: 87 },
    ],
    lifecycle: [
      { label: 'Listed', value: 13 },
      { label: 'Matched', value: 9 },
      { label: 'Negotiating', value: 6 },
      { label: 'Closed', value: 4 },
    ],
    feed: [
      { time: '4 min ago', event: 'Truck slot released by a Ludhiana logistics partner' },
      { time: '7 min ago', event: 'Textile supplier matched with a Punjab buyer' },
      { time: '15 min ago', event: 'Cold-chain route optimized for local dispatch' },
      { time: '23 min ago', event: 'Factory verification completed for a new partner' },
    ],
    verification: [
      { label: 'Verified factories', value: '156', detail: 'Transport and apparel nodes verified' },
      { label: 'Audit events', value: '33', detail: 'Movement logs and user checks' },
      { label: 'Trust score', value: '92%', detail: 'Reliable route and partner records' },
    ],
    auditTrail: [
      { time: '6m', actor: 'System', action: 'Route capacity opened for Punjab dispatch', status: 'Verified' },
      { time: '17m', actor: 'Admin', action: 'New partner verification completed', status: 'Approved' },
      { time: '33m', actor: 'Owner', action: 'Transport order submitted for review', status: 'Logged' },
      { time: '58m', actor: 'Logistics', action: 'Carrier linked to truck slot', status: 'Recorded' },
    ],
    demoWorkflow: [
      { title: 'Route posted', detail: 'A local carrier makes spare capacity available.' },
      { title: 'AI recommends buyer', detail: 'The app proposes the highest-margin reuse option.' },
      { title: 'Verification passes', detail: 'The route and factory docs are checked automatically.' },
      { title: 'Dispatch confirmed', detail: 'The deal enters the audit trail and savings board.' },
    ],
  },
  Coimbatore: {
    title: 'Coimbatore cluster network',
    subtitle: 'Recycling, machinery, and utility support for the Tamil Nadu corridor',
    nearbyCities: [
      { name: 'Coimbatore', x: 50, y: 54, factories: 12, verified: 10, match: 93, route: 'Recycle hub' },
      { name: 'Tiruppur', x: 74, y: 30, factories: 10, verified: 8, match: 91, route: 'Overflow link' },
      { name: 'Pollachi', x: 30, y: 22, factories: 5, verified: 4, match: 84, route: 'Local pickup' },
      { name: 'Mettupalayam', x: 24, y: 68, factories: 4, verified: 3, match: 80, route: 'Utility node' },
    ],
    localFactories: [
      { name: 'Coimbatore Recycle Co.', city: 'Coimbatore', type: 'Reuse', status: 'Verified' },
      { name: 'Peelamedu Engineering', city: 'Coimbatore', type: 'Machinery', status: 'Verified' },
      { name: 'Sri Sai Utilities', city: 'Pollachi', type: 'Utilities', status: 'Review' },
      { name: 'Kovai Waste Solutions', city: 'Mettupalayam', type: 'Reuse', status: 'Verified' },
    ],
    stats: { fabricSaved: 430000, exchanges: 238, factories: 143, moneySaved: 71000000 },
    savings: [30, 34, 36, 44, 49, 55, 61],
    matchQuality: [
      { label: 'Fabric', value: 91 },
      { label: 'Machines', value: 89 },
      { label: 'Transport', value: 82 },
      { label: 'Reuse', value: 94 },
    ],
    lifecycle: [
      { label: 'Listed', value: 12 },
      { label: 'Matched', value: 8 },
      { label: 'Negotiating', value: 5 },
      { label: 'Closed', value: 4 },
    ],
    feed: [
      { time: '2 min ago', event: 'Local recycler accepted a Tiruppur overflow listing' },
      { time: '6 min ago', event: 'Machine service slot reserved in Coimbatore' },
      { time: '14 min ago', event: 'Utility supplier approved for regional onboarding' },
      { time: '19 min ago', event: 'Pickup route confirmed between two nearby factories' },
    ],
    verification: [
      { label: 'Verified factories', value: '143', detail: 'Machinery and recycling nodes checked' },
      { label: 'Audit events', value: '31', detail: 'Service logs and pickup confirmations' },
      { label: 'Trust score', value: '93%', detail: 'Strong reuse and machinery coverage' },
    ],
    auditTrail: [
      { time: '5m', actor: 'System', action: 'Overflow listing paired with recycler', status: 'Verified' },
      { time: '19m', actor: 'Admin', action: 'Utility vendor accepted into cluster', status: 'Approved' },
      { time: '36m', actor: 'Owner', action: 'Machine service request created', status: 'Logged' },
      { time: '44m', actor: 'Logistics', action: 'Local pickup bundle scheduled', status: 'Recorded' },
    ],
    demoWorkflow: [
      { title: 'Recycler identified', detail: 'Nearby reuse capacity is pulled from Coimbatore first.' },
      { title: 'AI explains match', detail: 'The panel highlights why the local pairing is best.' },
      { title: 'Pickup scheduled', detail: 'Transport is assigned and the route is tracked.' },
      { title: 'Savings updated', detail: 'The dashboard updates the impact counters instantly.' },
    ],
  },
  Panipat: {
    title: 'Panipat cluster network',
    subtitle: 'Textiles, chemicals, and route consolidation for North India',
    nearbyCities: [
      { name: 'Panipat', x: 50, y: 54, factories: 11, verified: 8, match: 89, route: 'Chemicals hub' },
      { name: 'Delhi', x: 74, y: 26, factories: 9, verified: 7, match: 87, route: 'Demand center' },
      { name: 'Karnal', x: 28, y: 22, factories: 5, verified: 4, match: 82, route: 'Route bundle' },
      { name: 'Sonipat', x: 22, y: 68, factories: 4, verified: 3, match: 80, route: 'Pickup hop' },
    ],
    localFactories: [
      { name: 'Panipat Chemicals', city: 'Panipat', type: 'Chemicals', status: 'Verified' },
      { name: 'North Weaves', city: 'Delhi', type: 'Fabric', status: 'Review' },
      { name: 'Haryana Supply Yard', city: 'Karnal', type: 'Logistics', status: 'Verified' },
      { name: 'Panipat Finishers', city: 'Sonipat', type: 'Finishing', status: 'Verified' },
    ],
    stats: { fabricSaved: 390000, exchanges: 204, factories: 121, moneySaved: 62000000 },
    savings: [28, 31, 35, 40, 45, 50, 56],
    matchQuality: [
      { label: 'Fabric', value: 88 },
      { label: 'Machines', value: 82 },
      { label: 'Transport', value: 90 },
      { label: 'Reuse', value: 85 },
    ],
    lifecycle: [
      { label: 'Listed', value: 11 },
      { label: 'Matched', value: 7 },
      { label: 'Negotiating', value: 4 },
      { label: 'Closed', value: 3 },
    ],
    feed: [
      { time: '1 min ago', event: 'Chemical surplus from Panipat entered local reuse pool' },
      { time: '9 min ago', event: 'Route capacity opened toward Delhi buyers' },
      { time: '13 min ago', event: 'One factory requested approval for the next shipment' },
      { time: '21 min ago', event: 'Low-emission route recommendation accepted' },
    ],
    verification: [
      { label: 'Verified factories', value: '121', detail: 'Chemicals and finishing verified' },
      { label: 'Audit events', value: '27', detail: 'Route changes and approval logs' },
      { label: 'Trust score', value: '89%', detail: 'Strong transport-backed trade coverage' },
    ],
    auditTrail: [
      { time: '7m', actor: 'System', action: 'Chemical surplus routed into reuse pool', status: 'Verified' },
      { time: '15m', actor: 'Admin', action: 'Delhi buyer verified for bidding', status: 'Approved' },
      { time: '29m', actor: 'Owner', action: 'Finishing order queued for review', status: 'Logged' },
      { time: '41m', actor: 'Logistics', action: 'Bundle transport assigned', status: 'Recorded' },
    ],
    demoWorkflow: [
      { title: 'Surplus posted', detail: 'Chemical inventory appears with safety and trust checks.' },
      { title: 'AI scores demand', detail: 'Delhi and Karnal are prioritized for route efficiency.' },
      { title: 'Verification passes', detail: 'Documents and owner details are logged automatically.' },
      { title: 'Dispatch recorded', detail: 'The transaction lands in the audit trail and charts.' },
    ],
  },
};

const clusterOrder = ['All Clusters', 'Tiruppur', 'Surat', 'Ludhiana', 'Coimbatore', 'Panipat'];
const factoryStatusOptions = ['All', 'Verified', 'Review'];

const formatCompactCurrency = (value) => `₹${Math.round(value / 10000000)}Cr`;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const haversineKm = (from, to) => {
  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const resolveCityLatLng = (city) => {
  const hasLiveLatLng = Number.isFinite(Number(city?.lat)) && Number.isFinite(Number(city?.lng));
  if (hasLiveLatLng) {
    return {
      lat: Number(city.lat),
      lng: Number(city.lng),
    };
  }

  return CITY_COORDS[city?.name] || INDIA_CENTER;
};

const mergeProfileWithLiveBundle = (fallbackProfile, liveBundle) => {
  if (!liveBundle) return fallbackProfile;

  return {
    ...fallbackProfile,
    nearbyCities: liveBundle.nearbyCities?.length ? liveBundle.nearbyCities : fallbackProfile.nearbyCities,
    localFactories: liveBundle.localFactories?.length ? liveBundle.localFactories : fallbackProfile.localFactories,
    stats: liveBundle.stats || fallbackProfile.stats,
    savings: liveBundle.savings?.length ? liveBundle.savings : fallbackProfile.savings,
    matchQuality: liveBundle.matchQuality?.length ? liveBundle.matchQuality : fallbackProfile.matchQuality,
    lifecycle: liveBundle.lifecycle?.length ? liveBundle.lifecycle : fallbackProfile.lifecycle,
    feed: liveBundle.feed?.length ? liveBundle.feed : fallbackProfile.feed,
    auditTrail: liveBundle.auditTrail?.length ? liveBundle.auditTrail : fallbackProfile.auditTrail,
    verification: liveBundle.verification?.length ? liveBundle.verification : fallbackProfile.verification,
    demoWorkflow: liveBundle.demoWorkflow?.length ? liveBundle.demoWorkflow : fallbackProfile.demoWorkflow,
    recommendations: liveBundle.recommendations || [],
    monthlySalesDemo: liveBundle.monthlySalesDemo || null,
  };
};

const Dashboard = () => {
  const { t, formatCompactNumber } = useI18n();
  const [activeCluster, setActiveCluster] = useState('Tiruppur');
  const [selectedCity, setSelectedCity] = useState('Tiruppur');
  const [selectedFactoryName, setSelectedFactoryName] = useState('');
  const [factoryStatusFilter, setFactoryStatusFilter] = useState('All');
  const [demoMode, setDemoMode] = useState(true);
  const [demoStep, setDemoStep] = useState(0);
  const [liveBundle, setLiveBundle] = useState(null);
  const [liveError, setLiveError] = useState('');
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [predictiveAlerts, setPredictiveAlerts] = useState([]);
  
  const [counts, setCounts] = useState({
    fabricSaved: 0,
    exchanges: 0,
    factories: 0,
    moneySaved: 0,
  });

  const fallbackProfile = clusterProfiles[activeCluster] || clusterProfiles['All Clusters'];
  const activeProfile = useMemo(
    () => mergeProfileWithLiveBundle(fallbackProfile, liveBundle),
    [fallbackProfile, liveBundle],
  );

  useEffect(() => {
    setLiveError('');

    const unsubscribe = subscribeToDashboardBundle(
      activeCluster,
      (bundle) => {
        setLiveBundle(bundle);
      },
      (error) => {
        console.error(error);
        const code = error?.code ? `[${error.code}] ` : '';
        const message = error?.message ? ` ${error.message}` : '';
        setLiveError(`Live Firestore dashboard data failed to load. ${code}Showing demo fallback data.${message}`);
      },
    );

    return () => unsubscribe();
  }, [activeCluster]);

  useEffect(() => {
    const unsubscribe = subscribeToPredictiveSurplusAlerts(
      (alerts) => setPredictiveAlerts(alerts),
      (error) => {
        console.error(error);
      },
    );

    return () => unsubscribe();
  }, []);
  const profileCities = activeProfile.nearbyCities;
  const profileStats = activeProfile.stats;

  useEffect(() => {
    const firstCity = profileCities[0]?.name || 'Tiruppur';
    setSelectedCity(firstCity);
    setDemoStep(0);
  }, [activeCluster, profileCities]);

  useEffect(() => {
    const targets = profileStats;
    const steps = 100;
    const increment = {
      fabricSaved: targets.fabricSaved / steps,
      exchanges: targets.exchanges / steps,
      factories: targets.factories / steps,
      moneySaved: targets.moneySaved / steps,
    };

    setCounts({ fabricSaved: 0, exchanges: 0, factories: 0, moneySaved: 0 });

    const interval = setInterval(() => {
      setCounts((prev) => ({
        fabricSaved: Math.min(prev.fabricSaved + increment.fabricSaved, targets.fabricSaved),
        exchanges: Math.min(prev.exchanges + increment.exchanges, targets.exchanges),
        factories: Math.min(prev.factories + increment.factories, targets.factories),
        moneySaved: Math.min(prev.moneySaved + increment.moneySaved, targets.moneySaved),
      }));
    }, 16);

    return () => clearInterval(interval);
  }, [activeCluster, profileStats]);

  useEffect(() => {
    if (!demoMode) return undefined;

    const interval = setInterval(() => {
      setDemoStep((current) => (current + 1) % activeProfile.demoWorkflow.length);
    }, 2400);

    return () => clearInterval(interval);
  }, [demoMode, activeCluster, activeProfile.demoWorkflow.length]);

  

  const currentCity = useMemo(() => {
    return activeProfile.nearbyCities.find((city) => city.name === selectedCity) || activeProfile.nearbyCities[0];
  }, [activeProfile, selectedCity]);

  const visibleFactories = useMemo(() => {
    const filtered = activeProfile.localFactories.filter((factory) => {
      const matchesCity = factory.city === currentCity?.name;
      const matchesStatus = factoryStatusFilter === 'All' || factory.status === factoryStatusFilter;
      return matchesCity && matchesStatus;
    });
    return filtered;
  }, [activeProfile, currentCity, factoryStatusFilter]);

  useEffect(() => {
    setSelectedFactoryName((current) => {
      const stillVisible = visibleFactories.some((factory) => factory.name === current);
      return stillVisible ? current : visibleFactories[0]?.name || '';
    });
  }, [visibleFactories]);

  const selectedFactory = useMemo(
    () => visibleFactories.find((factory) => factory.name === selectedFactoryName) || visibleFactories[0] || null,
    [selectedFactoryName, visibleFactories],
  );

  const selectedFactoryCity = useMemo(
    () => activeProfile.nearbyCities.find((city) => city.name === selectedFactory?.city) || null,
    [activeProfile.nearbyCities, selectedFactory],
  );

  const verifiedVisibleCount = useMemo(
    () => visibleFactories.filter((factory) => factory.status === 'Verified').length,
    [visibleFactories],
  );

  const visibleFactoryNames = useMemo(
    () => visibleFactories.map((factory) => factory.name).join('|'),
    [visibleFactories],
  );

  const cityMarkers = useMemo(
    () => activeProfile.nearbyCities.map((city, index) => {
      const latLng = resolveCityLatLng(city);
      const point = toPanelPoint(latLng.lat, latLng.lng, index);
      return {
        ...city,
        ...latLng,
        x: Number.isFinite(Number(city.x)) ? Number(city.x) : point.x,
        y: Number.isFinite(Number(city.y)) ? Number(city.y) : point.y,
      };
    }),
    [activeProfile],
  );

  const selectedMarker = useMemo(
    () => cityMarkers.find((city) => city.name === currentCity?.name) || cityMarkers[0] || INDIA_CENTER,
    [cityMarkers, currentCity],
  );

  const selectedFactoryMarker = useMemo(
    () => {
      if (!selectedFactoryCity) return resolveCityLatLng({ name: selectedFactory?.city || currentCity?.name || 'Tiruppur' });
      return resolveCityLatLng(selectedFactoryCity);
    },
    [currentCity?.name, selectedFactory?.city, selectedFactoryCity],
  );

  const routeDistanceKm = useMemo(
    () => {
      if (!selectedFactoryCity) return 0;
      return haversineKm(selectedMarker, selectedFactoryMarker);
    },
    [selectedFactoryCity, selectedMarker, selectedFactoryMarker],
  );

  const baseRecommendation = useMemo(() => {
    const liveRecommendation =
      activeProfile.recommendations?.find((entry) => entry.city === (currentCity?.name || '')) ||
      activeProfile.recommendations?.[0];

    if (liveRecommendation) {
      return {
        title: liveRecommendation.title,
        summary: liveRecommendation.summary,
        reasons: liveRecommendation.reasons?.length ? liveRecommendation.reasons : ['No recommendation reasons provided.'],
        confidence: `${Math.round((liveRecommendation.confidence || 0.8) * 100)}% confidence`,
        action: `Launch deal from ${currentCity?.name || activeCluster}`,
      };
    }

    const city = currentCity || activeProfile.nearbyCities[0];
    const factory = visibleFactories[0] || activeProfile.localFactories[0];
    const trustBoost = Math.max(city?.verified || 0, visibleFactories.filter((entry) => entry.status === 'Verified').length);
    const confidence = Math.min(99, Math.max(city?.match || 80, 80));

    return {
      title: `Prioritize ${city?.name || 'this cluster'} first`,
      summary: `The selected city has ${city?.factories || 0} local factories, ${trustBoost} verified partners, and the strongest savings path across the live network.`,
      reasons: [
        `${city?.factories || 0} nearby factories inside the current radius`,
        `${trustBoost} verified partners already available for routing`,
        `Estimated savings of ${formatCompactCurrency(activeProfile.stats.moneySaved)} in the current cluster`,
      ],
      confidence: `${confidence}% confidence`,
      action: `Launch deal from ${factory?.name || 'local factory'}`,
    };
  }, [activeProfile, activeCluster, currentCity, visibleFactories]);

  const requestGeminiRecommendation = useCallback(async () => {
    if (!currentCity?.name) return;

    try {
      setAiError('');
      setAiLoading(true);

      const nextRecommendation = await generateDashboardRecommendation({
        cluster: activeCluster,
        city: currentCity.name,
        cityFactoryCount: currentCity.factories || 0,
        verifiedFactoryCount: verifiedVisibleCount,
        matchScore: currentCity.match || 80,
        moneySavedInr: activeProfile.stats.moneySaved || 0,
        selectedFactory: selectedFactory?.name || 'local factory',
      });

      setAiRecommendation(nextRecommendation);
    } catch (error) {
      console.error(error);
      setAiRecommendation(null);
      setAiError('Gemini recommendation is unavailable right now. Showing rules-based recommendation.');
    } finally {
      setAiLoading(false);
    }
  }, [activeCluster, activeProfile.stats.moneySaved, currentCity, selectedFactory, verifiedVisibleCount]);

  useEffect(() => {
    setAiRecommendation(null);
    requestGeminiRecommendation();
  }, [requestGeminiRecommendation, visibleFactoryNames]);

  const recommendation = aiRecommendation || baseRecommendation;

  const currentDemoStep = activeProfile.demoWorkflow[demoStep % activeProfile.demoWorkflow.length];
  const savingsPoints = buildPoints(activeProfile.savings);
  const maxLifecycle = Math.max(...activeProfile.lifecycle.map((entry) => entry.value));
  const liveFactoryCount = visibleFactories.length;
  // Using static stylized SVG map as baseline; AtlasMap (MapLibre) will render underneath.

  const visiblePredictiveAlerts = useMemo(() => {
    const alertsForCluster = predictiveAlerts.filter((item) => item.cluster === activeCluster || item.cluster === 'All Clusters');
    const sorted = [...alertsForCluster].sort((a, b) => b.surplusProbability - a.surplusProbability);
    return sorted.slice(0, 3);
  }, [predictiveAlerts, activeCluster]);

  const recommendationSignals = useMemo(() => {
    const trustScore = clamp(Math.round((currentCity?.verified || 0) * 8 + (selectedFactory?.status === 'Verified' ? 22 : 8) + (verifiedVisibleCount * 2)), 18, 98);
    const capacityScore = clamp(Math.round((visibleFactories.length / Math.max(currentCity?.factories || 1, 1)) * 100), 22, 100);
    const savingsScore = clamp(Math.round((activeProfile.stats.moneySaved / 5000000) % 100) || 76, 34, 98);
    const urgencyScore = clamp(Math.round(100 - (currentCity?.match || 80) + (factoryStatusFilter === 'Review' ? 10 : 0)), 12, 96);

    return [
      {
        label: 'Distance',
        value: routeDistanceKm ? `${routeDistanceKm.toFixed(1)} km` : 'Nearby',
        detail: 'Closer routes improve pickup speed and reduce empty mileage.',
      },
      {
        label: 'Trust score',
        value: `${trustScore}%`,
        detail: 'Verified partners and active local capacity strengthen the match.',
      },
      {
        label: 'Capacity match',
        value: `${capacityScore}%`,
        detail: 'The current factory pool can absorb the surplus with lower friction.',
      },
      {
        label: 'Savings',
        value: savingsScore > 90 ? 'High' : savingsScore > 60 ? 'Strong' : 'Moderate',
        detail: 'Expected cost reduction is strong enough to keep the deal prioritized.',
      },
      {
        label: 'Urgency',
        value: `${urgencyScore}/100`,
        detail: 'Lower match confidence or review status pushes the deal up the queue.',
      },
    ];
  }, [activeProfile.stats.moneySaved, currentCity?.factories, currentCity?.match, currentCity?.verified, factoryStatusFilter, routeDistanceKm, selectedFactory, verifiedVisibleCount, visibleFactories.length]);

  const routeRiskScore = useMemo(() => {
    const baseRisk = 100 - (currentCity?.match || 80);
    const verificationPenalty = Math.max(0, 4 - (currentCity?.verified || 0)) * 7;
    const reviewPenalty = factoryStatusFilter === 'Review' ? 9 : 0;
    const routePenalty = routeDistanceKm > 200 ? 10 : routeDistanceKm > 75 ? 6 : 0;
    return clamp(Math.round(baseRisk + verificationPenalty + reviewPenalty + routePenalty), 14, 96);
  }, [currentCity?.match, currentCity?.verified, factoryStatusFilter, routeDistanceKm]);

  const nearbyMatchRankings = useMemo(() => {
    return [...activeProfile.nearbyCities]
      .map((city) => ({
        ...city,
        score: clamp(Math.round(city.match * 0.58 + city.verified * 4 + city.factories * 1.4), 10, 99),
      }))
      .sort((a, b) => b.score - a.score);
  }, [activeProfile.nearbyCities]);

  const clusterHeatmap = useMemo(() => {
    const maxFactories = Math.max(...activeProfile.nearbyCities.map((city) => city.factories || 0), 1);
    return activeProfile.nearbyCities.map((city) => ({
      ...city,
      intensity: clamp(Math.round(((city.factories || 0) / maxFactories) * 100), 18, 100),
    }));
  }, [activeProfile.nearbyCities]);

  const metrics = useMemo(
    () => [
      {
        label: t('dashboard.fabricSaved', 'Fabric Saved'),
        value: `${formatCompactNumber(counts.fabricSaved, { notation: 'compact', maximumFractionDigits: 1 })} kg`,
        icon: Package,
        color: 'text-[var(--success)]',
        bg: 'bg-[var(--success)]/10',
      },
      {
        label: t('dashboard.activeExchanges', 'Active Exchanges'),
        value: `${formatCompactNumber(counts.exchanges, { notation: 'compact', maximumFractionDigits: 0 })}+`,
        icon: TrendingUp,
        color: 'text-[var(--primary)]',
        bg: 'bg-[var(--primary)]/10',
      },
      {
        label: t('dashboard.factoriesConnected', 'Factories Connected'),
        value: `${formatCompactNumber(counts.factories, { notation: 'compact', maximumFractionDigits: 0 })}+`,
        icon: Users,
        color: 'text-[var(--info)]',
        bg: 'bg-[var(--info)]/10',
      },
      {
        label: t('dashboard.moneySaved', 'Money Saved'),
        value: formatCompactNumber(counts.moneySaved, { style: 'currency', currency: 'INR', maximumFractionDigits: 1 }),
        icon: Zap,
        color: 'text-[var(--warning)]',
        bg: 'bg-[var(--warning)]/10',
      },
    ],
    [counts, t, formatCompactNumber],
  );

  const monthlySalesDemo = useMemo(() => {
    if (activeProfile.monthlySalesDemo?.combinedSeries?.some((value) => value > 0)) {
      return activeProfile.monthlySalesDemo;
    }

    const baseWeek = activeProfile.savings?.length ? activeProfile.savings : [40, 44, 48, 55, 58, 62, 68];
    const combinedSeries = Array.from({ length: 30 }, (_, index) => {
      const weeklyBase = baseWeek[index % baseWeek.length] || baseWeek[0] || 40;
      const trend = index * 1.25;
      return Math.max(0, Math.round(weeklyBase + trend));
    });

    const streams = [
      {
        key: 'listings',
        label: 'Listings',
        roleLabel: 'Listings contribution',
        series: combinedSeries.map((value) => Math.round(value * 0.44)),
        monthlyValueInr: Math.round(activeProfile.stats.moneySaved * 0.4),
        contributionPercent: 40,
        quality: {
          qualityScore: 0.92,
          completenessScore: 1,
          consistencyScore: 0.94,
          freshnessScore: 0.88,
          valueCoverageScore: 1,
          issues: [],
        },
      },
      {
        key: 'deals',
        label: 'Deals',
        roleLabel: 'Deal conversion contribution',
        series: combinedSeries.map((value) => Math.round(value * 0.36)),
        monthlyValueInr: Math.round(activeProfile.stats.moneySaved * 0.34),
        contributionPercent: 34,
        quality: {
          qualityScore: 0.89,
          completenessScore: 0.95,
          consistencyScore: 0.9,
          freshnessScore: 0.86,
          valueCoverageScore: 0.93,
          issues: [],
        },
      },
      {
        key: 'operations',
        label: 'Operations',
        roleLabel: 'Operations contribution',
        series: combinedSeries.map((value) => Math.round(value * 0.2)),
        monthlyValueInr: Math.round(activeProfile.stats.moneySaved * 0.26),
        contributionPercent: 26,
        quality: {
          qualityScore: 0.91,
          completenessScore: 0.97,
          consistencyScore: 0.93,
          freshnessScore: 0.9,
          valueCoverageScore: 0.96,
          issues: [],
        },
      },
    ];

    const last = combinedSeries[combinedSeries.length - 1] || 0;
    const secondLast = combinedSeries[combinedSeries.length - 2] || last || 0;
    const delta = last - secondLast;
    const forecast7d = Array.from({ length: 7 }, (_, index) => Math.max(0, Math.round(last + delta * (index + 1))));
    const first = combinedSeries[0] || 0;
    const trendPercent = first ? ((last - first) / first) * 100 : 0;

    return {
      model: 'BigQuery ML (demo fallback)',
      streams,
      combinedSeries,
      forecast7d,
      baseModelConfidence: 0.76,
      confidence: 0.67,
      confidencePenalty: 0.09,
      trendPercent,
      anomalies: [],
      totalMonthlyValueInr: streams.reduce((sum, stream) => sum + stream.monthlyValueInr, 0),
      dataQuality: {
        score: 0.91,
        completeness: 0.97,
        consistency: 0.93,
        freshness: 0.88,
        valueCoverage: 0.96,
        issues: [],
      },
      roiBreakdown: {
        listingsContributionPercent: 40,
        dealConversionContributionPercent: 34,
        operationsContributionPercent: 26,
      },
    };
  }, [activeProfile]);

  const monthlySeries = monthlySalesDemo.combinedSeries || [];
  const monthlyForecast = monthlySalesDemo.forecast7d || [];
  const monthlyTotalPoints = monthlySeries.length + monthlyForecast.length;
  const monthlyScaleValues = [...monthlySeries, ...monthlyForecast];
  const monthlyMin = Math.min(...monthlyScaleValues, 0);
  const monthlyMax = Math.max(...monthlyScaleValues, 1);
  const monthlyHistoryPoints = buildIndexedPoints(monthlySeries, 0, monthlyTotalPoints, monthlyMin, monthlyMax);
  const monthlyForecastPoints = buildIndexedPoints(
    monthlyForecast,
    Math.max(monthlySeries.length - 1, 0),
    monthlyTotalPoints,
    monthlyMin,
    monthlyMax,
  );
  const monthlyHistoryAreaPoints = buildIndexedAreaPoints(monthlySeries, 0, monthlyTotalPoints, monthlyMin, monthlyMax);
  const monthlyForecastAreaPoints = buildIndexedAreaPoints(
    monthlyForecast,
    Math.max(monthlySeries.length - 1, 0),
    monthlyTotalPoints,
    monthlyMin,
    monthlyMax,
  );
  const monthlyTrend = Number(monthlySalesDemo.trendPercent || 0);
  const monthlyBaseConfidence = Math.round(Number(monthlySalesDemo.baseModelConfidence || monthlySalesDemo.confidence || 0) * 100);
  const monthlyConfidence = Math.round(Number(monthlySalesDemo.confidence || 0) * 100);
  const monthlyConfidencePenalty = Math.round(Number(monthlySalesDemo.confidencePenalty || 0) * 100);
  const monthlyDataQuality = monthlySalesDemo.dataQuality || {
    score: 0,
    completeness: 0,
    consistency: 0,
    freshness: 0,
    valueCoverage: 0,
    issues: [],
  };
  const monthlyQualityScore = Math.round(Number(monthlyDataQuality.score || 0) * 100);
  const monthlyQualityCompleteness = Math.round(Number(monthlyDataQuality.completeness || 0) * 100);
  const monthlyQualityConsistency = Math.round(Number(monthlyDataQuality.consistency || 0) * 100);
  const monthlyQualityFreshness = Math.round(Number(monthlyDataQuality.freshness || 0) * 100);
  const monthlyQualityValueCoverage = Math.round(Number(monthlyDataQuality.valueCoverage || 0) * 100);
  const overallQualityBadge = getThresholdBadge(monthlyQualityScore);
  const penaltyBadge = getThresholdBadge(monthlyConfidencePenalty, { invert: true });
  const completenessBadge = getThresholdBadge(monthlyQualityCompleteness);
  const consistencyBadge = getThresholdBadge(monthlyQualityConsistency);
  const freshnessBadge = getThresholdBadge(monthlyQualityFreshness);
  const valueCoverageBadge = getThresholdBadge(monthlyQualityValueCoverage);
  const monthlyRoiBreakdown = monthlySalesDemo.roiBreakdown || {
    listingsContributionPercent: monthlySalesDemo.streams?.find((stream) => stream.key === 'listings')?.contributionPercent || 0,
    dealConversionContributionPercent: monthlySalesDemo.streams?.find((stream) => stream.key === 'deals')?.contributionPercent || 0,
    operationsContributionPercent: monthlySalesDemo.streams?.find((stream) => stream.key === 'operations')?.contributionPercent || 0,
  };

  return (
    <div className="page page-dashboard min-h-screen pt-32 pb-20">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <motion.div
          className="absolute -top-10 left-[8%] h-44 w-44 rounded-full bg-[var(--primary)]/12 blur-3xl"
          animate={{ x: [0, 18, 0], y: [0, -10, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-40 right-[6%] h-56 w-56 rounded-full bg-[var(--secondary)]/10 blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 14, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div className="container">
        {liveError ? <ErrorBanner message={liveError} /> : null}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-12 reveal-section">
          <h1 className="text-4xl font-black mb-2">{t('dashboard.title', 'Good morning')}, {activeProfile.title} 👋</h1>
          <p className="text-[var(--text-secondary)] text-lg">{activeProfile.subtitle}</p>
          <div className="mt-3">
            <span className={`badge ${liveBundle ? 'badge-primary' : 'badge-secondary'}`}>
              {liveBundle ? 'Firebase live' : 'Demo fallback'}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="flex gap-2 mb-12 overflow-x-auto pb-3 -mx-4 px-4 reveal-section"
        >
          {clusterOrder.map((cluster) => (
            <button
              key={cluster}
              className={`btn btn-small whitespace-nowrap font-semibold ${
                activeCluster === cluster ? 'btn-primary shadow-lg' : 'btn-secondary hover:border-[var(--primary)]'
              }`}
              onClick={() => setActiveCluster(cluster)}
              aria-pressed={activeCluster === cluster}
            >
              {cluster}
            </button>
          ))}
        </motion.div>

        <div className="grid lg:grid-3 gap-6 mb-8 reveal-section">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="card lg:col-span-2"
          >
            <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
              <div className="flex items-center gap-2">
                <MapPin size={20} className="text-[var(--primary)]" />
                <h3>{t('dashboard.interactiveMap', 'Interactive Map')}</h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <div className="badge badge-primary">
                  <Route size={14} /> Atlas live map
                </div>
                <div className="badge badge-secondary">Free OSM tiles</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {factoryStatusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFactoryStatusFilter(status)}
                  className={`btn btn-small ${factoryStatusFilter === status ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {status === 'All'
                    ? t('dashboard.statusAll', 'All')
                    : status === 'Verified'
                      ? t('dashboard.statusVerified', 'Verified')
                      : t('dashboard.statusReview', 'Review')}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface-active)] shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
              <div className="relative" style={{ height: '30rem' }}>
                <AtlasMap
                  center={{ lat: currentCity?.lat || INDIA_CENTER.lat, lng: currentCity?.lng || INDIA_CENTER.lng }}
                  zoom={currentCity ? 5.4 : 4}
                  activeMarkerName={currentCity?.name || ''}
                  markers={cityMarkers.map((c) => ({
                    lat: Number(c.lat || CITY_COORDS[c.name]?.lat || INDIA_CENTER.lat),
                    lng: Number(c.lng || CITY_COORDS[c.name]?.lng || INDIA_CENTER.lng),
                    name: c.name,
                  }))}
                  onMarkerClick={(m) => setSelectedCity(m.name)}
                />

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,12,18,0.06),rgba(6,12,18,0.22))] pointer-events-none" />
              </div>

              <div className="border-t border-[var(--border)] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-black text-[var(--text)] i18n-wrap">{t('dashboard.mapTitle', 'Atlas network view')}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                      {t('dashboard.mapSubtitle', 'Real tile map with city markers and click-to-focus interaction.')}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge badge-secondary">{currentCity?.name || 'Tiruppur'}</span>
                    <span className="badge badge-secondary">{formatCompactNumber(liveFactoryCount, { notation: 'compact', maximumFractionDigits: 0 })} {t('dashboard.factoriesVisible', 'factories visible')}</span>
                    <span className="badge badge-secondary">{t('dashboard.clickCircleFocus', 'Click a circle to switch focus')}</span>
                    <span className="badge badge-primary">Map</span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">{t('dashboard.selectedCity', 'Selected city')}</p>
                    <p className="text-lg font-black mt-1">{currentCity?.name || 'Tiruppur'}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {currentCity?.factories || 0} local factories, {currentCity?.verified || 0} verified partners
                    </p>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">{t('dashboard.selectedFactory', 'Selected factory')}</p>
                    {selectedFactory ? (
                      <>
                        <p className="text-lg font-black mt-1">{selectedFactory.name}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          {selectedFactory.city} • {selectedFactory.type}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button type="button" className="btn btn-small btn-secondary" onClick={() => setSelectedFactoryName(selectedFactory.name)}>
                            {t('dashboard.focus', 'Focus')}
                          </button>
                          <span className={`badge ${selectedFactory.status === 'Verified' ? 'badge-primary' : 'badge-secondary'}`}>
                            {selectedFactory.status}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-[var(--text-muted)] mt-1">{t('dashboard.noFactoryVisible', 'No factory visible for the current filter.')}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {activeProfile.nearbyCities.map((city) => (
                <button
                  key={city.name}
                  type="button"
                  onClick={() => setSelectedCity(city.name)}
                  className={`btn btn-small ${city.name === currentCity?.name ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {city.name}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {visibleFactories.map((factory) => (
                <button
                  key={factory.name}
                  type="button"
                  onClick={() => setSelectedFactoryName(factory.name)}
                  className={`badge ${selectedFactoryName === factory.name ? 'badge-primary' : 'badge-secondary'}`}
                >
                  <Factory size={14} /> {factory.name}
                </button>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.45 }}
              className="card mt-6 border-[var(--border-light)]"
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={18} className="text-[var(--secondary)]" />
                <h3>{t('dashboard.clusterHeatmap', 'Cluster Heatmap')}</h3>
              </div>
              <div className="space-y-3">
                {activeProfile.nearbyCities.map((city) => {
                  const maxFactories = Math.max(...activeProfile.nearbyCities.map((c) => c.factories), 20);
                  const progressPercent = (city.factories / maxFactories) * 100;
                  const isActiveCity = currentCity?.name === city.name;
                  return (
                    <motion.div
                      key={city.name}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.05 }}
                      onClick={() => setSelectedCity(city.name)}
                      className={`cursor-pointer rounded-lg border transition-all ${isActiveCity ? 'border-[var(--primary)] bg-[var(--surface-active)]' : 'border-[var(--border)] hover:bg-[var(--surface-active)]'} p-3`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-[var(--text)]">{city.name}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">{city.factories} factories • {city.verified} verified • {city.match}% match</p>
                        </div>
                        <span className="text-sm font-bold text-[var(--primary)]">{Math.round(progressPercent)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${progressPercent}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
                          className="h-full rounded-full bg-gradient-to-r from-[var(--secondary)] to-[var(--primary)]"
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.45 }}
              className="card mt-6 border-[var(--border-light)]"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Why this recommendation?</p>
                  <h3 className="mt-1">Decision signals</h3>
                </div>
                <span className="badge badge-secondary">Confidence-led</span>
              </div>
              <div className="grid grid-2 gap-3">
                {recommendationSignals.map((signal) => (
                  <div key={signal.label} className="rounded-lg border border-[var(--border)] bg-[var(--surface-active)] p-3 i18n-wrap">
                    <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">{signal.label}</p>
                    <p className="text-lg font-black mt-1">{signal.value}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">{signal.detail}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          <div className="grid gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="card p-5 lg:p-6"
            >
                <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-[var(--secondary)]" />
                  <h3>{t('dashboard.aiRecommendation', 'AI Recommendation')}</h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <span className={`badge ${aiRecommendation ? 'badge-primary' : 'badge-secondary'}`}>
                    {aiRecommendation ? 'Gemini live' : 'Gemini fallback'}
                  </span>
                  <span className="badge badge-primary">{recommendation.confidence}</span>
                </div>
              </div>
              <p className="text-lg font-black text-[var(--text)]">{recommendation.title}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">{recommendation.summary}</p>
              {aiError ? <p className="text-xs text-[var(--warning)] mt-2">{aiError}</p> : null}
              <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-active)] p-3">
                <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                  <span>Recommendation confidence</span>
                  <span className="font-bold text-[var(--primary)]">{recommendation.confidence}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[var(--border)] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]" style={{ width: recommendation.confidence }} />
                </div>
              </div>
              <div className="space-y-3 mt-4">
                {recommendation.reasons.map((reason) => (
                  <div key={reason} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <CheckCircle2 size={16} className="mt-0.5 text-[var(--success)] flex-shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-2 gap-4 mt-5">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-active)] p-3">
                  <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Route risk</p>
                  <p className="text-2xl font-black mt-1">{routeRiskScore}/100</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Higher risk means the deal should move faster and stay on top of the queue.</p>
                  <div className="mt-3 h-2 rounded-full bg-[var(--border)] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--warning)]" style={{ width: `${clamp(routeRiskScore, 0, 100)}%` }} />
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-active)] p-3">
                  <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Suggested transport</p>
                  <p className="text-base font-black mt-1">{routeRiskScore > 60 ? 'Dedicated pickup' : 'Shared route bundle'}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{routeDistanceKm > 120 ? 'Use a longer buffer window and verify carrier capacity.' : 'Lean on nearby carriers to keep the route efficient.'}</p>
                  <div className="mt-3 h-2 rounded-full bg-[var(--border)] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${clamp(100 - routeRiskScore, 0, 100)}%` }} />
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary w-full mt-6"
                onClick={requestGeminiRecommendation}
                disabled={aiLoading}
              >
                {aiLoading
                  ? t('dashboard.refreshingWithGemini', 'Refreshing with Gemini...')
                  : t('dashboard.refreshWithGemini', 'Refresh with Gemini')}
              </button>
              <button className="btn btn-primary w-full mt-3">
                {recommendation.action}
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="card"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className="text-[var(--warning)]" />
                  <h3>{t('dashboard.predictiveAlerts', 'Predictive Surplus Alerts')}</h3>
                </div>
                <span className="badge badge-secondary">BigQuery ML</span>
              </div>
              <div className="space-y-3">
                {visiblePredictiveAlerts.length ? (
                  visiblePredictiveAlerts.map((alert) => (
                    <div key={alert.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-active)] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-sm text-[var(--text)]">{alert.city} • {alert.resourceType}</p>
                        <span className={`badge ${alert.severity === 'high' ? 'badge-danger' : alert.severity === 'medium' ? 'badge-warning' : 'badge-secondary'}`}>
                          {alert.severity === 'high'
                            ? t('dashboard.severityHigh', 'High')
                            : alert.severity === 'medium'
                              ? t('dashboard.severityMedium', 'Medium')
                              : t('dashboard.severityLow', 'Low')}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {t('dashboard.predictiveSummary', 'Surplus probability {probability}% in {days} days', {
                          probability: Math.round(alert.surplusProbability * 100),
                          days: alert.predictionWindowDays,
                        })}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1 i18n-wrap">{alert.recommendation}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">{t('dashboard.noPredictiveAlerts', 'No predictive alerts available for this cluster yet.')}</p>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="card"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Route size={18} className="text-[var(--primary)]" />
                  <h3>Map Intelligence</h3>
                </div>
                <span className="badge badge-secondary">Heatmap + ranking</span>
              </div>
              <div className="space-y-3">
                {nearbyMatchRankings.map((city) => (
                  <div key={city.name} className={`rounded-lg border p-3 ${city.name === currentCity?.name ? 'border-[var(--primary)] bg-[var(--surface-soft)]' : 'border-[var(--border)] bg-[var(--surface-active)]'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-sm text-[var(--text)]">{city.name}</p>
                      <span className="badge badge-primary">{city.score}%</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{city.route} • {city.factories} factories • {city.verified} verified</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-active)] p-3">
                <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Cluster heatmap</p>
                <div className="space-y-2">
                  {clusterHeatmap.map((city) => (
                    <div key={city.name} className="flex items-center gap-3">
                      <span className="w-20 text-xs font-semibold text-[var(--text-secondary)] truncate">{city.name}</span>
                      <div className="h-3 flex-1 rounded-full bg-[var(--surface-soft)] overflow-hidden shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${city.intensity}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--secondary)]"
                        />
                      </div>
                      <span className="w-10 text-right text-xs text-[var(--text-muted)]">{city.intensity}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="card"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-[var(--primary)]" />
                  <h3>{t('dashboard.demoMode', 'Demo Mode')}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDemoMode((value) => !value)}
                  className={`btn btn-small ${demoMode ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {demoMode ? <Pause size={14} /> : <Play size={14} />}
                  {demoMode ? t('dashboard.pause', 'Pause') : t('dashboard.play', 'Play')}
                </button>
              </div>

              <div className="space-y-3">
                {activeProfile.demoWorkflow.map((step, index) => {
                  const isActive = index === demoStep;
                  return (
                    <div
                      key={step.title}
                      className={`rounded-lg border p-3 ${isActive ? 'border-[var(--primary)] bg-[var(--surface-soft)]' : 'border-[var(--border)] bg-[var(--surface)]'}`}
                    >
                      <p className="text-sm font-bold text-[var(--text)]">{step.title}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{step.detail}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-active)] p-3">
                <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">{t('dashboard.currentStep', 'Current step')}</p>
                <p className="text-sm font-bold mt-1">{currentDemoStep.title}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{currentDemoStep.detail}</p>
              </div>

              <button type="button" onClick={() => setDemoStep(0)} className="btn btn-secondary w-full mt-4">
                <RefreshCw size={14} /> {t('dashboard.replayDemo', 'Replay demo')}
              </button>
            </motion.div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }} className="grid grid-4 gap-6 mb-12 reveal-section">
          {metrics.map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.6 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="card p-6 cursor-pointer group"
            >
              <div className={`w-12 h-12 rounded-lg ${metric.bg} flex-center mb-4 group-hover:scale-110 transition-transform`}>
                <metric.icon className={metric.color} size={24} />
              </div>
              <p className="text-[var(--text-tertiary)] text-xs font-bold uppercase tracking-wider mb-3">{metric.label}</p>
              <h3 className="text-3xl font-black text-[var(--text)] mb-1">{metric.value}</h3>
              <p className="text-xs text-[var(--success)] font-bold">↑ {t('dashboard.liveUpdate', 'Live Update')}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="card mb-8 reveal-section"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-[var(--secondary)]" />
              <h3>Monthly Sales Demo</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge badge-secondary">{monthlySalesDemo.model}</span>
              <span className="badge badge-primary">{monthlyConfidence}% confidence</span>
              <span className={`badge ${overallQualityBadge.className}`}>
                Data quality {monthlyQualityScore}% • {overallQualityBadge.label}
              </span>
            </div>
          </div>

          <div className="grid grid-4 gap-4 mb-6">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-active)] p-4">
              <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">30-day volume</p>
              <p className="text-xl font-black mt-1">{formatCompactNumber(monthlySeries.reduce((sum, value) => sum + value, 0), { notation: 'compact', maximumFractionDigits: 1 })}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Combined listings + deals + operations</p>
              <div className="mt-3 h-2 rounded-full bg-[var(--border)] overflow-hidden">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-[var(--secondary)] to-[var(--primary)]" />
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-active)] p-4">
              <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Trend</p>
              <p className="text-xl font-black mt-1">{monthlyTrend >= 0 ? '+' : ''}{monthlyTrend.toFixed(1)}%</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Growth from day 1 to day 30</p>
              <div className="mt-3 h-2 rounded-full bg-[var(--border)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${clamp(Math.abs(monthlyTrend), 0, 100)}%` }} />
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-active)] p-4">
              <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Projected next 7 days</p>
              <p className="text-xl font-black mt-1">{formatCompactNumber(monthlyForecast.reduce((sum, value) => sum + value, 0), { notation: 'compact', maximumFractionDigits: 1 })}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Model forecast output</p>
              <div className="mt-3 h-2 rounded-full bg-[var(--border)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--warning)]" style={{ width: '100%' }} />
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-active)] p-4">
              <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Monthly value</p>
              <p className="text-xl font-black mt-1">{formatCompactNumber(monthlySalesDemo.totalMonthlyValueInr || 0, { style: 'currency', currency: 'INR', maximumFractionDigits: 1 })}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Estimated deal value in INR</p>
              <div className="mt-3 h-2 rounded-full bg-[var(--border)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--secondary)]" style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          <div className="grid grid-3 gap-4 mb-6">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-active)] p-4">
              <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Listings contribution</p>
              <p className="text-xl font-black mt-1">{monthlyRoiBreakdown.listingsContributionPercent.toFixed(1)}%</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Share of monthly value from listing activity</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-active)] p-4">
              <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Deal conversion contribution</p>
              <p className="text-xl font-black mt-1">{monthlyRoiBreakdown.dealConversionContributionPercent.toFixed(1)}%</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Share of monthly value from converted deals</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-active)] p-4">
              <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Operations contribution</p>
              <p className="text-xl font-black mt-1">{monthlyRoiBreakdown.operationsContributionPercent.toFixed(1)}%</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Share of monthly value protected by logistics</p>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-active)] p-3 mb-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Forecast confidence discipline</p>
              <span className={`badge ${penaltyBadge.className}`}>
                Penalty {monthlyConfidencePenalty}% • {penaltyBadge.label}
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              Base model confidence {monthlyBaseConfidence}% reduced to {monthlyConfidence}% due to missing or inconsistent monthlySales30d/value fields.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3 rounded-md bg-[var(--surface)] border border-[var(--border)]">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--text)]">Completeness</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black">{monthlyQualityCompleteness}%</p>
                    <span className={`badge ${completenessBadge.className}`}>{completenessBadge.label}</span>
                  </div>
                </div>
                <div className="mt-2 h-3 rounded-full bg-[var(--border)] overflow-hidden">
                  <div className={`h-full rounded-full ${completenessBadge.className === 'badge-danger' ? 'bg-[var(--danger)]' : completenessBadge.className === 'badge-warning' ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'}`} style={{ width: `${monthlyQualityCompleteness}%` }} />
                </div>
              </div>

              <div className="p-3 rounded-md bg-[var(--surface)] border border-[var(--border)]">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--text)]">Consistency</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black">{monthlyQualityConsistency}%</p>
                    <span className={`badge ${consistencyBadge.className}`}>{consistencyBadge.label}</span>
                  </div>
                </div>
                <div className="mt-2 h-3 rounded-full bg-[var(--border)] overflow-hidden">
                  <div className={`h-full rounded-full ${consistencyBadge.className === 'badge-danger' ? 'bg-[var(--danger)]' : consistencyBadge.className === 'badge-warning' ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'}`} style={{ width: `${monthlyQualityConsistency}%` }} />
                </div>
              </div>

              <div className="p-3 rounded-md bg-[var(--surface)] border border-[var(--border)]">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--text)]">Freshness</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black">{monthlyQualityFreshness}%</p>
                    <span className={`badge ${freshnessBadge.className}`}>{freshnessBadge.label}</span>
                  </div>
                </div>
                <div className="mt-2 h-3 rounded-full bg-[var(--border)] overflow-hidden">
                  <div className={`h-full rounded-full ${freshnessBadge.className === 'badge-danger' ? 'bg-[var(--danger)]' : freshnessBadge.className === 'badge-warning' ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'}`} style={{ width: `${monthlyQualityFreshness}%` }} />
                </div>
              </div>

              <div className="p-3 rounded-md bg-[var(--surface)] border border-[var(--border)]">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--text)]">Value coverage</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black">{monthlyQualityValueCoverage}%</p>
                    <span className={`badge ${valueCoverageBadge.className}`}>{valueCoverageBadge.label}</span>
                  </div>
                </div>
                <div className="mt-2 h-3 rounded-full bg-[var(--border)] overflow-hidden">
                  <div className={`h-full rounded-full ${valueCoverageBadge.className === 'badge-danger' ? 'bg-[var(--danger)]' : valueCoverageBadge.className === 'badge-warning' ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'}`} style={{ width: `${monthlyQualityValueCoverage}%` }} />
                </div>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-3">Thresholds: quality GREEN &gt;= 85, AMBER 65-84, RED &lt; 65. Penalty GREEN &lt;= 7, AMBER 8-15, RED &gt; 15.</p>
            {monthlyDataQuality.issues?.length ? (
              <div className="mt-3 space-y-2">
                {monthlyDataQuality.issues.slice(0, 4).map((issue) => (
                  <p key={issue} className="text-xs text-[var(--warning)]">• {issue}</p>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-gradient-to-b from-[var(--surface)] to-[var(--surface-active)] p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <p className="text-sm font-black text-[var(--text)] mb-1">Monthly Sales Performance</p>
                <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Historical vs forecast</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)] flex-wrap">
                <span className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-active)] px-3 py-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]" />
                  Historical
                </span>
                <span className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-active)] px-3 py-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--warning)]" />
                  Forecast
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-b from-[rgba(10,25,35,0.95)] to-[rgba(18,30,40,0.85)] p-5 backdrop-blur-sm">
              <svg viewBox="0 0 100 40" className="block h-72 w-full overflow-visible">
                <defs>
                  <linearGradient id="monthlySalesGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.15" />
                  </linearGradient>
                  <linearGradient id="monthlyForecastGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--warning)" stopOpacity="0.65" />
                    <stop offset="100%" stopColor="var(--warning)" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                {[8, 16, 24, 32].map((lineY) => (
                  <line key={lineY} x1="4" x2="96" y1={lineY} y2={lineY} stroke="rgba(176, 200, 219, 0.15)" strokeDasharray="2 3" />
                ))}
                <polygon points={monthlyHistoryAreaPoints} fill="url(#monthlySalesGradient)" opacity="0.85" />
                <polyline
                  fill="none"
                  stroke="url(#monthlySalesGradient)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={monthlyHistoryPoints}
                />
                <polygon points={monthlyForecastAreaPoints} fill="url(#monthlyForecastGradient)" opacity="0.9" />
                <polyline
                  fill="none"
                  stroke="var(--warning)"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={monthlyForecastPoints}
                />
              </svg>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--text-muted)]">
              <span>Days 1-30: historical</span>
              <span>Days 31-37: forecast</span>
              <span>Dashed line = projected path</span>
            </div>
          </div>

          <div className="grid gap-4 mt-6 md:grid-cols-3">
            {monthlySalesDemo.streams.map((stream) => {
              const streamQuality = Math.round(Number(stream.quality?.qualityScore || 0) * 100);
              const streamBadge = getThresholdBadge(streamQuality);

              return (
                <div key={stream.key} className="rounded-lg border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface-active)] p-4 hover:border-[var(--primary)]/50 transition-all hover:shadow-lg min-h-[190px]">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] font-bold mb-1">{stream.label}</p>
                      <p className="text-2xl font-black text-[var(--text)] leading-none">{stream.series[stream.series.length - 1] || 0}</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">per day</p>
                    </div>
                    <span className={`badge ${streamBadge.className} text-xs font-bold`}>{streamBadge.label}</span>
                  </div>
                  <div className="space-y-1.5 mb-3 text-xs text-[var(--text-muted)]">
                    <p><span className="font-semibold text-[var(--text-secondary)]">30-day value:</span> {formatCompactNumber(stream.monthlyValueInr || 0, { style: 'currency', currency: 'INR', maximumFractionDigits: 1 })}</p>
                    <p><span className="font-semibold text-[var(--text-secondary)]">Contribution:</span> {(stream.contributionPercent || 0).toFixed(1)}%</p>
                  </div>
                  <div className="pt-3 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold text-[var(--text-tertiary)]">Quality Score</span>
                      <span className="text-xs font-black text-[var(--primary)]">{streamQuality}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[var(--border)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] shadow-lg"
                        style={{ width: `${streamQuality}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {monthlySalesDemo.anomalies?.length ? (
            <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-active)] p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-[var(--warning)]" />
                <p className="text-sm font-bold text-[var(--text)]">BigQuery ML anomaly signals</p>
              </div>
              <div className="space-y-2">
                {monthlySalesDemo.anomalies.map((signal) => (
                  <div key={`${signal.day}-${signal.reason}`} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] p-2">
                    <p className="text-xs text-[var(--text-secondary)]">Day {signal.day}: {signal.reason}</p>
                    <span className={`badge ${signal.severity === 'high' ? 'badge-danger' : signal.severity === 'medium' ? 'badge-warning' : 'badge-secondary'}`}>
                      {signal.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </motion.div>

        <div className="grid lg:grid-3 gap-6 reveal-section">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="card"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-[var(--primary)]" />
                <h3>{t('dashboard.savingsTrend', 'Savings Trend')}</h3>
              </div>
              <span className="badge badge-secondary">7 days</span>
            </div>
            <svg viewBox="0 0 100 40" className="w-full h-48 overflow-visible">
              <defs>
                <linearGradient id="savingsGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <polyline
                fill="none"
                stroke="url(#savingsGradient)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={savingsPoints}
              />
              {activeProfile.savings.map((value, index) => {
                const x = (index / Math.max(activeProfile.savings.length - 1, 1)) * 100;
                const max = Math.max(...activeProfile.savings);
                const min = Math.min(...activeProfile.savings);
                const range = Math.max(max - min, 1);
                const y = 36 - ((value - min) / range) * 26;
                return <circle key={index} cx={x} cy={y} r="1.4" fill="var(--primary)" />;
              })}
            </svg>
            <div className="flex justify-between text-xs text-[var(--text-muted)] mt-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-[var(--secondary)]" />
              <h3>{t('dashboard.matchQuality', 'Match Quality')}</h3>
            </div>
            <div className="space-y-4">
              {activeProfile.matchQuality.map((entry) => (
                <div key={entry.label}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-semibold text-[var(--text)]">{entry.label}</span>
                    <span className="text-[var(--text-muted)]">{entry.value}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-[var(--surface-soft)] overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${entry.value}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-4">
              <Route size={18} className="text-[var(--info)]" />
              <h3>{t('dashboard.dealLifecycle', 'Deal Lifecycle')}</h3>
            </div>
            <div className="space-y-4">
              {activeProfile.lifecycle.map((entry) => (
                <div key={entry.label}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-semibold text-[var(--text)]">{entry.label}</span>
                    <span className="text-[var(--text-muted)]">{entry.value}</span>
                  </div>
                  <div className="h-4 rounded-full bg-[var(--surface-soft)] overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${Math.max((entry.value / maxLifecycle) * 100, 14)}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-[var(--info)] to-[var(--success)]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-2 gap-6 mt-8 reveal-section">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.55, duration: 0.6 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={18} className="text-[var(--primary)]" />
              <h3>{t('dashboard.verification', 'Verification')}</h3>
            </div>
            <div className="grid grid-3 gap-3">
              {activeProfile.verification.map((item) => (
                <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--surface-active)] p-3">
                  <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">{item.label}</p>
                  <p className="text-xl font-black text-[var(--text)] mt-1">{item.value}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{item.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {visibleFactories.map((factory) => (
                <span
                  key={`${factory.name}-${factory.city}`}
                  className={`badge ${factory.status === 'Verified' ? 'badge-primary' : 'badge-secondary'}`}
                >
                  <BadgeCheck size={14} /> {factory.name} • {factory.status}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={18} className="text-[var(--warning)]" />
              <h3>{t('dashboard.auditTrail', 'Audit Trail')}</h3>
            </div>
            <div className="space-y-3">
              {activeProfile.auditTrail.map((item) => (
                <div key={`${item.time}-${item.action}`} className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-active)] p-3">
                  <div className="w-12 text-xs font-bold text-[var(--text-muted)]">{item.time}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[var(--text)]">{item.action}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">{item.actor}</p>
                  </div>
                  <span className="badge badge-secondary">{item.status}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="card mt-8 reveal-section"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div className="flex items-center gap-2">
              <Factory size={18} className="text-[var(--secondary)]" />
              <h3>{t('dashboard.liveActivity', 'Live Activity')}</h3>
            </div>
            <span className="badge badge-primary">{activeCluster}</span>
          </div>
          <div className="space-y-4">
            {activeProfile.feed.map((item, index) => (
              <motion.div
                key={`${item.time}-${index}`}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="flex gap-4 pb-4 border-b border-[var(--border)] last:border-0"
              >
                <div className="w-2 h-2 rounded-full bg-[var(--primary)] mt-2 flex-shrink-0" />
                <div>
                  <p className="text-[var(--text)] text-sm font-medium">{item.event}</p>
                  <p className="text-[var(--text-muted)] text-xs mt-1">{item.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;

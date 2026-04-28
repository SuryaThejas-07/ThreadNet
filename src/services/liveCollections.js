import { collection, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const DEFAULT_ANALYTICS_RANGES = ['7d', '30d', '90d'];

const toDateValue = (value) => (value?.toDate ? value.toDate() : null);

const mapAnalyticsPoint = (snapshotDoc) => {
  const data = snapshotDoc.data();
  return {
    id: snapshotDoc.id,
    range: data.range || '30d',
    label: data.label || snapshotDoc.id,
    savings: Number(data.savings || 0),
    deals: Number(data.deals || 0),
    emissions: Number(data.emissions || 0),
    order: Number(data.order || 0),
    createdAt: toDateValue(data.createdAt),
  };
};

const mapClusterComparison = (snapshotDoc) => {
  const data = snapshotDoc.data();
  return {
    id: snapshotDoc.id,
    cluster: data.cluster || snapshotDoc.id,
    savings: Number(data.savings || 0),
    deals: Number(data.deals || 0),
    order: Number(data.order || 0),
  };
};

const mapDeal = (snapshotDoc) => {
  const data = snapshotDoc.data();
  return {
    id: snapshotDoc.id,
    buyer: data.buyer || 'Unknown Buyer',
    seller: data.seller || 'Unknown Seller',
    item: data.item || 'Untitled Item',
    offer: Number(data.offer || 0),
    status: data.status || 'Negotiation',
    contract: data.contract || 'Draft',
    order: data.order || 'Awaiting Acceptance',
    messages: Number(data.messages || 0),
    notes: data.notes || '',
    city: data.city || '',
    monthlySales30d: Array.isArray(data.monthlySales30d) ? data.monthlySales30d : [],
    monthlyDealValueInr: Number(data.monthlyDealValueInr || 0),
    updatedAt: toDateValue(data.updatedAt),
    createdAt: toDateValue(data.createdAt),
  };
};

const mapOperation = (snapshotDoc) => {
  const data = snapshotDoc.data();
  return {
    id: snapshotDoc.id,
    route: data.route || 'Unknown Route',
    stage: data.stage || 'Pickup Requested',
    milestone: data.milestone || 'Pending',
    eta: data.eta || 'TBD',
    exception: data.exception || 'None',
    city: data.city || '',
    priority: data.priority || 'Normal',
    carrierName: data.carrierName || '',
    driverName: data.driverName || '',
    truckNumber: data.truckNumber || '',
    driverPhone: data.driverPhone || '',
    dispatcherPhone: data.dispatcherPhone || '',
    routeDistanceKm: Number(data.routeDistanceKm || 0),
    delayMinutes: Number(data.delayMinutes || 0),
    proofStatus: data.proofStatus || '',
    monthlySales30d: Array.isArray(data.monthlySales30d) ? data.monthlySales30d : [],
    monthlyRouteRevenueInr: Number(data.monthlyRouteRevenueInr || 0),
    updatedAt: toDateValue(data.updatedAt),
    createdAt: toDateValue(data.createdAt),
  };
};

const mapAdminUser = (snapshotDoc) => {
  const data = snapshotDoc.data();
  return {
    id: snapshotDoc.id,
    name: data.name || 'Unnamed User',
    role: data.role || 'Factory Owner',
    status: data.status || 'Active',
    email: data.email || '',
    updatedAt: toDateValue(data.updatedAt),
  };
};

const mapModerationItem = (snapshotDoc) => {
  const data = snapshotDoc.data();
  return {
    id: snapshotDoc.id,
    item: data.item || 'Untitled item',
    reason: data.reason || 'Review required',
    priority: data.priority || 'Medium',
    status: data.status || 'Open',
    updatedAt: toDateValue(data.updatedAt),
  };
};

const mapSystemMetric = (snapshotDoc) => {
  const data = snapshotDoc.data();
  return {
    metric: data.metric || snapshotDoc.id,
    value: data.value || 'Unknown',
    status: data.status || 'Watch',
    updatedAt: toDateValue(data.updatedAt),
  };
};

const mapFeatureFlags = (snapshotDoc) => {
  const data = snapshotDoc.exists() ? snapshotDoc.data() : {};
  return {
    smartRouting: Boolean(data.smartRouting),
    autoModeration: Boolean(data.autoModeration),
    contractAutoSign: Boolean(data.contractAutoSign),
  };
};

export const subscribeToAnalyticsData = (onNext, onError) => {
  let analyticsPoints = [];
  let clusterRows = [];

  const emit = () => {
    const seriesByRange = DEFAULT_ANALYTICS_RANGES.reduce((acc, range) => {
      acc[range] = analyticsPoints.filter((item) => item.range === range).sort((a, b) => a.order - b.order);
      return acc;
    }, {});

    onNext({
      seriesByRange,
      clusterComparison: clusterRows.sort((a, b) => a.order - b.order),
      isLive: analyticsPoints.length > 0 || clusterRows.length > 0,
    });
  };

  const stopSeries = onSnapshot(
    collection(db, 'analyticsSeries'),
    (snapshot) => {
      analyticsPoints = snapshot.docs.map(mapAnalyticsPoint);
      emit();
    },
    onError,
  );

  const stopClusters = onSnapshot(
    collection(db, 'analyticsClusterComparison'),
    (snapshot) => {
      clusterRows = snapshot.docs.map(mapClusterComparison);
      emit();
    },
    onError,
  );

  return () => {
    stopSeries();
    stopClusters();
  };
};

export const subscribeToDealsData = (onNext, onError) => {
  return onSnapshot(
    collection(db, 'deals'),
    (snapshot) => {
      onNext(snapshot.docs.map(mapDeal));
    },
    onError,
  );
};

export const updateDealRecord = async (dealId, patch) => {
  return updateDoc(doc(db, 'deals', dealId), patch);
};

export const subscribeToOperationsData = (onNext, onError) => {
  return onSnapshot(
    collection(db, 'operations'),
    (snapshot) => {
      onNext(snapshot.docs.map(mapOperation));
    },
    onError,
  );
};

export const updateOperationRecord = async (operationId, patch) => {
  return updateDoc(doc(db, 'operations', operationId), patch);
};

export const subscribeToAdminConsoleData = (onNext, onError) => {
  let adminUsers = [];
  let moderationQueue = [];
  let systemHealth = [];
  let featureFlags = {
    smartRouting: true,
    autoModeration: false,
    contractAutoSign: false,
  };

  const emit = () => onNext({ adminUsers, moderationQueue, systemHealth, featureFlags, isLive: true });

  const stopUsers = onSnapshot(
    collection(db, 'adminUsers'),
    (snapshot) => {
      adminUsers = snapshot.docs.map(mapAdminUser);
      emit();
    },
    onError,
  );

  const stopModeration = onSnapshot(
    collection(db, 'moderationQueue'),
    (snapshot) => {
      moderationQueue = snapshot.docs.map(mapModerationItem);
      emit();
    },
    onError,
  );

  const stopHealth = onSnapshot(
    collection(db, 'systemHealth'),
    (snapshot) => {
      systemHealth = snapshot.docs.map(mapSystemMetric);
      emit();
    },
    onError,
  );

  const stopFlags = onSnapshot(
    doc(db, 'config', 'featureFlags'),
    (snapshot) => {
      featureFlags = mapFeatureFlags(snapshot);
      emit();
    },
    onError,
  );

  return () => {
    stopUsers();
    stopModeration();
    stopHealth();
    stopFlags();
  };
};

export const updateFeatureFlags = async (patch) => {
  return setDoc(doc(db, 'config', 'featureFlags'), patch, { merge: true });
};

export const updateModerationQueueItem = async (itemId, patch) => {
  return updateDoc(doc(db, 'moderationQueue', itemId), patch);
};

export const saveUserProfile = async (uid, profile) => {
  return setDoc(doc(db, 'userProfiles', uid), profile, { merge: true });
};

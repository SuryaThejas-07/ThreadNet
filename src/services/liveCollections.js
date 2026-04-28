import { collection, doc, onSnapshot, setDoc, updateDoc, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const DEFAULT_ANALYTICS_RANGES = ['7d', '30d', '90d'];
const ANALYTICS_EVENTS_COLLECTION = 'analyticsEvents';

const OPERATION_STAGE_TRANSITIONS = {
  'Pickup Scheduled': ['In Transit'],
  'In Transit': ['Delivered', 'Pickup Scheduled'],
  Delivered: ['Pickup Scheduled'],
};

const logAnalyticsEvent = async (eventType, payload = {}) => {
  try {
    await addDoc(collection(db, ANALYTICS_EVENTS_COLLECTION), {
      eventType,
      payload,
      createdAt: new Date(),
    });
  } catch {
    // Logging must never break app flows.
  }
};

const isValidOperationStageTransition = (currentStage, nextStage) => {
  if (!currentStage || !nextStage || currentStage === nextStage) return true;
  const allowedNext = OPERATION_STAGE_TRANSITIONS[currentStage] || [];
  return allowedNext.includes(nextStage);
};

export const logClientEvent = async (eventType, payload = {}) => {
  return logAnalyticsEvent(eventType, payload);
};

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
    buyerId: data.buyerId || '',
    sellerId: data.sellerId || '',
    buyer: data.buyer || 'Unknown Buyer',
    seller: data.seller || 'Unknown Seller',
    item: data.item || data.itemName || 'Untitled Item',
    itemName: data.itemName || data.item || 'Untitled Item',
    listingId: data.listingId || '',
    offer: Number(data.offer || 0),
    quantity: Number(data.quantity || 1),
    unit: data.unit || 'unit',
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
    dealId: data.dealId || '',
    route: data.route || 'Unknown Route',
    stage: data.stage || 'Pickup Scheduled',
    milestone: data.milestone || 'Pending',
    eta: data.eta || 'TBD',
    exception: data.exception || 'None',
    city: data.city || '',
    priority: data.priority || 'Normal',
    carrierName: data.carrierName || '',
    carrierId: data.carrierId || '',
    assignedTo: data.assignedTo || '',
    driverName: data.driverName || '',
    truckNumber: data.truckNumber || '',
    driverPhone: data.driverPhone || '',
    dispatcherPhone: data.dispatcherPhone || '',
    routeDistanceKm: Number(data.routeDistanceKm || 0),
    delayMinutes: Number(data.delayMinutes || 0),
    proofStatus: data.proofStatus || 'Awaiting Proof',
    itemName: data.itemName || '',
    quantity: data.quantity || 1,
    unit: data.unit || 'unit',
    sellerName: data.sellerName || '',
    buyerName: data.buyerName || '',
    assignedToId: data.assignedToId || '',
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

export const subscribeToAnalyticsData = (onNext, onError, { role = null } = {}) => {
  // Only admins should see analytics data
  if (role !== 'administrator') {
    onNext({
      seriesByRange: { '7d': [], '30d': [], '90d': [] },
      clusterComparison: [],
      isLive: false,
    });
    return () => {};
  }
  
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

export const subscribeToDealsData = (onNext, onError, { userId = null, role = null } = {}) => {
  // For admins, show all deals. For other roles, filter by user involvement (buyer or seller).
  const isAdmin = role === 'administrator';
  
  // If admin, show all deals
  if (isAdmin) {
    return onSnapshot(
      collection(db, 'deals'),
      (snapshot) => {
        onNext({
          rows: snapshot.docs.map(mapDeal),
          isLive: true,
        });
      },
      onError,
    );
  }
  
  // For regular users, filter by their involvement (STRICT - no fallback)
  if (!userId) {
    onNext({ rows: [], isLive: false });
    return () => {};
  }
  
  // Fetch all deals and filter client-side
  return onSnapshot(
    collection(db, 'deals'),
    (snapshot) => {
      const allDeals = snapshot.docs.map(mapDeal);
      
      // Filter deals where user is involved as buyer or seller (by ID only)
      const filtered = allDeals.filter((deal) => {
        const isBuyerById = deal.buyerId === userId;
        const isSellerById = deal.sellerId === userId;
        
        return isBuyerById || isSellerById;
      });
      
      onNext({
        rows: filtered, // STRICT: show filtered or empty, NEVER show all
        isLive: true,
      });
    },
    onError,
  );
};

export const updateDealRecord = async (dealId, patch) => {
  return updateDoc(doc(db, 'deals', dealId), patch);
};

export const createDealRecord = async (payload, buyerId) => {
  // Create a deal when a buyer makes an offer on a listing
  // CRITICAL: Must store buyerId and sellerId for filtering to work
  
    // Validate inputs before creating deal
    if (!buyerId || buyerId.trim() === '') {
      await logAnalyticsEvent('failed_offer_submission', {
        reason: 'missing_buyer_id',
        listingId: payload?.listing?.id || null,
      });
      throw new Error('Buyer ID is required. Please log in.');
    }

    if (!payload.listing) {
      await logAnalyticsEvent('failed_offer_submission', {
        reason: 'missing_listing',
      });
      throw new Error('Listing data is required');
    }

    if (!payload.offer || payload.offer <= 0) {
      await logAnalyticsEvent('failed_offer_submission', {
        reason: 'invalid_offer_amount',
        listingId: payload?.listing?.id || null,
        buyerId,
      });
      throw new Error('Offer must be greater than 0');
    }

    if (!payload.listing.ownerId) {
      await logAnalyticsEvent('failed_offer_submission', {
        reason: 'missing_seller_owner_id',
        listingId: payload?.listing?.id || null,
        buyerId,
      });
      throw new Error('Seller information is incomplete');
    }

  const dealData = {
    item: payload.item || payload.listing?.id || '',
    itemName: payload.listing?.title || payload.title || '',
    listingId: payload.listing?.id || payload.item || '',
    buyer: 'Your Factory', // Buyer making the offer
    seller: payload.listing?.factoryName || 'Factory Seller', // Seller who created the listing
    buyerId: buyerId, // CRITICAL: Who is making the offer
    sellerId: payload.listing?.ownerId || payload.sellerId || '', // CRITICAL: Who owns the listing
    offer: payload.offer || 0,
    quantity: payload.quantity || payload.listing?.quantity || 1,
    unit: payload.listing?.unit || 'unit',
    status: 'Negotiation', // Deal workflow: Negotiation → Accepted → Completed
    contract: 'Draft',
    order: 'Awaiting Acceptance',
    notes: payload.notes || '',
    city: payload.listing?.city || 'Unknown',
    monthlyDealValueInr: (payload.offer || 0) * (payload.quantity || 1),
    monthlySales30d: [],
    messages: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    timestamp: new Date().getTime(),
  };

  // Write to Firestore deals collection
  let docRef;
  try {
    const dealsRef = collection(db, 'deals');
    docRef = await addDoc(dealsRef, dealData);
  } catch (error) {
    await logAnalyticsEvent('failed_offer_submission', {
      reason: 'firestore_write_failed',
      listingId: payload?.listing?.id || null,
      buyerId,
      message: error?.message || 'unknown',
    });
    throw error;
  }
  
  return {
    id: docRef.id,
    ...dealData,
  };
};

export const createOperationRecord = async (dealData, assignedToId = null) => {
  // Create an operation when a deal is accepted (Logistics provider takes the order)
    // Validate deal data before creating operation
    if (!dealData) {
      await logAnalyticsEvent('failed_operation_creation', {
        reason: 'missing_deal_data',
      });
      throw new Error('Deal data is required to create operation');
    }

    if (!dealData.id) {
      await logAnalyticsEvent('failed_operation_creation', {
        reason: 'missing_deal_id',
      });
      throw new Error('Deal ID is missing');
    }

    if (!dealData.itemName || dealData.itemName.trim() === '') {
      await logAnalyticsEvent('failed_operation_creation', {
        reason: 'missing_item_name',
        dealId: dealData.id,
      });
      throw new Error('Item name is required');
    }

    if (!dealData.seller || dealData.seller.trim() === '') {
      await logAnalyticsEvent('failed_operation_creation', {
        reason: 'missing_seller',
        dealId: dealData.id,
      });
      throw new Error('Seller information is missing');
    }

    if (!dealData.city || dealData.city.trim() === '') {
      await logAnalyticsEvent('failed_operation_creation', {
        reason: 'missing_city',
        dealId: dealData.id,
      });
      throw new Error('Location is required');
    }

  const operationData = {
    dealId: dealData.id || '',
    route: `${dealData.city || 'Unknown'} → Destination`,
    stage: 'Pickup Scheduled',
    milestone: 'Order Received',
    eta: 'TBD',
    exception: 'None',
    city: dealData.city || '',
    priority: 'Normal',
    carrierName: '',
    driverName: '',
    truckNumber: '',
    driverPhone: '',
    dispatcherPhone: '',
    routeDistanceKm: 0,
    delayMinutes: 0,
    proofStatus: 'Awaiting Proof',
    assignedToId: assignedToId || '',
    itemName: dealData.itemName || dealData.item || '',
    quantity: dealData.quantity || 1,
    unit: dealData.unit || 'unit',
    sellerName: dealData.seller || '',
    buyerName: dealData.buyer || '',
    monthlySales30d: [],
    monthlyRouteRevenueInr: dealData.monthlyDealValueInr || 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let docRef;
  try {
    const operationsRef = collection(db, 'operations');
    docRef = await addDoc(operationsRef, operationData);
  } catch (error) {
    await logAnalyticsEvent('failed_operation_creation', {
      reason: 'firestore_write_failed',
      dealId: dealData.id,
      assignedToId,
      message: error?.message || 'unknown',
    });
    throw error;
  }
  
  return {
    id: docRef.id,
    ...operationData,
  };
};

export const subscribeToOperationsData = (onNext, onError, { userId = null, role = null, organization = null } = {}) => {
  // Only logistics providers and admins can see operations
  const isAdmin = role === 'administrator';
  const isLogisticsProvider = role === 'logistics_provider';
  
  if (!isAdmin && !isLogisticsProvider) {
    onNext({ rows: [], isLive: false });
    return () => {};
  }
  
  // If admin, show all operations
  if (isAdmin) {
    return onSnapshot(
      collection(db, 'operations'),
      (snapshot) => {
        onNext({
          rows: snapshot.docs.map(mapOperation),
          isLive: true,
        });
      },
      onError,
    );
  }
  
  // For logistics providers, filter by operations they are assigned to
  // Fetch all operations and filter client-side for now
  return onSnapshot(
    collection(db, 'operations'),
    (snapshot) => {
      const allOperations = snapshot.docs.map(mapOperation);
      
      // Filter operations where this logistics provider is the carrier or assigned
      const filtered = allOperations.filter((op) => {
        const isCarrierByName = op.carrierName && organization && op.carrierName.toLowerCase().includes(organization.toLowerCase());
        const isCarrierById = op.carrierId === userId;
        const isAssignedByName = op.assignedTo && organization && op.assignedTo.toLowerCase().includes(organization.toLowerCase());
        const isAssignedById = op.assignedToId === userId;
        
        return isCarrierByName || isCarrierById || isAssignedByName || isAssignedById;
      });
      
      onNext({
        rows: filtered,
        isLive: true,
      });
    },
    onError,
  );
};

export const updateOperationRecord = async (operationId, patch) => {
  const operationRef = doc(db, 'operations', operationId);

  if (patch?.stage) {
    const existing = await getDoc(operationRef);
    if (existing.exists()) {
      const currentStage = existing.data()?.stage || 'Pickup Scheduled';
      const nextStage = patch.stage;

      if (!isValidOperationStageTransition(currentStage, nextStage)) {
        await logAnalyticsEvent('invalid_status_transition', {
          entity: 'operation',
          operationId,
          fromStage: currentStage,
          toStage: nextStage,
        });
        throw new Error(`Invalid stage transition: ${currentStage} -> ${nextStage}`);
      }
    }
  }

  try {
    return await updateDoc(operationRef, patch);
  } catch (error) {
    await logAnalyticsEvent('failed_operation_update', {
      operationId,
      patch,
      message: error?.message || 'unknown',
    });
    throw error;
  }
};

export const subscribeToAdminConsoleData = (onNext, onError, { role = null } = {}) => {
  // Only admins can access admin console data
  if (role !== 'administrator') {
    onNext({
      adminUsers: [],
      moderationQueue: [],
      systemHealth: [],
      featureFlags: { smartRouting: false, autoModeration: false, contractAutoSign: false },
      isLive: false,
    });
    return () => {};
  }
  
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

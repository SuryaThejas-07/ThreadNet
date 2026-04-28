import { collection, addDoc, onSnapshot, orderBy, query, doc, updateDoc, serverTimestamp, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

const LISTINGS_COLLECTION = 'listings';

const mapListingDoc = (snapshotDoc) => {
  const data = snapshotDoc.data();

  const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
  const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : createdAt;

  return {
    id: snapshotDoc.id,
    title: data.title || 'Untitled Listing',
    resourceType: data.resourceType || data.type || 'fabric',
    factoryName: data.factoryName || 'Unknown Factory',
    ownerId: data.ownerId || '', // Owner user ID
    city: data.city || 'Unknown',
    quantity: data.quantity ?? 'TBD',
    unit: data.unit || '',
    pricePerUnit: data.pricePerUnit ?? 0,
    color: data.color || '',
    gsmWeight: data.gsmWeight ?? null,
    condition: data.condition || 'Unknown',
    matchScore: data.matchScore ?? 0,
    distanceKm: data.distanceKm ?? null,
    co2Impact: data.co2Impact ?? null,
    status: data.status || 'draft',
    mediaUrls: data.mediaUrls || [],
    monthlySales30d: Array.isArray(data.monthlySales30d) ? data.monthlySales30d : [],
    monthlyRevenueInr: data.monthlyRevenueInr ?? 0,
    version: data.version ?? 1,
    createdAt,
    updatedAt,
  };
};

export const subscribeToListings = (onNext, onError, { userId = null, role = null } = {}) => {
  const isAdmin = role === 'administrator';
  
  // If admin, show all listings
  if (isAdmin) {
    const listingQuery = query(collection(db, LISTINGS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(
      listingQuery,
      (snapshot) => {
        const listings = snapshot.docs.map(mapListingDoc);
        onNext(listings);
      },
      (error) => {
        onError(error);
      },
    );
  }
  
  // For factory owners, show only their listings (no fallback)
  const listingQuery = query(collection(db, LISTINGS_COLLECTION), orderBy('createdAt', 'desc'));
  
  return onSnapshot(
    listingQuery,
    (snapshot) => {
      const allListings = snapshot.docs.map(mapListingDoc);
      
      // Filter by owner ONLY - strict filtering, no fallback
      if (!userId) {
        onNext([]); // No user context = no listings
        return;
      }
      
      const filtered = allListings.filter((listing) => listing.ownerId === userId);
      onNext(filtered); // Show filtered or empty, NEVER show all
    },
    (error) => {
      onError(error);
    },
  );
};

export const subscribeToMarketplaceListings = (onNext, onError) => {
  const listingQuery = query(
    collection(db, LISTINGS_COLLECTION),
    where('status', 'in', ['active', 'approved']),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(
    listingQuery,
    (snapshot) => {
      onNext(snapshot.docs.map(mapListingDoc));
    },
    onError,
  );
};

export const createListingDraft = async (payload, userId) => {
  return addDoc(collection(db, LISTINGS_COLLECTION), {
    title: payload.title,
    resourceType: payload.resourceType,
    factoryName: payload.factoryName,
    city: payload.city,
    quantity: Number(payload.quantity),
    unit: payload.unit,
    pricePerUnit: Number(payload.pricePerUnit),
    color: payload.color || '',
    gsmWeight: payload.gsmWeight ? Number(payload.gsmWeight) : null,
    condition: payload.condition || 'Grade A',
    matchScore: Number(payload.matchScore || 0),
    distanceKm: payload.distanceKm ? Number(payload.distanceKm) : null,
    co2Impact: payload.co2Impact ? Number(payload.co2Impact) : null,
    status: payload.status || 'draft',
    mediaUrls: payload.mediaUrls || [],
    monthlySales30d: Array.isArray(payload.monthlySales30d) ? payload.monthlySales30d : [],
    monthlyRevenueInr: Number(payload.monthlyRevenueInr || 0),
    version: 1,
    ownerId: userId || '', // CRITICAL: Store owner ID
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateListingStatus = async (listingId, status) => {
  return updateDoc(doc(db, LISTINGS_COLLECTION, listingId), {
    status,
    updatedAt: serverTimestamp(),
  });
};

export const incrementListingVersion = async (listingId, nextVersion) => {
  return updateDoc(doc(db, LISTINGS_COLLECTION, listingId), {
    version: nextVersion,
    updatedAt: serverTimestamp(),
  });
};

export const uploadListingMedia = async (file) => {
  const path = `listing-media/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

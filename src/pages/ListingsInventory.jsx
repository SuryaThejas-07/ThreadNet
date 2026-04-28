import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Image, Plus, Save, UploadCloud, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import FormField from '../components/FormField';
import { useAuth } from '../contexts/AuthContext';
import { ROLES, normalizeRole } from '../constants/roles';
import {
  createListingDraft,
  incrementListingVersion,
  subscribeToListings,
  updateListingStatus,
  uploadListingMedia,
} from '../services/listingsService';

const STATUS_FILTERS = ['All', 'active', 'draft', 'pending approval', 'approved', 'rejected'];

const normalizeStatus = (status) => String(status || '').trim().toLowerCase();

const formatLabel = (value) =>
  String(value || '')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatDate = (date) => {
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return '—';
  }
};

const formatInrCompact = (value) => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(Number(value || 0));
  } catch {
    return `₹${value || 0}`;
  }
};

const ListingsInventory = () => {
  const { user } = useAuth();
  const role = normalizeRole(user?.role || user?.accountType || '');
  const isFactoryOwner = role === ROLES.FACTORY_OWNER;
  const isAdmin = role === ROLES.ADMINISTRATOR;
  const canCreateDraft = isFactoryOwner;
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('All');
  const [refreshTick, setRefreshTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState({
    title: '',
    resourceType: 'fabric',
    factoryName: '',
    city: '',
    quantity: '',
    unit: 'kg',
    pricePerUnit: '',
    color: '',
    gsmWeight: '',
    condition: 'Grade A',
    matchScore: '',
    distanceKm: '',
    co2Impact: '',
  });
  const [mediaUrls, setMediaUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const userId = user?.uid;
    const organization = user?.organization || '';
    const unsubscribe = subscribeToListings(
      (listings) => {
        setItems(listings);
        setLoading(false);
        setError('');
      },
      (snapshotError) => {
        console.error(snapshotError);
        setError('Could not load listings from Firestore. Check Firebase rules or connection.');
        setLoading(false);
      },
      { userId, role, organization },
    );

    return () => unsubscribe();
  }, [refreshTick, user?.uid, user?.organization, role]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filter === 'All') return true;
      return normalizeStatus(item.status) === normalizeStatus(filter);
    });
  }, [items, filter]);

  const getListingImage = (entry) => entry.coverImage || entry.mediaUrls?.[0] || '';

  const counts = useMemo(
    () => ({
      total: items.length,
      draft: items.filter((x) => normalizeStatus(x.status) === 'draft').length,
      pending: items.filter((x) => normalizeStatus(x.status) === 'pending approval' || normalizeStatus(x.status) === 'pending').length,
      approved: items.filter((x) => normalizeStatus(x.status) === 'approved' || normalizeStatus(x.status) === 'active').length,
    }),
    [items],
  );

  const handleDraftChange = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const clearDraft = () => {
    setDraft({
      title: '',
      resourceType: 'fabric',
      factoryName: '',
      city: '',
      quantity: '',
      unit: 'kg',
      pricePerUnit: '',
      color: '',
      gsmWeight: '',
      condition: 'Grade A',
      matchScore: '',
      distanceKm: '',
      co2Impact: '',
    });
    setMediaUrls([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadMedia = async (event) => {
    if (!canCreateDraft) {
      toast.error('Only Factory Owners can upload listing media.');
      return;
    }

    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const url = await uploadListingMedia(file);
        uploadedUrls.push(url);
      }
      setMediaUrls((prev) => [...prev, ...uploadedUrls]);
      toast.success('Media uploaded.');
    } catch (uploadError) {
      console.error(uploadError);
      toast.error('Media upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateDraft = async () => {
    if (!canCreateDraft) {
      toast.error('Only Factory Owners can create listing drafts.');
      return;
    }

    if (!draft.title.trim() || !draft.factoryName.trim() || !draft.city.trim() || !draft.quantity || !draft.pricePerUnit) {
      toast.error('Fill title, factory, city, quantity, and price first.');
      return;
    }

    try {
      await createListingDraft({
        ...draft,
        mediaUrls,
        status: 'draft',
      }, user?.uid);
      toast.success('Draft saved to Firestore.');
      clearDraft();
    } catch (saveError) {
      console.error(saveError);
      toast.error('Could not save draft. Check Firestore permissions.');
    }
  };

  const handleBumpVersion = async (entry) => {
    if (!canCreateDraft) {
      toast.error('Only Factory Owners can create new listing versions.');
      return;
    }

    try {
      await incrementListingVersion(entry.id, Number(entry.version || 1) + 1);
      toast.success('Version updated.');
    } catch (versionError) {
      console.error(versionError);
      toast.error('Could not update version.');
    }
  };

  const handleStatusChange = async (entry, status) => {
    try {
      await updateListingStatus(entry.id, status);
      toast.success(`Status set to ${formatLabel(status)}.`);
    } catch (statusError) {
      console.error(statusError);
      toast.error('Could not update approval state.');
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-black mb-2">Listings & Inventory</h1>
          <p className="text-[var(--text-secondary)]">
            Live Firestore listings with drafts, approval states, media uploads, and version history.
          </p>
        </motion.div>

        {error ? <ErrorBanner message={error} /> : null}

        <div className="grid lg:grid-2 gap-6 mb-8">
          <div className="card">
            <h3 className="mb-4">Create Draft</h3>
            {!canCreateDraft ? <p className="text-sm text-[var(--warning)] mb-4">Draft creation is available only for Factory Owners.</p> : null}
            <div className="grid grid-2 gap-4">
              <FormField
                id="listing-title"
                label="Title"
                placeholder="Cotton Scrap - Off White"
                value={draft.title}
                onChange={(e) => handleDraftChange('title', e.target.value)}
              />
              <FormField
                id="listing-factory"
                label="Factory Name"
                placeholder="Rajesh Textiles"
                value={draft.factoryName}
                onChange={(e) => handleDraftChange('factoryName', e.target.value)}
              />
              <FormField
                id="listing-city"
                label="City"
                placeholder="Tiruppur"
                value={draft.city}
                onChange={(e) => handleDraftChange('city', e.target.value)}
              />
              <FormField
                id="listing-quantity"
                label="Quantity"
                type="number"
                placeholder="200"
                value={draft.quantity}
                onChange={(e) => handleDraftChange('quantity', e.target.value)}
              />
              <FormField
                id="listing-unit"
                label="Unit"
                placeholder="kg"
                value={draft.unit}
                onChange={(e) => handleDraftChange('unit', e.target.value)}
              />
              <FormField
                id="listing-price"
                label="Price / Unit"
                type="number"
                placeholder="40"
                value={draft.pricePerUnit}
                onChange={(e) => handleDraftChange('pricePerUnit', e.target.value)}
              />
              <FormField
                id="listing-color"
                label="Color"
                placeholder="Off White"
                value={draft.color}
                onChange={(e) => handleDraftChange('color', e.target.value)}
              />
              <FormField
                id="listing-gsm"
                label="GSM Weight"
                type="number"
                placeholder="175"
                value={draft.gsmWeight}
                onChange={(e) => handleDraftChange('gsmWeight', e.target.value)}
              />
              <FormField
                id="listing-matchscore"
                label="Match Score"
                type="number"
                placeholder="98"
                value={draft.matchScore}
                onChange={(e) => handleDraftChange('matchScore', e.target.value)}
              />
              <FormField
                id="listing-distance"
                label="Distance (km)"
                type="number"
                placeholder="1.2"
                value={draft.distanceKm}
                onChange={(e) => handleDraftChange('distanceKm', e.target.value)}
              />
              <FormField
                id="listing-co2"
                label="CO2 Impact"
                type="number"
                placeholder="2.4"
                value={draft.co2Impact}
                onChange={(e) => handleDraftChange('co2Impact', e.target.value)}
              />
              <FormField
                id="listing-condition"
                label="Condition"
                placeholder="Grade A"
                value={draft.condition}
                onChange={(e) => handleDraftChange('condition', e.target.value)}
              />
              <div className="lg:col-span-2">
                <label className="form-label mb-2 block">Resource Type</label>
                <select value={draft.resourceType} onChange={(e) => handleDraftChange('resourceType', e.target.value)}>
                  <option value="fabric">fabric</option>
                  <option value="machines">machines</option>
                  <option value="chemicals">chemicals</option>
                  <option value="transport">transport</option>
                  <option value="services">services</option>
                </select>
              </div>
              <div className="lg:col-span-2 flex gap-3 flex-wrap">
                <button className="btn btn-primary" onClick={handleCreateDraft} disabled={uploading || !canCreateDraft}>
                  <Plus size={16} /> Save Draft
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => fileInputRef.current?.click()} disabled={!canCreateDraft}>
                  <UploadCloud size={16} /> {uploading ? 'Uploading...' : 'Upload Media'}
                </button>
                <button className="btn btn-secondary" type="button" onClick={clearDraft} disabled={!canCreateDraft}>
                  Reset
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUploadMedia}
                  className="hidden"
                />
              </div>
              {mediaUrls.length ? (
                <div className="lg:col-span-2 text-sm text-[var(--text-secondary)]">
                  {mediaUrls.length} media file(s) uploaded and will be linked to the new listing.
                </div>
              ) : null}
            </div>
          </div>

          <div className="card">
            <h3 className="mb-4">Inventory Snapshot</h3>
            <div className="grid grid-3 gap-4">
              <div className="p-4 rounded-lg bg-[var(--surface-active)]">
                <p className="text-xs text-[var(--text-tertiary)]">Total Listings</p>
                <p className="text-2xl font-black mt-1">{counts.total}</p>
              </div>
              <div className="p-4 rounded-lg bg-[var(--surface-active)]">
                <p className="text-xs text-[var(--text-tertiary)]">Drafts</p>
                <p className="text-2xl font-black mt-1">{counts.draft}</p>
              </div>
              <div className="p-4 rounded-lg bg-[var(--surface-active)]">
                <p className="text-xs text-[var(--text-tertiary)]">Pending</p>
                <p className="text-2xl font-black mt-1">{counts.pending}</p>
              </div>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-[var(--surface-active)]">
              <p className="text-xs text-[var(--text-tertiary)]">Approved / Active</p>
              <p className="text-2xl font-black mt-1">{counts.approved}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`btn btn-small ${filter === status ? 'btn-primary' : 'btn-secondary'}`}
              aria-pressed={filter === status}
            >
              {formatLabel(status)}
            </button>
          ))}
          <button className="btn btn-secondary btn-small ml-auto" onClick={() => setRefreshTick((value) => value + 1)} type="button">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <LoadingSkeleton count={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No listings in this view"
            description="Try another status filter or create a new listing draft to populate Firestore."
            actionLabel="Clear filters"
            onAction={() => setFilter('All')}
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((entry) => (
              <motion.div key={entry.id} className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="grid gap-5 lg:grid-cols-[220px_1fr] items-start">
                  <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-active)]">
                    <img src={getListingImage(entry)} alt={entry.title} className="h-44 w-full object-cover" />
                  </div>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                    <h4>{entry.title}</h4>
                    <p className="text-sm text-[var(--text-tertiary)] mt-1">
                      {entry.id} • {formatLabel(entry.resourceType)} • {entry.factoryName} • {entry.city}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Qty {entry.quantity} {entry.unit} • ₹{entry.pricePerUnit}/unit • v{entry.version}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Updated {formatDate(entry.updatedAt)} • Created {formatDate(entry.createdAt)}
                    </p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button className="btn btn-secondary btn-small" onClick={() => handleBumpVersion(entry)} disabled={!canCreateDraft}>
                        <Save size={14} /> New Version
                      </button>
                      <button className="btn btn-secondary btn-small" onClick={() => handleStatusChange(entry, 'pending approval')} disabled={!canCreateDraft}>
                        Submit
                      </button>
                      {isAdmin ? (
                        <>
                          <button className="btn btn-primary btn-small" onClick={() => handleStatusChange(entry, 'approved')}>
                            Approve
                          </button>
                          <button className="btn btn-secondary btn-small" onClick={() => handleStatusChange(entry, 'rejected')}>
                            Reject
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4 text-sm text-[var(--text-secondary)] flex-wrap">
                  <span className="badge badge-secondary">
                    <Image size={14} /> {entry.mediaUrls?.length || 0} media
                  </span>
                  <span className={`badge ${normalizeStatus(entry.status) === 'approved' || normalizeStatus(entry.status) === 'active' ? 'badge-primary' : normalizeStatus(entry.status) === 'draft' ? 'badge-secondary' : 'badge-warning'}`}>
                    {formatLabel(entry.status)}
                  </span>
                  {entry.matchScore ? <span className="badge badge-primary">{entry.matchScore}% match</span> : null}
                  {entry.distanceKm ? <span className="badge badge-secondary">{entry.distanceKm} km</span> : null}
                  {entry.co2Impact ? <span className="badge badge-secondary">{entry.co2Impact} CO2</span> : null}
                </div>

                {Array.isArray(entry.monthlySales30d) && entry.monthlySales30d.length ? (
                  <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-active)] p-3">
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">30-day example sales</p>
                    <p className="text-sm font-semibold mt-1 text-[var(--text)]">
                      {entry.monthlySales30d.slice(0, 10).join(', ')} ... {entry.monthlySales30d.slice(-3).join(', ')}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Monthly revenue example: {formatInrCompact(entry.monthlyRevenueInr)}
                    </p>
                  </div>
                ) : null}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingsInventory;

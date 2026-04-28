import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Phone, RefreshCw, Truck, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { logisticsSeed } from '../services/opsData';
import ErrorBanner from '../components/ErrorBanner';
import { subscribeToOperationsData, updateOperationRecord } from '../services/liveCollections';
import SearchFilterBar from '../components/SearchFilterBar';
import { useAuth } from '../contexts/AuthContext';
import { ROLES, normalizeRole } from '../constants/roles';

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

const OperationsLogistics = () => {
  const { user } = useAuth();
  const role = normalizeRole(user?.role || user?.accountType || '');
  const canMarkDelivered = role === ROLES.LOGISTICS_PROVIDER || role === ROLES.ADMINISTRATOR;
  const isAdmin = role === ROLES.ADMINISTRATOR;
  const [liveOperations, setLiveOperations] = useState([]);
  const [operationsLive, setOperationsLive] = useState(false);
  const [operationsError, setOperationsError] = useState('');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All');

  useEffect(() => {
    const userId = user?.uid;
    const organization = user?.organization || '';
    const unsubscribe = subscribeToOperationsData(
      ({ rows, isLive }) => {
        setLiveOperations(rows);
        setOperationsLive(Boolean(isLive));
      },
      (error) => {
        console.error(error);
        setOperationsError(`Live operations failed to load. ${error?.message || 'Showing fallback demo data.'}`);
      },
      { userId, role, organization },
    );

    return () => unsubscribe();
  }, [user?.uid, user?.organization, role]);

  const operations = operationsLive ? liveOperations : logisticsSeed;
  const filteredOperations = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return operations.filter((row) => {
      const matchesKeyword =
        !keyword || [row.id, row.route, row.stage, row.milestone, row.exception, row.city].some((value) => String(value || '').toLowerCase().includes(keyword));
      const matchesStage = stageFilter === 'All' || row.stage === stageFilter;
      return matchesKeyword && matchesStage;
    });
  }, [operations, search, stageFilter]);

  const stageOptions = ['All', 'Pickup Scheduled', 'In Transit', 'Delivered'];

  const primaryRoute = filteredOperations[0] || null;

  const setOperationPatch = (id, patch, failureMessage) => {
    // Validate patch data
    if (!id || id.trim() === '') {
      toast.error('Operation ID is required');
      return;
    }

    if (!patch || typeof patch !== 'object') {
      toast.error('Invalid operation update data');
      return;
    }

    // Validate stage transitions
    const validStages = ['Pickup Scheduled', 'In Transit', 'Delivered'];
    if (patch.stage && !validStages.includes(patch.stage)) {
      toast.error(`Invalid stage: ${patch.stage}`);
      return;
    }

    updateOperationRecord(id, { ...patch, updatedAt: new Date() })
      .then(() => {
        const action = patch.stage ? `Status changed to ${patch.stage}` : 'Operation updated';
        toast.success(`✅ ${action} successfully`);
      })
      .catch((error) => {
        console.error('Operation update failed:', error);
        const errorMsg = `${failureMessage} ${error?.message || ''}`;
        setOperationsError(errorMsg);
        toast.error(errorMsg);
      });
  };

  const markVerified = (id) => {
    setOperationPatch(id, { exception: 'None', stage: 'Delivered', milestone: 'Proof Verified' }, `Could not mark delivery as verified for route ${id}.`);
  };

  const markRejected = (id) => {
    setOperationPatch(id, { exception: 'Needs Review', stage: 'Pickup Scheduled', milestone: 'Field Review' }, `Could not reject route ${id}.`);
  };

  const assignTruck = (id) => {
    setOperationPatch(id, { stage: 'In Transit', milestone: 'Truck Assigned', exception: 'None' }, `Could not assign truck for ${id}.`);
  };

  const cycleStatus = (row) => {
    // Validate stage before cycling
    if (!row.stage) {
      toast.error('Operation stage is missing');
      return;
    }

    // Stage progression: Pickup → In Transit → Delivered → Pickup (cycle)
    let nextStage, nextMilestone, nextException;

    if (row.stage === 'Pickup Scheduled') {
      nextStage = 'In Transit';
      nextMilestone = 'Driver Moving';
      nextException = 'None';
    } else if (row.stage === 'In Transit') {
      nextStage = 'Delivered';
      nextMilestone = 'Proof Verified';
      nextException = 'None';
    } else {
      nextStage = 'Pickup Scheduled';
      nextMilestone = 'Order Received';
      nextException = 'None';
    }

    setOperationPatch(row.id, { stage: nextStage, milestone: nextMilestone, exception: nextException }, `Could not update status for ${row.id}.`);
  };

  const callRoute = (row) => {
    const phone = row.driverPhone || row.dispatcherPhone;
    if (phone) {
      window.open(`tel:${phone}`, '_self');
      toast.success(`Calling ${row.driverName || 'driver'}...`);
      return;
    }
    const errorMsg = `No phone number saved for ${row.id}. Add driverPhone or dispatcherPhone in Firestore to enable calling.`;
    setOperationsError(errorMsg);
    toast.error(errorMsg);
  };

  return (
    <div className="min-h-screen pt-32 pb-20 page page-operations">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <motion.div
          className="absolute -top-12 left-[10%] h-40 w-40 rounded-full bg-[var(--primary)]/12 blur-3xl"
          animate={{ x: [0, 16, 0], y: [0, -12, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-44 right-[8%] h-52 w-52 rounded-full bg-[var(--secondary)]/10 blur-3xl"
          animate={{ x: [0, -18, 0], y: [0, 10, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div className="container">
        {operationsError ? <ErrorBanner message={operationsError} /> : null}

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-black mb-2">Operations & Logistics</h1>
          <p className="text-[var(--text-secondary)]">
            Track pickup/delivery workflows, route status, milestones, and operational exceptions.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {user?.roleLabel ? <span className="badge badge-secondary">{user.roleLabel}</span> : null}
            <span className={`badge ${operationsLive ? 'badge-primary' : 'badge-secondary'}`}>
              {operationsLive ? 'Firebase live' : 'Demo fallback'}
            </span>
            <span className="badge badge-secondary">{filteredOperations.length} routes visible</span>
          </div>
        </motion.div>

        <SearchFilterBar
          title="Filters"
          description="Search routes and limit the queue to one logistics stage."
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Route, stage, milestone, city"
          groups={[
            {
              label: 'Stage',
              value: stageFilter,
              onChange: setStageFilter,
              options: stageOptions.map((stage) => ({ label: stage, value: stage })),
            },
          ]}
        />

        <div className="ops-mobile-panel card mb-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Mobile Ops Mode</p>
              <h3 className="mt-1">Field quick actions</h3>
            </div>
            <span className="badge badge-primary">{filteredOperations.length} routes</span>
          </div>
          {primaryRoute ? (
            <>
              <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-active)] mb-4">
                <img src={primaryRoute.routeImageUrl || ''} alt={primaryRoute.route} className="h-40 w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                <div className="absolute left-4 right-4 bottom-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/75 font-bold">Primary route</p>
                    <p className="text-lg font-black text-white mt-1">{primaryRoute.route}</p>
                  </div>
                  <span className="badge badge-primary">{primaryRoute.stage}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div className="rounded-lg bg-[var(--surface-active)] p-3">
                  <p className="text-xs text-[var(--text-tertiary)]">Milestone</p>
                  <p className="font-bold mt-1">{primaryRoute.milestone}</p>
                </div>
                <div className="rounded-lg bg-[var(--surface-active)] p-3">
                  <p className="text-xs text-[var(--text-tertiary)]">ETA</p>
                  <p className="font-bold mt-1">{primaryRoute.eta}</p>
                </div>
                <div className="rounded-lg bg-[var(--surface-active)] p-3 flex items-center gap-3 col-span-2">
                  <img src={primaryRoute.routeImageUrl || ''} alt={primaryRoute.driverName || primaryRoute.route} className="h-12 w-12 rounded-full object-cover border border-[var(--border)]" />
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Carrier</p>
                    <p className="font-semibold text-[var(--text)]">{primaryRoute.carrierName || 'Assigned carrier'}</p>
                    <p className="text-xs text-[var(--text-muted)]">{primaryRoute.driverName || 'Driver assigned'} • {primaryRoute.truckNumber || 'Truck pending'}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-2 gap-2">
                <button type="button" className="btn btn-primary" onClick={() => markVerified(primaryRoute.id)} disabled={!canMarkDelivered}>
                  <CheckCircle2 size={16} /> Approve
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => markRejected(primaryRoute.id)}>
                  <XCircle size={16} /> Reject
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => callRoute(primaryRoute)}>
                  <Phone size={16} /> Call
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => assignTruck(primaryRoute.id)}>
                  <Truck size={16} /> Assign truck
                </button>
                <button type="button" className="btn btn-secondary col-span-2" onClick={() => cycleStatus(primaryRoute)}>
                  <RefreshCw size={16} /> Update status
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">No active route available for quick actions yet.</p>
          )}
        </div>

        <div className="grid lg:grid-2 gap-6 mb-8">
          <div className="card">
            <h3 className="mb-4">Workflow Stages</h3>
            <div className="flex gap-3 flex-wrap">
              {['Pickup Requested', 'Driver Assigned', 'In Transit', 'Delivered', 'Verified'].map((step) => (
                <span className="badge badge-secondary" key={step}>
                  {step}
                </span>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="mb-4">Exceptions Queue</h3>
            <p className="text-[var(--text-secondary)]">
              {filteredOperations.filter((row) => row.exception !== 'None').length} route(s) currently need attention.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {filteredOperations.map((row) => (
            <motion.div key={row.id} className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <img src={row.routeImageUrl || ''} alt={row.route} className="h-14 w-14 rounded-xl object-cover border border-[var(--border)]" />
                  <div>
                  <h4>{row.route}</h4>
                  <p className="text-sm text-[var(--text-tertiary)] mt-1">{row.id}</p>
                  </div>
                </div>
                <span className={`badge ${row.exception === 'None' ? 'badge-primary' : 'badge-danger'}`}>
                  {row.exception === 'None' ? 'On Track' : row.exception}
                </span>
              </div>

              <div className="grid grid-3 gap-3 mt-4">
                <div className="p-3 rounded-lg bg-[var(--surface-active)]">
                  <p className="text-xs text-[var(--text-tertiary)]">Stage</p>
                  <p className="font-bold mt-1">{row.stage}</p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--surface-active)]">
                  <p className="text-xs text-[var(--text-tertiary)]">Milestone</p>
                  <p className="font-bold mt-1">{row.milestone}</p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--surface-active)]">
                  <p className="text-xs text-[var(--text-tertiary)]">ETA</p>
                  <p className="font-bold mt-1">{row.eta}</p>
                </div>
              </div>

              {Array.isArray(row.monthlySales30d) && row.monthlySales30d.length ? (
                <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-active)] p-3">
                  <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">30-day route sales example</p>
                  <p className="text-sm font-semibold mt-1 text-[var(--text)]">
                    {row.monthlySales30d.slice(0, 10).join(', ')} ... {row.monthlySales30d.slice(-3).join(', ')}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Monthly route value example: {formatInrCompact(row.monthlyRouteRevenueInr)}
                  </p>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => markVerified(row.id)} disabled={!canMarkDelivered}>
                  <CheckCircle2 size={16} /> Approve
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => markRejected(row.id)}>
                  <XCircle size={16} /> Reject
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => callRoute(row)}>
                  <Phone size={16} /> Call
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => assignTruck(row.id)}>
                  <Truck size={16} /> Assign truck
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => cycleStatus(row)}>
                  <RefreshCw size={16} /> Update status
                </button>
                {isAdmin ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                      updateOperationRecord(row.id, {
                        exception: 'None',
                        milestone: 'Admin Cleared',
                      }).catch((error) => {
                        console.error(error);
                        setOperationsError(`Could not clear exception for ${row.id}. ${error?.message || ''}`);
                      })
                    }
                  >
                    Clear Exception
                  </button>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OperationsLogistics;

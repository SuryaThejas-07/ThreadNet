import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Phone, RefreshCw, Truck, XCircle } from 'lucide-react';
import { logisticsSeed } from '../services/opsData';
import ErrorBanner from '../components/ErrorBanner';
import { subscribeToOperationsData, updateOperationRecord } from '../services/liveCollections';
import SearchFilterBar from '../components/SearchFilterBar';
import { useAuth } from '../contexts/AuthContext';

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
  const role = String(user?.role || user?.accountType || '').trim().toLowerCase();
  const canMarkDelivered = role === 'logistics_provider' || role === 'administrator';
  const isAdmin = role === 'administrator';
  const [liveOperations, setLiveOperations] = useState([]);
  const [operationsError, setOperationsError] = useState('');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All');

  useEffect(() => {
    const unsubscribe = subscribeToOperationsData(
      (rows) => setLiveOperations(rows),
      (error) => {
        console.error(error);
        setOperationsError(`Live operations failed to load. ${error?.message || 'Showing fallback demo data.'}`);
      },
    );

    return () => unsubscribe();
  }, []);

  const operations = liveOperations.length ? liveOperations : logisticsSeed;
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
    updateOperationRecord(id, patch).catch((error) => {
      console.error(error);
      setOperationsError(`${failureMessage} ${error?.message || ''}`);
    });
  };

  const markVerified = (id) => {
    setOperationPatch(id, { exception: 'None', stage: 'Delivered', milestone: 'Proof Verified' }, `Could not update route ${id}.`);
  };

  const markRejected = (id) => {
    setOperationPatch(id, { exception: 'Needs Review', stage: 'Pickup Scheduled', milestone: 'Field Review' }, `Could not reject route ${id}.`);
  };

  const assignTruck = (id) => {
    setOperationPatch(id, { stage: 'Driver Assigned', milestone: 'Truck Assigned', exception: 'None' }, `Could not assign truck for ${id}.`);
  };

  const cycleStatus = (row) => {
    const nextStage = row.stage === 'Pickup Scheduled' ? 'In Transit' : row.stage === 'In Transit' ? 'Delivered' : 'Pickup Scheduled';
    const nextMilestone = nextStage === 'Delivered' ? 'Proof Verified' : nextStage === 'In Transit' ? 'Driver Moving' : 'Pickup Scheduled';
    setOperationPatch(row.id, { stage: nextStage, milestone: nextMilestone, exception: row.exception === 'None' ? 'None' : row.exception }, `Could not update status for ${row.id}.`);
  };

  const callRoute = (row) => {
    const phone = row.driverPhone || row.dispatcherPhone;
    if (phone) {
      window.open(`tel:${phone}`, '_self');
      return;
    }
    setOperationsError(`No phone number saved for ${row.id}. Add driverPhone or dispatcherPhone in Firestore to enable calling.`);
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
            <span className={`badge ${liveOperations.length ? 'badge-primary' : 'badge-secondary'}`}>
              {liveOperations.length ? 'Live Firestore data' : 'Demo fallback data'}
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
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-active)] p-3 mb-4">
                <p className="font-bold text-[var(--text)]">{primaryRoute.route}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">{primaryRoute.stage} • {primaryRoute.milestone} • {primaryRoute.eta}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{primaryRoute.carrierName || 'Carrier'} • {primaryRoute.driverName || 'Driver'} • {primaryRoute.truckNumber || 'Truck pending'}</p>
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
                <div>
                  <h4>{row.route}</h4>
                  <p className="text-sm text-[var(--text-tertiary)] mt-1">{row.id}</p>
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

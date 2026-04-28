import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, MessageSquare, XCircle } from 'lucide-react';
import { dealsSeed } from '../services/opsData';
import ErrorBanner from '../components/ErrorBanner';
import { subscribeToDealsData, updateDealRecord } from '../services/liveCollections';
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

const DealLifecycle = () => {
  const { user } = useAuth();
  const role = String(user?.role || user?.accountType || '').trim().toLowerCase();
  const canCommercialActions = role === 'factory_owner' || role === 'administrator';
  const canLogisticsActions = role === 'logistics_provider' || role === 'administrator';
  const [liveDeals, setLiveDeals] = useState([]);
  const [dealsError, setDealsError] = useState('');
  const [selected, setSelected] = useState(dealsSeed[0]?.id || null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const unsubscribe = subscribeToDealsData(
      (rows) => {
        setLiveDeals(rows);
        setSelected((current) => current || rows[0]?.id || null);
      },
      (error) => {
        console.error(error);
        setDealsError(`Live deals failed to load. ${error?.message || 'Showing fallback demo data.'}`);
      },
    );

    return () => unsubscribe();
  }, []);

  const deals = liveDeals.length ? liveDeals : dealsSeed;

  const selectedDeal = useMemo(() => deals.find((item) => item.id === selected) || null, [deals, selected]);

  const visibleDeals = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return deals.filter((deal) => {
      const matchesKeyword =
        !keyword ||
        [deal.id, deal.item, deal.buyer, deal.seller, deal.status].some((value) =>
          String(value || '').toLowerCase().includes(keyword),
        );
      const matchesStatus = statusFilter === 'All' || deal.status === statusFilter;
      return matchesKeyword && matchesStatus;
    });
  }, [deals, search, statusFilter]);

  const updateDeal = (id, patch) => {
    updateDealRecord(id, patch).catch((error) => {
      console.error(error);
      setDealsError(`Failed to update deal ${id}. ${error?.message || ''}`);
    });
  };

  const lifecycleStatuses = ['All', 'Negotiation', 'Accepted', 'Rejected'];

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container">
        {dealsError ? <ErrorBanner message={dealsError} /> : null}

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-black mb-2">Matches & Deal Lifecycle</h1>
          <p className="text-[var(--text-secondary)]">
            Match inbox, negotiation controls, accept/reject actions, and contract/order progression.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {user?.roleLabel ? <span className="badge badge-secondary">{user.roleLabel}</span> : null}
            <span className={`badge ${liveDeals.length ? 'badge-primary' : 'badge-secondary'}`}>
              {liveDeals.length ? 'Live Firestore data' : 'Demo fallback data'}
            </span>
            <span className="badge badge-secondary">{visibleDeals.length} visible</span>
          </div>
        </motion.div>

        <SearchFilterBar
          title="Filters"
          description="Search the inbox and narrow the queue by deal status."
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buyer, seller, item, status"
          groups={[
            {
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: lifecycleStatuses.map((item) => ({ label: item, value: item })),
            },
          ]}
        />

        <div className="grid lg:grid-2 gap-6">
          <div className="card">
            <h3 className="mb-4">Match Inbox</h3>
            <div className="space-y-3">
              {visibleDeals.map((deal) => (
                <button
                  key={deal.id}
                  onClick={() => setSelected(deal.id)}
                  className={`w-full card p-4 text-left ${selected === deal.id ? 'outline-card' : ''}`}
                >
                  <p className="font-semibold text-[var(--text)]">{deal.item}</p>
                  <p className="text-sm text-[var(--text-tertiary)] mt-1">
                    {deal.buyer} ↔ {deal.seller}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className="badge badge-secondary">{deal.status}</span>
                    <span className="badge badge-primary">{deal.order}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            {selectedDeal ? (
              <>
                <h3 className="mb-3">{selectedDeal.id}</h3>
                <p className="text-[var(--text-secondary)] mb-4">{selectedDeal.item}</p>

                <div className="p-4 rounded-lg bg-[var(--surface-active)] mb-4">
                  <p className="text-xs text-[var(--text-tertiary)]">Negotiation</p>
                  <p className="text-2xl font-black mt-1">₹{selectedDeal.offer}/unit</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">{selectedDeal.messages} messages in thread</p>
                </div>

                <div className="flex gap-3 mb-5 flex-wrap">
                  {canCommercialActions ? (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() =>
                          updateDeal(selectedDeal.id, {
                            status: 'Accepted',
                            contract: 'Signed',
                            order: 'Pickup Scheduled',
                          })
                        }
                      >
                        <CheckCircle2 size={16} /> Accept
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => updateDeal(selectedDeal.id, { status: 'Negotiation', offer: selectedDeal.offer + 20 })}
                      >
                        <MessageSquare size={16} /> Counter +₹20
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() =>
                          updateDeal(selectedDeal.id, { status: 'Rejected', contract: 'Closed', order: 'Not Proceeded' })
                        }
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </>
                  ) : null}
                  {canLogisticsActions ? (
                    <button
                      className="btn btn-secondary"
                      onClick={() =>
                        updateDeal(selectedDeal.id, {
                          order: 'In Transit',
                        })
                      }
                    >
                      <CheckCircle2 size={16} /> Mark In Transit
                    </button>
                  ) : null}
                </div>

                <div className="grid grid-3 gap-3">
                  <div className="p-3 rounded-lg bg-[var(--surface-active)]">
                    <p className="text-xs text-[var(--text-tertiary)]">Deal Status</p>
                    <p className="font-bold mt-1">{selectedDeal.status}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--surface-active)]">
                    <p className="text-xs text-[var(--text-tertiary)]">Contract</p>
                    <p className="font-bold mt-1">{selectedDeal.contract}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--surface-active)]">
                    <p className="text-xs text-[var(--text-tertiary)]">Order</p>
                    <p className="font-bold mt-1">{selectedDeal.order}</p>
                  </div>
                </div>

                {Array.isArray(selectedDeal.monthlySales30d) && selectedDeal.monthlySales30d.length ? (
                  <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-active)] p-3">
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">30-day example sales</p>
                    <p className="text-sm font-semibold mt-1 text-[var(--text)]">
                      {selectedDeal.monthlySales30d.slice(0, 10).join(', ')} ... {selectedDeal.monthlySales30d.slice(-3).join(', ')}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Monthly deal value example: {formatInrCompact(selectedDeal.monthlyDealValueInr)}
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <p>Select a deal from the inbox.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealLifecycle;

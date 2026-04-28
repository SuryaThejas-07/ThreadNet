import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, MessageSquare, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { dealsSeed } from '../services/opsData';
import ErrorBanner from '../components/ErrorBanner';
import { subscribeToDealsData, updateDealRecord, createOperationRecord } from '../services/liveCollections';
import SearchFilterBar from '../components/SearchFilterBar';
import { useAuth } from '../contexts/AuthContext';
import { validateOperationCreation } from '../services/validation';
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

const DealLifecycle = () => {
  const { user } = useAuth();
  const role = normalizeRole(user?.role || user?.accountType || '');
  const canCommercialActions = role === ROLES.FACTORY_OWNER || role === ROLES.ADMINISTRATOR;
  const canLogisticsActions = role === ROLES.LOGISTICS_PROVIDER || role === ROLES.ADMINISTRATOR;
  const [liveDeals, setLiveDeals] = useState([]);
  const [dealsLive, setDealsLive] = useState(false);
  const [dealsError, setDealsError] = useState('');
  const [selected, setSelected] = useState(dealsSeed[0]?.id || null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const userId = user?.uid;
    const organization = user?.organization || '';
    const unsubscribe = subscribeToDealsData(
      ({ rows, isLive }) => {
        setLiveDeals(rows);
        setDealsLive(Boolean(isLive));
        setSelected((current) => current || rows[0]?.id || null);
      },
      (error) => {
        console.error(error);
        setDealsError(`Live deals failed to load. ${error?.message || 'Showing fallback demo data.'}`);
      },
      { userId, role, organization },
    );

    return () => unsubscribe();
  }, [user?.uid, user?.organization, role]);

  const deals = dealsLive ? liveDeals : dealsSeed;

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

  const updateDeal = async (id, patch) => {
    // Validate deal update
    if (!id || id.trim() === '') {
      toast.error('Deal ID is required');
      return;
    }

    if (!patch || typeof patch !== 'object') {
      toast.error('Invalid deal update data');
      return;
    }

    try {
      // When deal is accepted, create an operation record for logistics
      if (patch.status === 'Accepted' && selectedDeal) {
        const dealToAccept = selectedDeal;
        
        // Validate operation creation before attempting
        const opValidation = validateOperationCreation(dealToAccept, user?.uid);
        if (!opValidation.isValid) {
          const errors = opValidation.errors.join('; ');
          console.warn('Operation validation warnings:', errors);
          // Continue with deal acceptance even if operation has warnings
        }

        try {
          await createOperationRecord(dealToAccept, user?.uid);
          toast.success('✅ Operation created for logistics provider!');
        } catch (opError) {
          console.error('Error creating operation:', opError);
          toast.error(`Deal accepted. Operation issue: ${opError?.message || 'Could not create operation'}`);
        }
      }
      
      // Update deal status
      await updateDealRecord(id, { ...patch, updatedAt: new Date() });
      
      // Provide specific success message based on action
      if (patch.status === 'Accepted') {
        toast.success('✅ Deal accepted and operation created!');
      } else if (patch.status === 'Rejected') {
        toast.success('✅ Deal rejected');
      } else {
        toast.success('✅ Deal updated successfully');
      }
    } catch (error) {
      console.error('Deal update failed:', error);
      const errorMsg = error?.message || 'Failed to update deal';
      setDealsError(`Failed to update deal ${id}. ${errorMsg}`);
      toast.error(errorMsg);
    }
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
            <span className={`badge ${dealsLive ? 'badge-primary' : 'badge-secondary'}`}>
              {dealsLive ? 'Firebase live' : 'Demo fallback'}
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
                <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-active)] mb-4">
                  <img src={selectedDeal.itemImageUrl || ''} alt={selectedDeal.item} className="h-40 w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute left-4 right-4 bottom-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-white/75 font-bold">Deal snapshot</p>
                      <p className="text-xl font-black text-white mt-1">{selectedDeal.item}</p>
                    </div>
                    <span className="badge badge-primary">{selectedDeal.contract}</span>
                  </div>
                </div>
                <h3 className="mb-3">{selectedDeal.id}</h3>
                <p className="text-[var(--text-secondary)] mb-4">{selectedDeal.item}</p>

                <div className="p-4 rounded-lg bg-[var(--surface-active)] mb-4">
                  <p className="text-xs text-[var(--text-tertiary)]">Negotiation</p>
                  <p className="text-2xl font-black mt-1">₹{selectedDeal.offer}/unit</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">{selectedDeal.messages} messages in thread</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-active)] p-3 flex items-center gap-3">
                    <img src={selectedDeal.buyerAvatar || ''} alt={selectedDeal.buyer} className="h-12 w-12 rounded-full object-cover border border-[var(--border)]" />
                    <div>
                      <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Buyer</p>
                      <p className="font-semibold text-[var(--text)]">{selectedDeal.buyer}</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-active)] p-3 flex items-center gap-3">
                    <img src={selectedDeal.sellerAvatar || ''} alt={selectedDeal.seller} className="h-12 w-12 rounded-full object-cover border border-[var(--border)]" />
                    <div>
                      <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Seller</p>
                      <p className="font-semibold text-[var(--text)]">{selectedDeal.seller}</p>
                    </div>
                  </div>
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
                        <CheckCircle2 size={16} /> Accept Deal
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

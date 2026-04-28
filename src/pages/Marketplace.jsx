import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Grid3x3, List, MapPin, X } from 'lucide-react';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { marketplaceSeed } from '../services/opsData';
import { useAuth } from '../contexts/AuthContext';
import { createDealRecord, logClientEvent } from '../services/liveCollections';
import { validateDealCreation } from '../services/validation';
import { subscribeToMarketplaceListings } from '../services/listingsService';

const Marketplace = () => {
  const { user } = useAuth();
  const [view, setView] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState(null);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerNotes, setOfferNotes] = useState('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [liveListings, setLiveListings] = useState([]);
  const [marketplaceLive, setMarketplaceLive] = useState(false);
  const [searchPlaceholders] = useState([
    'Search fabric scraps...',
    'Find idle machines...',
    'Look for skilled workers...',
    'Source dye chemicals...',
  ]);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholder((p) => (p + 1) % searchPlaceholders.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [searchPlaceholders.length]);

  React.useEffect(() => {
    const unsubscribe = subscribeToMarketplaceListings(
      (rows) => {
        setLiveListings(rows);
        setMarketplaceLive(true);
        setIsLoading(false);
      },
      () => {
        setMarketplaceLive(false);
        setIsLoading(false);
      },
    );

    const timer = setTimeout(() => setIsLoading(false), 800);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const listings = useMemo(() => (marketplaceLive && liveListings.length ? liveListings : marketplaceSeed), [liveListings, marketplaceLive]);

  const filters = useMemo(
    () => ['All', 'Fabric', 'Machines', 'Workers', 'Chemicals', 'Transport'],
    [],
  );

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        item.title.toLowerCase().includes(normalizedSearch) ||
        item.city.toLowerCase().includes(normalizedSearch);

      const matchesFilter =
        activeFilter === 'All' || item.title.toLowerCase().includes(activeFilter.toLowerCase());

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, listings, searchTerm]);

  const listingPrice = (listing) => Number(listing.price ?? listing.pricePerUnit ?? 0);
  const listingDistance = (listing) => Number(listing.distance ?? listing.distanceKm ?? 0);
  const listingImage = (listing) => listing.coverImage || listing.mediaUrls?.[0] || '';
  const listingQuantity = (listing) => listing.quantity && listing.unit ? `${listing.quantity} ${listing.unit}` : listing.quantity;

  const handleMakeOffer = (listing) => {
    if (!user) {
      toast.error('Please log in to make an offer');
      return;
    }
    setSelectedListing(listing);
    setOfferAmount(listingPrice(listing) || '');
    setOfferNotes('');
  };

  const handleSubmitOffer = async () => {
    if (!selectedListing) {
      toast.error('No listing selected');
      return;
    }

    if (!user) {
      toast.error('Please log in to make an offer');
      return;
    }

    // Validate deal creation with comprehensive checks
    const validation = validateDealCreation(
      {
        listing: selectedListing,
        offer: parseFloat(offerAmount),
        quantity: 1,
      },
      user.uid
    );

    if (!validation.isValid) {
      void logClientEvent('failed_offer_submission', {
        reason: 'client_validation_failed',
        errors: validation.errors,
        listingId: selectedListing?.id || null,
        buyerId: user?.uid || null,
      });
      validation.errors.forEach((error) => toast.error(error));
      return;
    }

    setIsSubmittingOffer(true);
    try {
      const offer = parseFloat(offerAmount);

      // Create deal record with proper factory names
      await createDealRecord(
        {
          listing: {
            ...selectedListing,
            ownerId: selectedListing.ownerId || selectedListing.id,
          },
          offer,
          quantity: 1,
          notes: offerNotes,
          title: selectedListing.title,
        },
        user.uid
      );

      toast.success(`✅ Offer submitted! ${selectedListing.factoryName} will review your offer.`);
      setSelectedListing(null);
      setOfferAmount('');
      setOfferNotes('');
    } catch (error) {
      console.error('Error creating offer:', error);
      toast.error(error?.message || 'Failed to create offer. Please try again.');
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  return (
    <div className="page page-marketplace min-h-screen pt-32 pb-20">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 reveal-section"
        >
          <h1 className="text-4xl font-black mb-2">🏪 Live Marketplace</h1>
          <p className="text-[var(--text-secondary)] text-lg">
            Browse 6,200+ live listings from factories across India
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mb-8 reveal-section"
        >
          <div className="relative group">
            <Search className="absolute left-4 top-4 text-[var(--primary)]" size={20} />
            <input
              type="text"
              placeholder={searchPlaceholders[currentPlaceholder]}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search marketplace listings"
              className="w-full pl-12 py-4 text-base font-medium transition-all duration-500 group-focus-within:ring-2 group-focus-within:ring-[var(--primary)]"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs text-[var(--text-muted)] font-semibold">
              ✨ AI Powered
            </div>
          </div>
        </motion.div>

        {/* Filters & Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex items-center gap-3 mb-8 overflow-x-auto pb-3 -mx-4 px-4 reveal-section"
        >
          {filters.map((filter, i) => (
            <button
              key={i}
              onClick={() => setActiveFilter(filter)}
              aria-pressed={activeFilter === filter}
              className={`btn btn-small whitespace-nowrap font-semibold ${
                activeFilter === filter ? 'btn-primary shadow-md' : 'btn-secondary'
              }`}
            >
              {filter}
            </button>
          ))}
          <div className="ml-auto flex gap-2 flex-shrink-0">
            <button
              onClick={() => setView('grid')}
              className={`p-3 rounded-lg font-semibold transition-all ${
                view === 'grid'
                  ? 'bg-[var(--primary)] text-white shadow-lg'
                  : 'bg-[var(--surface)] text-[var(--text-tertiary)] hover:border-[var(--primary)] border border-[var(--border)]'
              }`}
            >
              <Grid3x3 size={18} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-3 rounded-lg font-semibold transition-all ${
                view === 'list'
                  ? 'bg-[var(--primary)] text-white shadow-lg'
                  : 'bg-[var(--surface)] text-[var(--text-tertiary)] hover:border-[var(--primary)] border border-[var(--border)]'
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </motion.div>

        {/* Live Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex items-center gap-2 mb-8 reveal-section"
        >
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-3 h-3 bg-[var(--success)] rounded-full shadow-lg shadow-[var(--success)]"
          />
          <span className="text-[var(--text-secondary)] text-sm font-semibold">
            Live — {filteredListings.length} active listings updated in real-time
          </span>
        </motion.div>

        {/* Listings */}
        {isLoading ? (
          <LoadingSkeleton count={view === 'grid' ? 6 : 3} />
        ) : filteredListings.length === 0 ? (
          <EmptyState
            title="No listings found"
            description="Try another keyword or switch category filters to discover resources."
            actionLabel="Clear filters"
            onAction={() => {
              setActiveFilter('All');
              setSearchTerm('');
            }}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className={`grid reveal-section ${
              view === 'grid' ? 'grid-3' : 'grid-cols-1'
            } gap-6`}
          >
            {filteredListings.map((listing, i) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="card overflow-hidden group cursor-pointer"
            >
              <div className="relative h-44 overflow-hidden">
                <img src={listingImage(listing)} alt={listing.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                <div className="absolute left-4 right-4 bottom-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/75 font-bold">{listing.category}</p>
                    <h4 className="line-clamp-2 mt-1 font-black text-white text-lg">{listing.title}</h4>
                  </div>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                    {listing.status}
                  </span>
                </div>
              </div>
              <div className="pt-4">
                <div className="flex items-center gap-1 text-[var(--text-tertiary)] text-sm mb-3 font-medium">
                  <MapPin size={14} />
                  {listing.city}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="rounded-lg bg-[var(--surface-active)] p-3">
                    <p className="text-[var(--text-tertiary)] text-xs uppercase tracking-wider">Price</p>
                    <p className="text-xl font-black text-[var(--text)] mt-1">₹{listingPrice(listing)}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--surface-active)] p-3">
                    <p className="text-[var(--text-tertiary)] text-xs uppercase tracking-wider">Match</p>
                    <p className="text-xl font-black text-[var(--primary)] mt-1">{listing.matchScore}%</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="badge badge-primary text-xs font-bold">📍 {listingDistance(listing)}km</span>
                  <span className="badge badge-secondary text-xs font-bold">{listingQuantity(listing)}</span>
                </div>
                <button
                  onClick={() => handleMakeOffer(listing)}
                  className="mt-4 w-full btn btn-primary font-bold text-sm"
                >
                  💼 Make Offer
                </button>
              </div>
            </motion.div>
            ))}
          </motion.div>
        )}

        {/* Offer Modal */}
        {selectedListing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--surface)] rounded-lg max-w-md w-full p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black">💼 Make an Offer</h3>
                <button
                  onClick={() => setSelectedListing(null)}
                  className="p-2 hover:bg-[var(--surface-active)] rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-4 p-4 bg-[var(--surface-active)] rounded-lg">
                <p className="text-[var(--text-tertiary)] text-sm mb-1">Offering on:</p>
                <p className="font-bold text-lg">{selectedListing.title}</p>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">
                  from {selectedListing.factoryName}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">
                  Your Offer Price (₹)
                </label>
                <input
                  type="number"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  placeholder="Enter your offer price"
                  className="w-full px-4 py-3 rounded-lg bg-[var(--surface-active)] border border-[var(--border)] focus:border-[var(--primary)] outline-none transition-colors font-semibold"
                />
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  Listed price: ₹{listingPrice(selectedListing)}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Notes (optional)</label>
                <textarea
                  value={offerNotes}
                  onChange={(e) => setOfferNotes(e.target.value)}
                  placeholder="Any additional notes for the seller..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--surface-active)] border border-[var(--border)] focus:border-[var(--primary)] outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedListing(null)}
                  className="flex-1 btn btn-secondary font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitOffer}
                  disabled={isSubmittingOffer}
                  className="flex-1 btn btn-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingOffer ? '⏳ Submitting...' : '✅ Submit Offer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;

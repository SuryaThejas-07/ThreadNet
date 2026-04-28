import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Grid3x3, List, MapPin } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';

const Marketplace = () => {
  const [view, setView] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
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
    const timer = setTimeout(() => setIsLoading(false), 550);
    return () => clearTimeout(timer);
  }, []);

  const listings = useMemo(
    () => [
      { id: 1, title: 'Cotton Fabric Scraps', city: 'Tiruppur', price: 450, emoji: '🧵', distance: 0 },
      { id: 2, title: 'Idle Dyeing Machine', city: 'Surat', price: 1200, emoji: '⚙️', distance: 125 },
      { id: 3, title: 'Skilled Tailors Available', city: 'Bangalore', price: 800, emoji: '👷', distance: 220 },
      { id: 4, title: 'Reactive Dyes (500L)', city: 'Panipat', price: 650, emoji: '🎨', distance: 85 },
      { id: 5, title: 'Refrigerated Truck', city: 'Ludhiana', price: 2000, emoji: '🚛', distance: 320 },
      { id: 6, title: 'Fabric Waste Collection', city: 'Coimbatore', price: 520, emoji: '🧵', distance: 150 },
    ],
    [],
  );

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
              <div className="h-24 bg-gradient-to-br from-[var(--primary)] via-[var(--secondary)] to-[#ec4899] flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                {listing.emoji}
              </div>
              <div className="pt-4">
                <h4 className="line-clamp-2 mb-2 font-bold text-[var(--text)]">{listing.title}</h4>
                <div className="flex items-center gap-1 text-[var(--text-tertiary)] text-sm mb-4 font-medium">
                  <MapPin size={14} />
                  {listing.city}
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-black text-[var(--primary)]">₹{listing.price}</span>
                  <span className="text-xs text-[var(--text-muted)]">/ unit</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="badge badge-primary text-xs font-bold">
                    📍 {listing.distance}km
                  </span>
                  <span className="badge badge-secondary text-xs font-bold">⏱️ Exp 3d</span>
                </div>
              </div>
            </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;

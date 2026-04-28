import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, TrendingUp, MapPin } from 'lucide-react';

const Matches = () => {
  const matches = [
    {
      seller: 'Tiruppur Textiles',
      sellerCity: 'Tiruppur',
      resource: '500kg Cotton Scraps',
      price: '₹450/unit',
      buyer: 'Recycling Industries',
      buyerCity: 'Coimbatore',
      product: 'Recycled Fabric',
      score: 94,
      savings: '₹12,000',
    },
    {
      seller: 'Surat Dyeing',
      sellerCity: 'Surat',
      resource: 'Dyeing Machine',
      price: '₹1,200/day',
      buyer: 'Fashion Hub Co.',
      buyerCity: 'Surat',
      product: 'Dyed Fabrics',
      score: 87,
      savings: '₹45,000',
    },
    {
      seller: 'Ludhiana Transport',
      sellerCity: 'Ludhiana',
      resource: 'Refrigerated Truck',
      price: '₹2,000/trip',
      buyer: 'Cold Chain Logistics',
      buyerCity: 'Punjab',
      product: 'Perishable Goods',
      score: 92,
      savings: '₹28,000',
    },
    {
      seller: 'Panipat Chemicals',
      sellerCity: 'Panipat',
      resource: '1000L Reactive Dyes',
      price: '₹650/unit',
      buyer: 'Premium Textiles',
      buyerCity: 'Jaipur',
      product: 'Dyed Textiles',
      score: 85,
      savings: '₹35,000',
    },
  ];

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container">
        {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h1 className="text-4xl font-black mb-4">🎯 Perfect Matches</h1>
            <p className="text-[var(--text-tertiary)] max-w-2xl mx-auto">
              AI-powered connections between suppliers and buyers across India's factory clusters
            </p>
          <p className="text-[var(--text-tertiary)] max-w-2xl mx-auto">
            AI-powered connections between suppliers and buyers across India's factory clusters
          </p>
        </motion.div>

        {/* Matches List */}
        <div className="space-y-6">
          {matches.map((match, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card"
            >
              <div className="grid lg:grid-3 gap-6">
                {/* Seller */}
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase font-semibold mb-3">
                    Seller
                  </p>
                  <h4 className="mb-2">{match.seller}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
                      <MapPin size={14} />
                      {match.sellerCity}
                    </div>
                    <div className="text-[var(--text-tertiary)]">
                      <span className="font-medium text-[var(--text)]">{match.resource}</span>
                      <br />
                      <span className="text-[var(--primary)]">{match.price}</span>
                    </div>
                  </div>
                </div>

                {/* Match Score */}
                <div className="flex flex-col items-center justify-center py-4 lg:py-0 border-t lg:border-t-0 lg:border-l lg:border-r border-[var(--border)]">
                  <div className="relative w-20 h-20 flex-center">
                    <svg className="transform -rotate-90" width="80" height="80">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="var(--border)"
                        strokeWidth="4"
                      />
                      <motion.circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="var(--success)"
                        strokeWidth="4"
                        strokeDasharray="226"
                        strokeDashoffset={226 - (226 * match.score) / 100}
                        initial={{ strokeDashoffset: 226 }}
                        whileInView={{ strokeDashoffset: 226 - (226 * match.score) / 100 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 + 0.3, duration: 0.8 }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <p className="text-xl font-bold text-[var(--text)]">{match.score}%</p>
                      <p className="text-xs text-[var(--text-muted)]">Match</p>
                    </div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + 0.5, duration: 0.6 }}
                    className="mt-4 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-[var(--success)]">
                      <TrendingUp size={16} />
                      <span className="font-semibold">{match.savings}</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Potential Savings</p>
                  </motion.div>
                </div>

                {/* Buyer */}
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase font-semibold mb-3">
                    Buyer
                  </p>
                  <h4 className="mb-2">{match.buyer}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
                      <MapPin size={14} />
                      {match.buyerCity}
                    </div>
                    <div className="text-[var(--text-tertiary)]">
                      <span className="font-medium text-[var(--text)]">{match.product}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-6 pt-6 border-t border-[var(--border)] flex gap-3">
                <button className="btn btn-primary flex-1 gap-2">
                  <CheckCircle size={16} />
                  Connect
                </button>
                <button className="btn btn-secondary flex-1">View Details</button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Matches;

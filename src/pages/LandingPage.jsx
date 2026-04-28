import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Leaf, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const stats = [
    { label: 'Fabric Saved', value: '2.4M kg', emoji: '🧵' },
    { label: 'Active Factories', value: '850+', emoji: '🏭' },
    { label: 'CO₂ Reduced', value: '12K tons', emoji: '🌍' },
  ];

  const problems = [
    {
      icon: Truck,
      title: 'Empty Truck Trips',
      desc: '30% of logistics runs operate below capacity',
      metric: '₹45 Cr loss/year',
    },
    {
      icon: Zap,
      title: 'Idle Machines',
      desc: 'Factories lack visibility into spare capacity',
      metric: '₹120 Cr waste/year',
    },
    {
      icon: Leaf,
      title: 'Waste Generation',
      desc: 'Fabric scraps dumped instead of recycled',
      metric: '2.8M tons/year',
    },
  ];

  const marqueeItems = ['TIRUPPUR', 'SURAT', 'LUDHIANA', 'COIMBATORE', 'PANIPAT', 'DELHI'];

  return (
    <div className="page page-landing min-h-screen pt-32">
      {/* Hero Section */}
      <section className="container py-20 reveal-section">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center max-w-5xl mx-auto"
        >
          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="mb-6"
          >
            <h1 className="text-5xl sm:text-6xl font-black leading-tight mb-4">
              <span className="block text-[var(--text)]">The Industrial</span>
              <span className="block bg-gradient-to-r from-[#2563eb] via-[#7c3aed] to-[#2563eb] bg-clip-text text-transparent animate-pulse">
                Intelligence Layer
              </span>
            </h1>
          </motion.div>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg sm:text-xl text-[var(--text-secondary)] mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Connecting India's factory clusters in real time. Optimize resources, reduce waste, and maximize profit across your entire supply chain.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex gap-4 justify-center flex-wrap mb-16"
          >
            <button
              onClick={() => navigate('/demo')}
              className="btn btn-primary gap-2 text-base px-8 py-3 shadow-lg hover:shadow-xl"
            >
              View Live Demo <ArrowRight size={20} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-outline gap-2 text-base px-8 py-3"
            >
              Sign In <ArrowRight size={20} />
            </button>
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.7 }}
          className="grid grid-3 gap-6 mt-20 max-w-5xl mx-auto"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -8, scale: 1.02 }}
              className="card p-8 group cursor-pointer border-t-2 border-[var(--secondary)] bg-gradient-to-b from-[var(--surface-soft)] to-[var(--surface-active)]"
            >
              <div className="text-5xl mb-5 group-hover:scale-110 transition-transform">{stat.emoji}</div>
              <p className="text-[var(--text-tertiary)] text-xs font-semibold uppercase tracking-wide mb-3">
                {stat.label}
              </p>
              <h3 className="text-3xl font-black text-[var(--text)]">{stat.value}</h3>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Marquee Section */}
      <section className="py-16 mt-16 border-y border-[var(--border)] bg-[var(--bg-secondary)] reveal-section">
        <div className="overflow-hidden">
          <motion.div
            animate={{ x: [0, -1200] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="flex gap-32 whitespace-nowrap"
          >
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span
                key={i}
                className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] opacity-40"
              >
                {item} •
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="container py-28 reveal-section">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block mb-6"
          >
            <span className="badge badge-danger text-xs font-bold px-4 py-2">
              ⚠️ THE PROBLEM
            </span>
          </motion.div>
          <h2 className="mb-6 text-4xl sm:text-5xl font-black">India loses ₹200+ Crore annually</h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-3xl mx-auto leading-relaxed">
            Fragmented supply chains, poor visibility, and manual coordination waste billions in resources and destroy margins across India's factory clusters every single year.
          </p>
        </motion.div>

        <div className="grid grid-3 gap-8 max-w-6xl mx-auto">
          {problems.map((problem, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.7 }}
              whileHover={{ y: -8 }}
              className="card p-8 border-t-2 border-[var(--danger)] flex flex-col justify-between min-h-96 bg-gradient-to-b from-[var(--surface-soft)] to-[var(--surface-active)]"
            >
                <div>
                  <div className="w-16 h-16 rounded-lg flex-center mb-6">
                    <problem.icon className="text-[var(--danger)]" size={32} />
                  </div>
                  <h4 className="mb-3 text-lg font-bold text-[var(--text)]">{problem.title}</h4>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{problem.desc}</p>
                </div>
              <div className="pt-6 border-t border-[var(--border)] mt-6">
                <p className="text-[var(--danger)] font-black text-lg">{problem.metric}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20 mb-12 reveal-section">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="card-glass p-16 text-center border border-[var(--border-light)]"
        >
          <h2 className="mb-4 text-3xl sm:text-4xl font-black">Ready to transform your supply chain?</h2>
          <p className="text-[var(--text-secondary)] mb-8 max-w-3xl mx-auto text-lg">
            Join 850+ factories already using ThreadNet to optimize their operations and save millions.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/login')}
            className="btn btn-primary gap-2 text-base px-10 py-4 shadow-xl"
          >
            Get Started <ArrowRight size={20} />
          </motion.button>
        </motion.div>
      </section>
    </div>
  );
};

export default LandingPage;

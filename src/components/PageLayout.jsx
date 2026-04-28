import React from 'react';
import { motion } from 'framer-motion';

const PageLayout = ({ children, title, subtitle, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`min-h-screen pt-32 pb-20 ${className}`}
    >
      <div className="section-wrap">
        {title && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }} className="mb-2">
              {title}
            </h1>
            {subtitle && <p style={{ color: 'var(--text2)' }}>{subtitle}</p>}
          </motion.div>
        )}
        {children}
      </div>
    </motion.div>
  );
};

export default PageLayout;

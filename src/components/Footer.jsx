import React from 'react';
import { motion } from 'framer-motion';
import { Facebook, Twitter, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import BrandWordmark from './BrandWordmark';

const Footer = () => {
  const footerLinks = {
    Product: ['Dashboard', 'Marketplace', 'Analytics', 'Resources'],
    Company: ['About Us', 'Blog', 'Careers', 'Press'],
    Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Compliance'],
    Support: ['Help Center', 'Documentation', 'Contact', 'Status'],
  };

  const social = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Mail, href: '#', label: 'Email' },
  ];

  return (
    <footer className="footer-root">
      <div className="container footer-main">
        <div className="footer-grid">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="footer-brand"
          >
            <div className="mb-4">
              <BrandWordmark className="footer-brand-mark" />
              <p className="text-sm text-[var(--text-tertiary)] mt-2">
                Industrial intelligence layer connecting factory clusters across India
              </p>
            </div>

            {/* Social Links */}
            <div className="footer-socials">
              {social.map((item, i) => (
                <motion.a
                  key={i}
                  href={item.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="footer-social-link"
                  aria-label={item.label}
                >
                  <item.icon size={18} />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([title, links], idx) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="footer-links-col"
            >
              <h4 className="font-semibold text-[var(--text)] mb-4">{title}</h4>
              <ul className="footer-links-list">
                {links.map((link, i) => (
                  <li key={i}>
                    <a href="#" className="footer-link-item">{link}</a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="footer-contact-grid"
        >
          <div className="footer-contact-item">
            <div className="footer-contact-icon icon-primary">
              <MapPin size={18} />
            </div>
            <div>
              <h5 className="font-semibold text-[var(--text)] text-sm">
                Headquarters
              </h5>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Industrial Park, Tiruppur, TN 641602, India
              </p>
            </div>
          </div>

          <div className="footer-contact-item">
            <div className="footer-contact-icon icon-success">
              <Phone size={18} />
            </div>
            <div>
              <h5 className="font-semibold text-[var(--text)] text-sm">
                Support
              </h5>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                +91 9876 543 210
              </p>
            </div>
          </div>

          <div className="footer-contact-item">
            <div className="footer-contact-icon icon-info">
              <Mail size={18} />
            </div>
            <div>
              <h5 className="font-semibold text-[var(--text)] text-sm">
                Email
              </h5>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                hello@threadnet.io
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm text-[var(--text-tertiary)]"
          >
            © 2026 ThreadNet. All rights reserved.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="footer-legal"
          >
            <a href="#" className="footer-link-item">Privacy</a>
            <a href="#" className="footer-link-item">Terms</a>
            <a href="#" className="footer-link-item">Cookies</a>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

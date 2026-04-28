import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { Moon, Sun, Menu, X } from 'lucide-react';
import CustomCursor from './components/CustomCursor';
import Footer from './components/Footer';
import BrandWordmark from './components/BrandWordmark';
import LoadingSkeleton from './components/LoadingSkeleton';
import ProtectedRoute from './components/ProtectedRoute';
import { useTheme } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import { useI18n } from './contexts/I18nContext';
import { ROLES, normalizeRole } from './constants/roles';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const ListResource = lazy(() => import('./pages/ListResource'));
const DealLifecycle = lazy(() => import('./pages/DealLifecycle'));
const Analytics = lazy(() => import('./pages/Analytics'));
const ListingsInventory = lazy(() => import('./pages/ListingsInventory'));
const OperationsLogistics = lazy(() => import('./pages/OperationsLogistics'));
const AdminConsole = lazy(() => import('./pages/AdminConsole'));
const Login = lazy(() => import('./pages/Login'));

// Loading Screen Component
const LoadingScreen = ({ isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: 1.5 }}
          className="fixed inset-0 flex flex-col items-center justify-center z-50"
          style={{
            background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center"
          >
            <BrandWordmark className="brand-wordmark-hero mb-4" />
            <p className="text-[var(--text-tertiary)] text-sm uppercase tracking-wider">
              AI Industrial Resource Allocation
            </p>
          </motion.div>

          <motion.div
            className="absolute bottom-12 h-1 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '256px' }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            style={{
              background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Navbar Component
const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, logout, user } = useAuth();
  const { t, language, setLanguage, languages } = useI18n();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentRole = normalizeRole(user?.role || user?.accountType || '');

  const navLinks = useMemo(() => {
    const links = [{ name: t('nav.dashboard', 'Dashboard'), path: '/dashboard' }];

    if (currentRole === ROLES.FACTORY_OWNER) {
      links.push(
        { name: t('nav.marketplace', 'Marketplace'), path: '/marketplace' },
        { name: t('nav.inventory', 'Inventory'), path: '/inventory' },
        { name: t('nav.deals', 'Deals'), path: '/deals' },
      );
    }

    if (currentRole === ROLES.LOGISTICS_PROVIDER) {
      links.push(
        { name: t('nav.marketplace', 'Marketplace'), path: '/marketplace' },
        { name: t('nav.ops', 'Ops'), path: '/operations' },
      );
    }

    if (currentRole === ROLES.ADMINISTRATOR) {
      links.push(
        { name: t('nav.marketplace', 'Marketplace'), path: '/marketplace' },
        { name: t('nav.inventory', 'Inventory'), path: '/inventory' },
        { name: t('nav.deals', 'Deals'), path: '/deals' },
        { name: t('nav.ops', 'Ops'), path: '/operations' },
        { name: t('nav.analytics', 'Analytics'), path: '/analytics' },
        { name: t('nav.admin', 'Admin'), path: '/admin' },
      );
    }

    return links;
  }, [currentRole, t]);

  const isActive = (path) => location.pathname === path;

  const handleAuthAction = () => {
    if (isAuthenticated) {
      logout();
      navigate('/login');
      return;
    }

    navigate('/login');
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`navbar-shell ${scrolled ? 'is-scrolled' : ''}`}
    >
      <div className={`navbar-inner ${scrolled ? 'compact' : ''}`}>
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="navbar-logo"
        >
          <BrandWordmark />
        </button>

        {/* Desktop Nav Links */}
        <div className="navbar-links">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`navbar-link ${
                isActive(link.path)
                  ? 'active'
                  : ''
              }`}
            >
              {link.name}
            </button>
          ))}
        </div>

        {/* Right Section */}
        <div className="navbar-right">
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="navbar-icon-btn navbar-language-select"
            aria-label={t('nav.language', 'Language')}
            title={t('nav.language', 'Language')}
          >
            {languages.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
          {isAuthenticated && user?.roleLabel ? <span className="badge badge-secondary hidden md:inline-flex">{user.roleLabel}</span> : null}
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="navbar-icon-btn"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun size={18} className="text-[var(--text)]" />
            ) : (
              <Moon size={18} className="text-[var(--text)]" />
            )}
          </button>

          {/* Login Button */}
          <button
            onClick={handleAuthAction}
            className="btn btn-primary navbar-login-btn"
            aria-label={isAuthenticated ? t('auth.logout', 'Logout') : t('auth.login', 'Login')}
          >
            {isAuthenticated ? t('auth.logout', 'Logout') : t('auth.login', 'Login')}
          </button>

          {/* Mobile Menu */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="navbar-mobile-btn"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scaleY: 0.8 }}
            animate={{ opacity: 1, y: 10, scaleY: 1 }}
            exit={{ opacity: 0, y: -10, scaleY: 0.8 }}
            origin={{ top: 0 }}
            className="navbar-mobile-menu"
          >
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  navigate(link.path);
                  setIsMenuOpen(false);
                }}
                className={`navbar-mobile-link ${
                  isActive(link.path)
                    ? 'active'
                    : ''
                }`}
              >
                {link.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

// Page Wrapper for animations
const PageWrapper = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

const RouteFallback = () => {
  return (
    <div className="min-h-screen pt-32 pb-20 container">
      <LoadingSkeleton count={4} />
    </div>
  );
};

const ProtectedPage = ({ children, roles }) => {
  return (
    <ProtectedRoute roles={roles}>
      <PageWrapper>{children}</PageWrapper>
    </ProtectedRoute>
  );
};

// Main App Component
const App = () => {
  const [showLoader, setShowLoader] = useState(true);
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <CustomCursor />
      <LoadingScreen isVisible={showLoader} />
      <Navbar />

      <Suspense fallback={<RouteFallback />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <PageWrapper>
                  <LandingPage />
                </PageWrapper>
              }
            />
            <Route
              path="/demo"
              element={
                <PageWrapper>
                  <Dashboard />
                </PageWrapper>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedPage roles={[ROLES.FACTORY_OWNER, ROLES.LOGISTICS_PROVIDER, ROLES.ADMINISTRATOR]}>
                  <Dashboard />
                </ProtectedPage>
              }
            />
            <Route
              path="/marketplace"
              element={
                <ProtectedPage roles={[ROLES.FACTORY_OWNER, ROLES.LOGISTICS_PROVIDER, ROLES.ADMINISTRATOR]}>
                  <Marketplace />
                </ProtectedPage>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedPage roles={[ROLES.FACTORY_OWNER, ROLES.ADMINISTRATOR]}>
                  <ListingsInventory />
                </ProtectedPage>
              }
            />
            <Route
              path="/deals"
              element={
                <ProtectedPage roles={[ROLES.FACTORY_OWNER, ROLES.ADMINISTRATOR]}>
                  <DealLifecycle />
                </ProtectedPage>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedPage roles={[ROLES.ADMINISTRATOR]}>
                  <Analytics />
                </ProtectedPage>
              }
            />
            <Route
              path="/operations"
              element={
                <ProtectedPage roles={[ROLES.LOGISTICS_PROVIDER, ROLES.ADMINISTRATOR]}>
                  <OperationsLogistics />
                </ProtectedPage>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedPage roles={[ROLES.ADMINISTRATOR]}>
                  <AdminConsole />
                </ProtectedPage>
              }
            />
            <Route
              path="/list"
              element={
                <ProtectedPage roles={[ROLES.FACTORY_OWNER, ROLES.ADMINISTRATOR]}>
                  <ListResource />
                </ProtectedPage>
              }
            />
            <Route
              path="/matches"
              element={<Navigate to="/deals" replace />}
            />
            <Route
              path="/login"
              element={
                loading ? (
                  <RouteFallback />
                ) : isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <PageWrapper>
                    <Login />
                  </PageWrapper>
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>

      <Footer />
      <Toaster position="bottom-right" />
    </>
  );
};

export default App;

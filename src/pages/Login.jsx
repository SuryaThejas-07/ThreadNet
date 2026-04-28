import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Factory, Shield, ArrowRight, Truck, Chrome } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField';
import ErrorBanner from '../components/ErrorBanner';
import BrandWordmark from '../components/BrandWordmark';
import useFormValidation from '../hooks/useFormValidation';
import { validateLoginForm } from '../services/validation';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';

const resolveAuthCode = (error) => {
  if (error?.code) return error.code;

  const rawMessage = String(error?.message || '');
  const match = rawMessage.match(/\(auth\/([^)]+)\)/i);
  return match ? `auth/${match[1]}` : 'auth/unknown';
};

const getAuthErrorMeta = (error, mode = 'signin') => {
  const code = resolveAuthCode(error);

  const fallback = {
    code,
    title: 'Authentication failed',
    message: mode === 'signup'
      ? 'Could not create your account right now. Please try again in a moment.'
      : 'Could not sign you in right now. Please verify your credentials and try again.',
    actions: ['Try again after a few seconds.', 'If this keeps happening, use Google sign-in and contact support.'],
  };

  const authErrors = {
    'auth/operation-not-allowed': {
      title: 'Sign-up is currently disabled in Firebase',
      message: 'This project has not enabled this authentication method yet.',
      actions: [
        'Open Firebase Console > Authentication > Sign-in method.',
        'Enable Email/Password provider (and Google if needed).',
        'Save changes, then retry sign up.',
      ],
    },
    'auth/email-already-in-use': {
      title: 'Email already registered',
      message: 'This email already has an account. Please sign in instead.',
      actions: ['Switch to Sign In mode.', 'Use Forgot Password if needed.'],
    },
    'auth/invalid-email': {
      title: 'Invalid email address',
      message: 'Please enter a valid email format, for example name@example.com.',
      actions: ['Check for missing @ or domain.', 'Remove extra spaces and retry.'],
    },
    'auth/weak-password': {
      title: 'Password too weak',
      message: 'Use a stronger password with at least 6 characters.',
      actions: ['Use a mix of uppercase, lowercase, number, and symbol.', 'Avoid common words and short passwords.'],
    },
    'auth/user-not-found': {
      title: 'Account not found',
      message: 'No account exists for this email.',
      actions: ['Switch to Sign Up mode.', 'Or continue with Google if this email is linked there.'],
    },
    'auth/wrong-password': {
      title: 'Incorrect password',
      message: 'The password entered does not match this account.',
      actions: ['Try again carefully.', 'Use Forgot Password if needed.'],
    },
    'auth/invalid-credential': {
      title: 'Invalid credentials',
      message: 'The email/password combination is not valid for this account.',
      actions: ['Verify email and password.', 'If needed, reset password and retry.'],
    },
    'auth/too-many-requests': {
      title: 'Too many attempts',
      message: 'Too many login attempts were made. Please wait and retry.',
      actions: ['Wait a few minutes before trying again.', 'Use password reset if you are unsure about credentials.'],
    },
    'auth/popup-blocked': {
      title: 'Google sign-in popup blocked',
      message: 'Your browser blocked the popup window required for Google sign-in.',
      actions: ['Allow popups for this site.', 'Retry Google sign-in.'],
    },
    'auth/popup-closed-by-user': {
      title: 'Google sign-in was cancelled',
      message: 'The Google sign-in popup was closed before completion.',
      actions: ['Click Continue with Google again and complete the flow.'],
    },
    'app/invalid-admin-email': {
      title: 'Invalid administrator account',
      message: 'This email is not approved for Administrator access in this factory.',
      actions: [
        'Use the configured factory admin email only.',
        'Choose Factory Owner or Logistics Provider if this is your regular account.',
      ],
    },
  };

  const matched = authErrors[code];
  if (!matched) return fallback;

  return {
    code,
    title: matched.title,
    message: matched.message,
    actions: matched.actions,
  };
};

const Login = () => {
  const { login, register, loginWithGoogle } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState('');
  const [authMode, setAuthMode] = useState('signin');
  const [remember, setRemember] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTarget = location.state?.from || '/dashboard';
  const { errors, validate, clearError, resetErrors } = useFormValidation(validateLoginForm);

  const userTypes = useMemo(
    () => [
      {
        icon: Factory,
        title: t('login.factoryOwner', 'Factory Owner'),
        desc: t('login.factoryOwnerDesc', 'Manage your operations and connect with suppliers'),
        emoji: '🏭',
      },
      {
        icon: Truck,
        title: t('login.logisticsProvider', 'Logistics Provider'),
        desc: t('login.logisticsProviderDesc', 'Offer transportation and logistics services'),
        emoji: '🚚',
      },
      {
        icon: Shield,
        title: t('login.administrator', 'Administrator'),
        desc: t('login.administratorDesc', 'System administration and oversight'),
        emoji: '🔐',
      },
    ],
    [t],
  );

  const handleTypeSelection = (type) => {
    setAccountType(type);
    resetErrors();
    setStep(2);
  };

  const handleGoogleSignIn = () => {
    setAuthError(null);
    setIsSubmitting(true);

    loginWithGoogle({ role: accountType, remember })
      .then(() => {
        navigate(redirectTarget, { replace: true });
      })
      .catch((error) => {
        setAuthError(getAuthErrorMeta(error, authMode));
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setAuthError(null);
    const isValid = validate({ email, password, accountType });
    if (!isValid) return;

    setIsSubmitting(true);
    const authAction = authMode === 'signup' ? register : login;

    authAction({
      email,
      password,
      role: accountType,
      remember,
      name: authMode === 'signup' ? email.split('@')[0] : undefined,
    })
      .then(() => {
        navigate(redirectTarget, { replace: true });
      })
      .catch((error) => {
        setAuthError(getAuthErrorMeta(error, authMode));
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="min-h-screen pt-32 lg:pt-36 flex items-center justify-center">
      <div className="container max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {step === 1 ? (
            <>
              <div className="text-center mb-14">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="inline-flex items-center gap-3 mb-8"
                >
                  <BrandWordmark className="brand-wordmark-hero login-brand-mark" />
                </motion.div>
                <h1 className="text-4xl font-black mb-3 i18n-wrap">{t('login.title', 'Welcome to ThreadNet')}</h1>
                <p className="text-[var(--text-secondary)] text-lg i18n-wrap">{t('login.subtitle', 'Choose your account type to get started')}</p>
              </div>

              <div className="space-y-4 mb-12">
                {userTypes.map((type, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.1, duration: 0.6 }}
                    whileHover={{ x: 12, scale: 1.02 }}
                    onClick={() => handleTypeSelection(type.title)}
                    className="w-full card p-6 text-left group border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-xl transition-all i18n-safe"
                    aria-label={t('login.selectRole', `Select ${type.title}`, { role: type.title })}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">{type.emoji}</span>
                          <h3 className="text-xl font-bold i18n-wrap">{type.title}</h3>
                        </div>
                        <p className="text-[var(--text-tertiary)] text-sm leading-relaxed i18n-wrap">{type.desc}</p>
                      </div>
                      <ArrowRight
                        size={22}
                        className="text-[var(--primary)] flex-shrink-0 ml-4 group-hover:translate-x-1 transition-transform"
                      />
                    </div>
                  </motion.button>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="grid grid-3 gap-6 border-t border-[var(--border)] pt-10"
              >
                <div className="text-center">
                  <p className="text-3xl font-black text-[var(--primary)] mb-2">850+</p>
                  <p className="text-xs text-[var(--text-tertiary)] font-bold uppercase tracking-wider">{t('login.factories', 'Factories')}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-[var(--success)] mb-2">₹4.2Cr+</p>
                  <p className="text-xs text-[var(--text-tertiary)] font-bold uppercase tracking-wider">{t('login.saved', 'Saved')}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-[var(--warning)] mb-2">12K+</p>
                  <p className="text-xs text-[var(--text-tertiary)] font-bold uppercase tracking-wider">{t('login.co2Tons', 'CO2 Tons')}</p>
                </div>
              </motion.div>
            </>
          ) : (
            <>
              <div className="text-center mb-12">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setStep(1)}
                  className="mb-8 text-[var(--primary)] font-bold text-sm hover:underline flex items-center gap-1 mx-auto"
                >
                  {'<-'} {t('login.backToType', 'Change account type')}
                </motion.button>
                <h1 className="text-4xl font-black mb-3 i18n-wrap">
                  {authMode === 'signup' ? 'Create your ThreadNet account' : t('login.welcomeBack', 'Welcome Back')}
                </h1>
                <p className="text-[var(--text-secondary)] i18n-wrap">
                  {authMode === 'signup'
                    ? 'Create an account or continue with Google to get started.'
                    : t('login.signInSubtitle', 'Sign in to your ThreadNet account')}
                </p>
                <div className="mt-4 inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-soft)] p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthError(null);
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-bold ${authMode === 'signin' ? 'btn-primary' : 'text-[var(--text-secondary)]'}`}
                  >
                    {t('login.signIn', 'Sign In')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setAuthError(null);
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-bold ${authMode === 'signup' ? 'btn-primary' : 'text-[var(--text-secondary)]'}`}
                  >
                    Sign Up
                  </button>
                </div>
              </div>

              <ErrorBanner message={errors.accountType || (authError ? `${authError.title}. ${authError.message}` : '')} />

              {authError ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card border border-[var(--border)] bg-[var(--surface-soft)] p-4 mb-5"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-sm font-bold text-[var(--text)]">How to fix this</p>
                    <span className="badge badge-secondary">{authError.code}</span>
                  </div>
                  <div className="space-y-1">
                    {authError.actions.map((action) => (
                      <p key={action} className="text-xs text-[var(--text-secondary)]">• {action}</p>
                    ))}
                  </div>

                  {authError.code === 'auth/operation-not-allowed' ? (
                    <div className="mt-3 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/10 p-3">
                      <p className="text-xs font-semibold text-[var(--text)]">
                        Firebase setup required: enable providers in Sign-in method before users can register.
                      </p>
                    </div>
                  ) : null}
                </motion.div>
              ) : null}

              <form onSubmit={handleSubmit} noValidate>
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="mb-6"
                >
                  <FormField
                    id="login-email"
                    label={t('login.emailAddress', 'Email Address')}
                    type="email"
                    icon={Mail}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearError('email');
                    }}
                    error={errors.email}
                    autoComplete="email"
                    required
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-bold text-[var(--text)]" htmlFor="login-password">
                      {t('login.password', 'Password')}
                    </label>
                  </div>
                  <FormField
                    id="login-password"
                    type="password"
                    icon={Lock}
                    placeholder="********"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError('password');
                    }}
                    error={errors.password}
                    autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                    required
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="flex items-center gap-3 mb-8"
                >
                  <input
                    type="checkbox"
                    id="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-5 h-5 rounded-lg border-2 border-[var(--border)] cursor-pointer accent-[var(--primary)]"
                  />
                  <label htmlFor="remember" className="text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                    {t('login.keepSignedIn', 'Keep me signed in')}
                  </label>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  type="submit"
                  className="w-full btn btn-primary py-3 font-bold text-base gap-2 mb-6 shadow-lg hover:shadow-xl transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? (authMode === 'signup' ? 'Signing Up...' : t('login.signingIn', 'Signing In...'))
                    : (authMode === 'signup' ? 'Sign Up' : t('login.signIn', 'Sign In'))} <ArrowRight size={20} />
                </motion.button>
              </form>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="space-y-3 mb-8"
              >
                <button
                  className="w-full card p-4 text-center font-bold border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--surface-hover)] transition-all inline-flex items-center justify-center gap-2"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                >
                  <Chrome size={18} /> {t('login.continueWithGoogle', 'Continue with Google')}
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-center"
              >
                <p className="text-[var(--text-tertiary)] text-sm">
                  {authMode === 'signin' ? t('login.noAccount', "Don't have an account?") : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode((current) => (current === 'signin' ? 'signup' : 'signin'));
                      setAuthError(null);
                    }}
                    className="font-bold text-[var(--primary)] hover:underline"
                  >
                    {authMode === 'signin' ? t('login.createOne', 'Create one for free') : t('login.signIn', 'Sign In')}
                  </button>
                </p>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Login;

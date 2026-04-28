import React, { createContext, useCallback, useEffect, useContext, useMemo, useState } from 'react';
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithPopup,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { saveUserProfile } from '../services/liveCollections';

const AuthContext = createContext(null);

const ROLE_MAP = {
  factory_owner: 'Factory Owner',
  logistics_provider: 'Logistics Provider',
  administrator: 'Administrator',
};

const normalizeRoleKey = (value) => {
  if (!value) return 'factory_owner';
  const normalized = String(value).trim().toLowerCase().replace(/\s+/g, '_');

  if (ROLE_MAP[normalized]) return normalized;
  if (normalized === 'factory_owner' || normalized === 'logistics_provider' || normalized === 'administrator') {
    return normalized;
  }

  return 'factory_owner';
};

export const roleLabelFor = (value) => ROLE_MAP[normalizeRoleKey(value)] || ROLE_MAP.factory_owner;

export const roleKeyFor = (value) => normalizeRoleKey(value);

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stopProfileListener = () => {};

    const stopAuthListener = onAuthStateChanged(auth, (firebaseUser) => {
      stopProfileListener();

      if (!firebaseUser) {
        setAuthUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setAuthUser(firebaseUser);

      stopProfileListener = onSnapshot(
        doc(db, 'userProfiles', firebaseUser.uid),
        (snapshot) => {
          const data = snapshot.data() || {};
          setProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email || data.email || '',
            displayName: firebaseUser.displayName || data.displayName || '',
            role: roleKeyFor(data.role || data.accountType || 'factory_owner'),
            roleLabel: roleLabelFor(data.role || data.accountType || 'factory_owner'),
            accountType: roleKeyFor(data.role || data.accountType || 'factory_owner'),
            name: data.name || firebaseUser.displayName || firebaseUser.email || 'ThreadNet user',
            organization: data.organization || '',
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null,
          });
          setLoading(false);
        },
        (error) => {
          console.error(error);
          setProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            role: 'factory_owner',
            roleLabel: 'Factory Owner',
            accountType: 'factory_owner',
            name: firebaseUser.displayName || firebaseUser.email || 'ThreadNet user',
          });
          setLoading(false);
        },
      );
    });

    return () => {
      stopProfileListener();
      stopAuthListener();
    };
  }, []);

  const persistProfile = useCallback(async (user, payload, overrides = {}) => {
    await saveUserProfile(user.uid, {
      email: payload.email || user.email || '',
      role: roleKeyFor(payload.role || payload.accountType || overrides.role || 'factory_owner'),
      roleLabel: roleLabelFor(payload.role || payload.accountType || overrides.role || 'factory_owner'),
      accountType: roleKeyFor(payload.role || payload.accountType || overrides.role || 'factory_owner'),
      name: payload.name || user.displayName || payload.email || user.email || 'ThreadNet user',
      updatedAt: serverTimestamp(),
      createdAt: overrides.createdAt || serverTimestamp(),
    });
  }, []);

  const login = useCallback(async (payload) => {
    const persistence = payload.remember ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);

    const credential = await signInWithEmailAndPassword(auth, payload.email, payload.password);
    await persistProfile(credential.user, payload, { createdAt: serverTimestamp() });

    return credential.user;
  }, [persistProfile]);

  const register = useCallback(async (payload) => {
    const persistence = payload.remember ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);

    const credential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);

    if (payload.name) {
      await updateProfile(credential.user, { displayName: payload.name });
    }

    await persistProfile(credential.user, payload, { createdAt: serverTimestamp() });

    return credential.user;
  }, [persistProfile]);

  const loginWithGoogle = useCallback(async (payload = {}) => {
    const persistence = payload.remember ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);

    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    await persistProfile(credential.user, {
      ...payload,
      email: credential.user.email,
      name: credential.user.displayName,
    }, { createdAt: serverTimestamp(), role: payload.role });

    return credential.user;
  }, [persistProfile]);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const user = useMemo(() => {
    if (!authUser) return null;

    return {
      uid: authUser.uid,
      email: profile?.email || authUser.email || '',
      role: profile?.role || 'factory_owner',
      roleLabel: profile?.roleLabel || roleLabelFor(profile?.role),
      accountType: profile?.accountType || profile?.role || 'factory_owner',
      name: profile?.name || authUser.displayName || authUser.email || 'ThreadNet user',
      organization: profile?.organization || '',
      loggedAt: authUser.metadata?.lastSignInTime || new Date().toISOString(),
    };
  }, [authUser, profile]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(authUser),
      loading,
      login,
      register,
      loginWithGoogle,
      logout,
    }),
    [user, authUser, loading, login, register, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

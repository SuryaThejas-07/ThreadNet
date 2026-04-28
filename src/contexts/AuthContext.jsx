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
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { saveUserProfile } from '../services/liveCollections';
import { ROLES, normalizeRole } from '../constants/roles';

const AuthContext = createContext(null);

const ROLE_MAP = {
  [ROLES.FACTORY_OWNER]: 'Factory Owner',
  [ROLES.LOGISTICS_PROVIDER]: 'Logistics Provider',
  [ROLES.ADMINISTRATOR]: 'Administrator',
};

const createAppError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const normalizeRoleKey = (value) => {
  if (!value) return ROLES.FACTORY_OWNER;
  const normalized = normalizeRole(value);
  return ROLE_MAP[normalized] ? normalized : ROLES.FACTORY_OWNER;
};

export const roleLabelFor = (value) => ROLE_MAP[normalizeRoleKey(value)] || ROLE_MAP.factory_owner;

export const roleKeyFor = (value) => normalizeRoleKey(value);

export const AuthProvider = ({ children }) => {
    const adminPolicyRef = useMemo(() => doc(db, 'config', 'adminPolicy'), []);

    const loadAdminPolicy = useCallback(async () => {
      const snapshot = await getDoc(adminPolicyRef);
      const data = snapshot.exists() ? snapshot.data() : null;
      return {
        exists: snapshot.exists(),
        adminEmail: normalizeEmail(data?.adminEmail),
        adminUid: data?.adminUid || '',
      };
    }, [adminPolicyRef]);

    const ensureBootstrapAdminPolicy = useCallback(async (user) => {
      const email = normalizeEmail(user?.email);
      if (!email || !user?.uid) {
        throw createAppError('app/admin-bootstrap-failed', 'Admin bootstrap failed due to missing user identity.');
      }

      await setDoc(adminPolicyRef, {
        adminEmail: email,
        adminUid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      return email;
    }, [adminPolicyRef]);

    const resolveFinalRole = useCallback(async (user, payload = {}) => {
      const requestedRole = roleKeyFor(payload.role || payload.accountType || ROLES.FACTORY_OWNER);
      const email = normalizeEmail(payload.email || user?.email);

      const profileSnapshot = await getDoc(doc(db, 'userProfiles', user.uid));
      const existingRole = profileSnapshot.exists()
        ? roleKeyFor(profileSnapshot.data()?.role || profileSnapshot.data()?.accountType || ROLES.FACTORY_OWNER)
        : null;

      const policy = await loadAdminPolicy();

      if (existingRole === ROLES.ADMINISTRATOR) {
        if (!policy.exists) {
          await ensureBootstrapAdminPolicy(user);
          return ROLES.ADMINISTRATOR;
        }
        if (policy.adminEmail === email && policy.adminUid === user.uid) {
          return ROLES.ADMINISTRATOR;
        }
        throw createAppError('app/invalid-admin-email', 'Invalid administrator account for this factory.');
      }

      if (requestedRole === ROLES.ADMINISTRATOR) {
        if (!policy.exists) {
          throw createAppError(
            'app/admin-bootstrap-required',
            'Administrator is assigned automatically on first Factory Owner login. Please login as Factory Owner first.',
          );
        }
        if (policy.adminEmail !== email) {
          throw createAppError('app/invalid-admin-email', 'Invalid administrator account for this factory.');
        }
        return ROLES.ADMINISTRATOR;
      }

      if (!policy.exists && requestedRole === ROLES.FACTORY_OWNER) {
        await ensureBootstrapAdminPolicy(user);
        return ROLES.ADMINISTRATOR;
      }

      return existingRole || requestedRole;
    }, [ensureBootstrapAdminPolicy, loadAdminPolicy]);

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
          const storedRole = roleKeyFor(data.role || data.accountType || ROLES.FACTORY_OWNER);

          setProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email || data.email || '',
            displayName: firebaseUser.displayName || data.displayName || '',
            role: storedRole,
            roleLabel: roleLabelFor(storedRole),
            accountType: storedRole,
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
            role: ROLES.FACTORY_OWNER,
            roleLabel: 'Factory Owner',
            accountType: ROLES.FACTORY_OWNER,
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
    const finalRole = roleKeyFor(overrides.role || payload.role || payload.accountType || ROLES.FACTORY_OWNER);
    await saveUserProfile(user.uid, {
      email: payload.email || user.email || '',
      role: finalRole,
      roleLabel: roleLabelFor(finalRole),
      accountType: finalRole,
      name: payload.name || user.displayName || payload.email || user.email || 'ThreadNet user',
      updatedAt: serverTimestamp(),
      createdAt: overrides.createdAt || serverTimestamp(),
    });
  }, []);

  const login = useCallback(async (payload) => {
    const persistence = payload.remember ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);

    const credential = await signInWithEmailAndPassword(auth, payload.email, payload.password);
    try {
      const finalRole = await resolveFinalRole(credential.user, {
        ...payload,
        email: credential.user.email,
      });
      await persistProfile(credential.user, payload, { createdAt: serverTimestamp(), role: finalRole });
    } catch (error) {
      await signOut(auth);
      throw error;
    }

    return credential.user;
  }, [persistProfile, resolveFinalRole]);

  const register = useCallback(async (payload) => {
    const persistence = payload.remember ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);

    const credential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
    try {
      const finalRole = await resolveFinalRole(credential.user, {
        ...payload,
        email: credential.user.email,
      });

      if (payload.name) {
        await updateProfile(credential.user, { displayName: payload.name });
      }

      await persistProfile(credential.user, payload, { createdAt: serverTimestamp(), role: finalRole });
    } catch (error) {
      await signOut(auth);
      throw error;
    }

    return credential.user;
  }, [persistProfile, resolveFinalRole]);

  const loginWithGoogle = useCallback(async (payload = {}) => {
    const persistence = payload.remember ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);

    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    try {
      const finalRole = await resolveFinalRole(credential.user, {
        ...payload,
        email: credential.user.email,
      });

      await persistProfile(credential.user, {
        ...payload,
        email: credential.user.email,
        name: credential.user.displayName,
      }, { createdAt: serverTimestamp(), role: finalRole });
    } catch (error) {
      await signOut(auth);
      throw error;
    }

    return credential.user;
  }, [persistProfile, resolveFinalRole]);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const user = useMemo(() => {
    if (!authUser) return null;

    return {
      uid: authUser.uid,
      email: profile?.email || authUser.email || '',
      role: profile?.role || ROLES.FACTORY_OWNER,
      roleLabel: profile?.roleLabel || roleLabelFor(profile?.role),
      accountType: profile?.accountType || profile?.role || ROLES.FACTORY_OWNER,
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

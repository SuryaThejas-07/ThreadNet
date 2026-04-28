import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { adminUsersSeed, moderationQueueSeed, systemHealthSeed } from '../services/opsData';
import ErrorBanner from '../components/ErrorBanner';
import { subscribeToAdminConsoleData, updateFeatureFlags, updateModerationQueueItem } from '../services/liveCollections';
import SearchFilterBar from '../components/SearchFilterBar';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';

const AdminConsole = () => {
  const { t, formatNumber } = useI18n();
  const { user } = useAuth();
  const role = String(user?.role || user?.accountType || '').trim().toLowerCase();
  const [flags, setFlags] = useState({
    smartRouting: true,
    autoModeration: false,
    contractAutoSign: false,
  });
  const [liveAdmin, setLiveAdmin] = useState(null);
  const [adminError, setAdminError] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [queueSearch, setQueueSearch] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToAdminConsoleData(
      (next) => {
        setLiveAdmin(next);
        if (next?.featureFlags) {
          setFlags(next.featureFlags);
        }
      },
      (error) => {
        console.error(error);
        setAdminError(`Admin console access restricted to administrators.`);
      },
      { role },
    );

    return () => unsubscribe();
  }, [role]);

  const users = liveAdmin?.adminUsers?.length ? liveAdmin.adminUsers : adminUsersSeed;
  const moderationQueue = liveAdmin?.moderationQueue?.length ? liveAdmin.moderationQueue : moderationQueueSeed;
  const systemHealth = liveAdmin?.systemHealth?.length ? liveAdmin.systemHealth : systemHealthSeed;

  const filteredUsers = useMemo(() => {
    const keyword = userSearch.trim().toLowerCase();
    return users.filter((user) => !keyword || [user.name, user.role, user.status, user.id].some((value) => String(value || '').toLowerCase().includes(keyword)));
  }, [users, userSearch]);

  const filteredQueue = useMemo(() => {
    const keyword = queueSearch.trim().toLowerCase();
    return moderationQueue.filter((item) => !keyword || [item.item, item.reason, item.priority, item.status, item.id].some((value) => String(value || '').toLowerCase().includes(keyword)));
  }, [moderationQueue, queueSearch]);

  const toggleFlag = (key) => {
    setFlags((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      updateFeatureFlags(next).catch((error) => {
        console.error(error);
        setAdminError(`Could not publish feature flags. ${error?.message || ''}`);
      });
      return next;
    });
  };

  const markModerationHandled = (id) => {
    updateModerationQueueItem(id, { status: 'Closed' }).catch((error) => {
      console.error(error);
      setAdminError(`Could not update moderation item ${id}. ${error?.message || ''}`);
    });
  };

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container">
        {adminError ? <ErrorBanner message={adminError} /> : null}

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-black mb-2 i18n-wrap">{t('admin.title', 'Admin Console')}</h1>
          <p className="text-[var(--text-secondary)] i18n-wrap">
            {t('admin.subtitle', 'User management, listing moderation, system health checks, feature flags, and support operations.')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`badge ${liveAdmin ? 'badge-primary' : 'badge-secondary'}`}>
              {liveAdmin ? t('common.liveData', 'Live Firestore data') : t('common.demoData', 'Demo fallback data')}
            </span>
            <span className="badge badge-secondary">{formatNumber(filteredUsers.length)} {t('common.users', 'users')}</span>
            <span className="badge badge-secondary">{formatNumber(filteredQueue.length)} {t('common.moderationItems', 'moderation items')}</span>
          </div>
        </motion.div>

        <div className="grid lg:grid-2 gap-6 mb-8">
          <SearchFilterBar
            title={t('admin.searchUsers', 'Search Users')}
            description={t('admin.searchUsersDesc', 'Filter the active user list by name, role, status, or id.')}
            searchLabel={t('common.search', 'Search')}
            searchValue={userSearch}
            onSearchChange={setUserSearch}
            searchPlaceholder={t('admin.usersPlaceholder', 'Name, role, status')}
          />

          <SearchFilterBar
            title={t('admin.searchModeration', 'Search Moderation')}
            description={t('admin.searchModerationDesc', 'Filter the moderation queue by item, reason, priority, or status.')}
            searchLabel={t('common.search', 'Search')}
            searchValue={queueSearch}
            onSearchChange={setQueueSearch}
            searchPlaceholder={t('admin.moderationPlaceholder', 'Item, reason, priority')}
          />
        </div>

        <div className="grid lg:grid-2 gap-6 mb-8">
          <div className="card">
            <h3 className="mb-4 i18n-wrap">{t('admin.userManagement', 'User Management')}</h3>
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-3 rounded-lg bg-[var(--surface-active)] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={user.avatarUrl || ''} alt={user.name} className="h-12 w-12 rounded-full object-cover border border-[var(--border)]" />
                    <div>
                      <p className="font-semibold text-[var(--text)]">{user.name}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{user.id} • {user.role}</p>
                    </div>
                  </div>
                  <span className={`badge ${user.status === 'Active' ? 'badge-primary' : 'badge-danger'}`}>{user.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="mb-4 i18n-wrap">{t('admin.moderationQueue', 'Moderation Queue')}</h3>
            <div className="space-y-3">
              {filteredQueue.map((queue) => (
                <div key={queue.id} className="p-3 rounded-lg bg-[var(--surface-active)]">
                  <p className="font-semibold text-[var(--text)]">{queue.item}</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">{queue.id} • {queue.reason}</p>
                  <span className={`badge mt-2 ${queue.priority === 'High' ? 'badge-danger' : 'badge-secondary'}`}>{queue.priority}</span>
                  <button type="button" className="btn btn-small btn-secondary mt-3" onClick={() => markModerationHandled(queue.id)}>
                    {t('admin.markReviewed', 'Mark reviewed')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-2 gap-6">
          <div className="card">
            <h3 className="mb-4 i18n-wrap">{t('admin.systemHealth', 'System Health')}</h3>
            <div className="space-y-3">
              {systemHealth.map((item) => (
                <div key={item.metric} className="p-3 rounded-lg bg-[var(--surface-active)] flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[var(--text)]">{item.metric}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{item.value}</p>
                  </div>
                  <span className={`badge ${item.status === 'Healthy' ? 'badge-primary' : item.status === 'Watch' ? 'badge-secondary' : 'badge-danger'}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="mb-4 i18n-wrap">{t('admin.featureFlags', 'Feature Flags')}</h3>
            <div className="space-y-3">
              {Object.entries(flags).map(([key, value]) => (
                <label key={key} className="p-3 rounded-lg bg-[var(--surface-active)] flex items-center justify-between gap-3">
                  <span className="font-semibold text-[var(--text)]">{key}</span>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => toggleFlag(key)}
                    className="w-5 h-5 accent-[var(--primary)]"
                  />
                </label>
              ))}
            </div>
            <button className="btn btn-primary mt-4">{t('admin.publishConfig', 'Publish Config')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminConsole;

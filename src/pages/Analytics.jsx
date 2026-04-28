import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw, TrendingUp } from 'lucide-react';
import { analyticsSeries, clusterComparisonSeed } from '../services/opsData';
import ErrorBanner from '../components/ErrorBanner';
import { subscribeToAnalyticsData } from '../services/liveCollections';
import SearchFilterBar from '../components/SearchFilterBar';
import { useI18n } from '../contexts/I18nContext';

const ranges = ['7d', '30d', '90d'];
const clusters = ['All Clusters', 'Tiruppur', 'Surat', 'Ludhiana', 'Panipat'];

const toCsv = (rows) => {
  const header = ['label', 'savings', 'deals', 'emissions'];
  const body = rows.map((row) => [row.label, row.savings, row.deals, row.emissions].join(','));
  return [header.join(','), ...body].join('\n');
};

const downloadCsv = (rows, name) => {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${name}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

const Analytics = () => {
  const { t, formatCompactNumber, formatNumber } = useI18n();
  const [range, setRange] = useState('30d');
  const [cluster, setCluster] = useState('All Clusters');
  const [liveAnalytics, setLiveAnalytics] = useState(null);
  const [analyticsError, setAnalyticsError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToAnalyticsData(
      (next) => {
        setLiveAnalytics(next);
      },
      (error) => {
        console.error(error);
        setAnalyticsError(`Live analytics data failed to load. ${error?.message || 'Showing fallback demo data.'}`);
      },
    );

    return () => unsubscribe();
  }, []);

  const series = liveAnalytics?.seriesByRange?.[range]?.length ? liveAnalytics.seriesByRange[range] : analyticsSeries[range];

  const totals = useMemo(() => {
    return series.reduce(
      (acc, row) => {
        acc.savings += row.savings;
        acc.deals += row.deals;
        acc.emissions += row.emissions;
        return acc;
      },
      { savings: 0, deals: 0, emissions: 0 },
    );
  }, [series]);

  const clusterRows = useMemo(() => {
    const sourceRows = liveAnalytics?.clusterComparison?.length ? liveAnalytics.clusterComparison : clusterComparisonSeed;
    if (cluster === 'All Clusters') return sourceRows;
    return sourceRows.filter((entry) => entry.cluster === cluster);
  }, [cluster, liveAnalytics]);

  const maxSavings = Math.max(...series.map((x) => x.savings));

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container">
        {analyticsError ? <ErrorBanner message={analyticsError} /> : null}

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-black mb-2 i18n-wrap">{t('analytics.title', 'Analytics & Reporting')}</h1>
          <p className="text-[var(--text-secondary)] i18n-wrap">
            {t('analytics.subtitle', 'KPI dashboard with custom date ranges, export-ready reports, and cluster-level comparisons.')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`badge ${liveAnalytics?.isLive ? 'badge-primary' : 'badge-secondary'}`}>
              {liveAnalytics?.isLive ? t('common.liveData', 'Live Firestore data') : t('common.demoData', 'Demo fallback data')}
            </span>
            <span className="badge badge-secondary">Range {range}</span>
          </div>
        </motion.div>

        <SearchFilterBar
          title={t('analytics.controls', 'Controls')}
          description={t('analytics.controlsDesc', 'Choose a reporting window, focus cluster, and export the visible snapshot.')}
          searchLabel={t('common.search', 'Search')}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <button className="btn btn-secondary" onClick={() => downloadCsv(series, `threadnet-analytics-${range}`)}>
                <Download size={16} /> {t('analytics.exportCsv', 'Export CSV')}
              </button>
              <button className="btn btn-secondary" onClick={() => window.location.reload()}>
                <RefreshCw size={16} /> {t('common.refresh', 'Refresh')}
              </button>
            </div>
          }
          groups={[
            {
              label: t('analytics.dateRange', 'Date Range'),
              value: range,
              onChange: setRange,
              options: ranges.map((option) => ({ label: option, value: option })),
            },
            {
              label: t('analytics.cluster', 'Cluster'),
              value: cluster,
              onChange: setCluster,
              options: clusters.map((item) => ({ label: item, value: item })),
            },
          ]}
        />

        <div className="grid grid-3 gap-4 mb-8">
          <div className="card">
            <p className="text-xs text-[var(--text-tertiary)] uppercase">{t('analytics.savings', 'Savings')}</p>
            <p className="text-3xl font-black mt-2">{formatCompactNumber(totals.savings * 100000, { style: 'currency', currency: 'INR' })}</p>
            <p className="text-xs text-[var(--success)] mt-1">+12% {t('common.periodGrowth', 'period growth')}</p>
          </div>
          <div className="card">
            <p className="text-xs text-[var(--text-tertiary)] uppercase">{t('analytics.dealsClosed', 'Deals Closed')}</p>
            <p className="text-3xl font-black mt-2">{formatNumber(totals.deals)}</p>
            <p className="text-xs text-[var(--success)] mt-1">+9% {t('common.periodGrowth', 'period growth')}</p>
          </div>
          <div className="card">
            <p className="text-xs text-[var(--text-tertiary)] uppercase">{t('analytics.co2Reduced', 'CO2 Reduced')}</p>
            <p className="text-3xl font-black mt-2">{formatNumber(totals.emissions)} {t('analytics.tons', 'tons')}</p>
            <p className="text-xs text-[var(--success)] mt-1">+14% {t('common.periodGrowth', 'period growth')}</p>
          </div>
        </div>

        <div className="grid lg:grid-2 gap-6">
          <div className="card">
            <h3 className="mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-[var(--primary)]" /> {t('analytics.kpiTrend', 'KPI Trend')}
            </h3>
            <div className="flex items-end gap-3 h-44">
              {series.map((point) => (
                <div key={point.label} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-[var(--primary)] to-[var(--secondary)]"
                    style={{ height: `${Math.max((point.savings / maxSavings) * 100, 12)}%` }}
                    title={`${point.label}: ${formatCompactNumber(point.savings * 100000, { style: 'currency', currency: 'INR' })}`}
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-2">{point.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="mb-4">{t('analytics.clusterComparison', 'Cluster Comparison')}</h3>
            <div className="space-y-3">
              {clusterRows.map((entry) => (
                <div key={entry.cluster} className="p-3 rounded-lg bg-[var(--surface-active)]">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[var(--text)]">{entry.cluster}</p>
                    <span className="badge badge-primary">{formatNumber(entry.deals)} {t('analytics.deals', 'deals')}</span>
                  </div>
                  <p className="text-sm text-[var(--text-tertiary)] mt-1">
                    {formatCompactNumber(entry.savings * 100000, { style: 'currency', currency: 'INR' })} {t('analytics.savingsLabel', 'savings')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

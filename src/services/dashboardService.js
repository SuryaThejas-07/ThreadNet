import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTIONS = {
  factory: 'factories',
  dashboard: 'dashboard',
  auditEvent: 'auditEvent',
  recommendation: 'recommendation',
  chartSeries: 'chartSeries',
  listings: 'listings',
  deals: 'deals',
  operations: 'operations',
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const toDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toMillis = (value) => {
  const date = toDate(value);
  return date ? date.getTime() : 0;
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toOptionalNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildQuery = (collectionName, cluster, options = {}) => {
  const constraints = [];

  if (cluster && cluster !== 'All Clusters') {
    constraints.push(where('cluster', '==', cluster));
  }

  if (options.orderByField) {
    constraints.push(orderBy(options.orderByField, options.orderDirection || 'desc'));
  }

  if (options.limit) {
    constraints.push(limit(options.limit));
  }

  return query(collection(db, collectionName), ...constraints);
};

const getPositionFromLatLng = (lat, lng, index) => {
  const latitude = toNumber(lat, 20 + index * 0.9);
  const longitude = toNumber(lng, 74 + index * 0.9);

  // Approximate India bounds to place points inside the map card.
  const x = 12 + ((longitude - 68) / (97 - 68)) * 76;
  const y = 16 + ((37 - latitude) / (37 - 8)) * 66;

  return {
    x: clamp(x, 12, 88),
    y: clamp(y, 16, 82),
  };
};

const buildFactoryPayload = (factoryDocs) => {
  if (!factoryDocs.length) {
    return {
      nearbyCities: [],
      localFactories: [],
      verification: [],
    };
  }

  const cityMap = new Map();
  const localFactories = factoryDocs.map((doc, index) => {
    const city = doc.city || 'Unknown';
    const verified = Boolean(doc.verified);
    const trustScore = toNumber(doc.trustScore, verified ? 4.2 : 3.4);

    if (!cityMap.has(city)) {
      const point = getPositionFromLatLng(doc.lat, doc.lng, index);
      cityMap.set(city, {
        name: city,
        x: point.x,
        y: point.y,
        lat: toOptionalNumber(doc.lat),
        lng: toOptionalNumber(doc.lng),
        factories: 0,
        verified: 0,
        trustTotal: 0,
      });
    }

    const cityEntry = cityMap.get(city);
    cityEntry.factories += 1;
    cityEntry.verified += verified ? 1 : 0;
    cityEntry.trustTotal += trustScore;

    return {
      name: doc.name || `Factory ${index + 1}`,
      city,
      type: doc.type || 'General',
      status: verified ? 'Verified' : 'Review',
      lat: toOptionalNumber(doc.lat),
      lng: toOptionalNumber(doc.lng),
    };
  });

  const nearbyCities = Array.from(cityMap.values())
    .map((city) => ({
      name: city.name,
      x: city.x,
      y: city.y,
      lat: city.lat,
      lng: city.lng,
      factories: city.factories,
      verified: city.verified,
      match: Math.round((city.trustTotal / Math.max(city.factories, 1)) * 20),
      route: `${city.name} corridor`,
    }))
    .sort((a, b) => b.factories - a.factories);

  const totalFactories = localFactories.length;
  const totalVerified = localFactories.filter((item) => item.status === 'Verified').length;

  const verification = [
    {
      label: 'Verified factories',
      value: String(totalVerified),
      detail: `${totalVerified} of ${totalFactories} factories are verified`,
    },
    {
      label: 'Verification coverage',
      value: `${Math.round((totalVerified / Math.max(totalFactories, 1)) * 100)}%`,
      detail: 'Based on identity and compliance checks',
    },
  ];

  return {
    nearbyCities,
    localFactories,
    verification,
  };
};

const buildStatsPayload = (dashboardDocs) => {
  if (!dashboardDocs.length) return null;

  const latest = [...dashboardDocs].sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt))[0];

  return {
    fabricSaved: toNumber(latest.fabricSaved, 0),
    exchanges: toNumber(latest.exchanges, 0),
    factories: toNumber(latest.factories, 0),
    moneySaved: toNumber(latest.moneySaved, 0),
  };
};

const buildAuditPayload = (auditDocs) => {
  if (!auditDocs.length) {
    return {
      auditTrail: [],
      feed: [],
      auditCount: 0,
    };
  }

  const sorted = [...auditDocs].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

  const auditTrail = sorted.slice(0, 8).map((event) => ({
    time: toDate(event.createdAt)
      ? `${Math.max(1, Math.round((Date.now() - toDate(event.createdAt).getTime()) / 60000))}m`
      : 'now',
    actor: event.actor || 'System',
    action: event.action || 'Action logged',
    status: event.status || 'Logged',
  }));

  const feed = sorted.slice(0, 6).map((event) => ({
    time: toDate(event.createdAt)
      ? `${Math.max(1, Math.round((Date.now() - toDate(event.createdAt).getTime()) / 60000))} min ago`
      : 'Just now',
    event: event.action || 'Dashboard event',
  }));

  return {
    auditTrail,
    feed,
    auditCount: sorted.length,
  };
};

const buildRecommendationPayload = (recommendationDocs) => {
  if (!recommendationDocs.length) return [];

  return [...recommendationDocs]
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
    .map((item) => ({
    cluster: item.cluster || 'All Clusters',
    city: item.city || '',
    title: item.title || 'No recommendation title',
    summary: item.summary || 'No recommendation summary',
    reasons: Array.isArray(item.reasons) ? item.reasons : [],
    confidence: toNumber(item.confidence, 0.8),
    priority: item.priority || 'medium',
    createdAt: item.createdAt,
    }));
};

const normalizeSeriesPoints = (points) => {
  if (!Array.isArray(points)) return [];
  return points.map((point) => ({
    x: point?.x,
    y: toNumber(point?.y, 0),
  }));
};

const buildChartPayload = (chartDocs) => {
  if (!chartDocs.length) return {};

  const chartMap = new Map();
  chartDocs.forEach((doc) => {
    const key = doc.chartType || 'unknown';
    const existing = chartMap.get(key);
    if (!existing || toMillis(doc.updatedAt) > toMillis(existing.updatedAt)) {
      chartMap.set(key, {
        points: normalizeSeriesPoints(doc.points),
        updatedAt: doc.updatedAt,
      });
    }
  });

  const savings = chartMap.get('savings')?.points.map((point) => point.y).filter((value) => value > 0) || [];

  const matchQuality = chartMap.get('matchQuality')?.points
    .map((point) => ({
      label: String(point.x || 'Segment'),
      value: clamp(Math.round(point.y), 0, 100),
    }))
    .filter((point) => point.value > 0) || [];

  const lifecycle = chartMap.get('lifecycle')?.points
    .map((point) => ({
      label: String(point.x || 'Stage'),
      value: Math.max(0, Math.round(point.y)),
    }))
    .filter((point) => point.value > 0) || [];

  return {
    savings,
    matchQuality,
    lifecycle,
  };
};

const buildDemoWorkflow = (recommendations, auditTrail) => {
  if (!recommendations.length) return [];

  const top = recommendations[0];
  const latestAudit = auditTrail[0];

  return [
    {
      title: 'Live recommendation loaded',
      detail: top.summary,
    },
    {
      title: 'Reasoning attached',
      detail: top.reasons[0] || 'AI highlighted the best local action.',
    },
    {
      title: 'Audit-backed execution',
      detail: latestAudit ? `${latestAudit.actor} logged: ${latestAudit.action}` : 'No audit event yet.',
    },
    {
      title: 'Workflow complete',
      detail: 'Decision, action, and trust logs are now linked in one path.',
    },
  ];
};

const normalizeMonthlySales = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, 30)
    .map((item) => Math.max(0, Math.round(toNumber(item, 0))));
};

const isValidMonthlySeries = (value) => {
  if (!Array.isArray(value) || value.length !== 30) return false;
  return value.every((item) => Number.isFinite(Number(item)) && Number(item) >= 0);
};

const isValidMonthlyValue = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0;
};

const getRecencyScore = (doc) => {
  const stamp = toDate(doc.updatedAt) || toDate(doc.createdAt);
  if (!stamp) return 0;

  const ageMs = Math.max(0, Date.now() - stamp.getTime());
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (ageDays <= 2) return 1;
  if (ageDays >= 45) return 0;
  return clamp(1 - (ageDays - 2) / 43, 0, 1);
};

const buildStreamQuality = (docs, valueField) => {
  const docCount = docs.length;
  if (!docCount) {
    return {
      docCount: 0,
      validSeriesCount: 0,
      validValueCount: 0,
      completenessScore: 0,
      consistencyScore: 0,
      freshnessScore: 0,
      valueCoverageScore: 0,
      qualityScore: 0,
      missingSeriesCount: 0,
      inconsistentSeriesCount: 0,
      issues: ['No documents found for this stream.'],
      usableSeries: [],
      monthlyValueInr: 0,
    };
  }

  const withFlags = docs.map((doc) => {
    const rawSeries = Array.isArray(doc.monthlySales30d) ? doc.monthlySales30d : [];
    const validSeries = isValidMonthlySeries(rawSeries);
    const validValue = isValidMonthlyValue(doc[valueField]);
    return {
      rawSeries,
      validSeries,
      validValue,
      recencyScore: getRecencyScore(doc),
      monthlyValueInr: validValue ? Number(doc[valueField]) : 0,
    };
  });

  const validSeriesCount = withFlags.filter((item) => item.validSeries).length;
  const validValueCount = withFlags.filter((item) => item.validValue).length;
  const missingSeriesCount = withFlags.filter((item) => item.rawSeries.length === 0).length;
  const inconsistentSeriesCount = withFlags.filter((item) => item.rawSeries.length > 0 && !item.validSeries).length;
  const freshnessScore =
    withFlags.reduce((sum, item) => sum + item.recencyScore, 0) / Math.max(withFlags.length, 1);

  const completenessScore = validSeriesCount / docCount;
  const consistencyScore = 1 - inconsistentSeriesCount / docCount;
  const valueCoverageScore = validValueCount / docCount;
  const qualityScore = clamp(
    completenessScore * 0.45 + consistencyScore * 0.2 + valueCoverageScore * 0.2 + freshnessScore * 0.15,
    0,
    1,
  );

  const issues = [];
  if (missingSeriesCount > 0) {
    issues.push(`${missingSeriesCount}/${docCount} docs are missing monthlySales30d.`);
  }
  if (inconsistentSeriesCount > 0) {
    issues.push(`${inconsistentSeriesCount}/${docCount} docs have invalid monthlySales30d format.`);
  }
  if (validValueCount < docCount) {
    issues.push(`${docCount - validValueCount}/${docCount} docs are missing valid monthly value fields.`);
  }

  return {
    docCount,
    validSeriesCount,
    validValueCount,
    completenessScore,
    consistencyScore,
    freshnessScore,
    valueCoverageScore,
    qualityScore,
    missingSeriesCount,
    inconsistentSeriesCount,
    issues,
    usableSeries: withFlags.filter((item) => item.validSeries).map((item) => ({ series: normalizeMonthlySales(item.rawSeries) })),
    monthlyValueInr: withFlags.reduce((sum, item) => sum + item.monthlyValueInr, 0),
  };
};

const aggregateMonthlySeries = (streams) =>
  Array.from({ length: 30 }, (_, index) =>
    streams.reduce((sum, stream) => sum + toNumber(stream.series[index], 0), 0),
  );

const buildLinearForecast = (series, horizon = 7) => {
  if (!series.length) {
    return {
      points: [],
      trendPercent: 0,
      confidence: 0.55,
    };
  }

  if (series.length === 1) {
    return {
      points: Array.from({ length: horizon }, () => series[0]),
      trendPercent: 0,
      confidence: 0.6,
    };
  }

  const n = series.length;
  const xMean = (n - 1) / 2;
  const yMean = series.reduce((sum, value) => sum + value, 0) / n;

  let numerator = 0;
  let denominator = 0;

  series.forEach((value, index) => {
    const xOffset = index - xMean;
    numerator += xOffset * (value - yMean);
    denominator += xOffset * xOffset;
  });

  const slope = denominator ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;
  const forecastPoints = Array.from({ length: horizon }, (_, index) => {
    const point = Math.max(0, Math.round(intercept + slope * (n + index)));
    return point;
  });

  const first = series[0] || 0;
  const last = series[series.length - 1] || 0;
  const trendPercent = first ? ((last - first) / first) * 100 : 0;

  const mean = yMean;
  const variance = series.reduce((sum, value) => sum + (value - mean) * (value - mean), 0) / n;
  const deviation = Math.sqrt(variance);
  const volatility = mean ? deviation / mean : 1;
  const confidence = clamp(0.92 - volatility * 0.5, 0.52, 0.93);

  return {
    points: forecastPoints,
    trendPercent: Number.isFinite(trendPercent) ? trendPercent : 0,
    confidence,
  };
};

const buildAnomalies = (series) => {
  if (series.length < 5) return [];

  const mean = series.reduce((sum, value) => sum + value, 0) / series.length;
  const variance = series.reduce((sum, value) => sum + (value - mean) * (value - mean), 0) / series.length;
  const deviation = Math.sqrt(variance) || 1;

  return series
    .map((value, index) => {
      const previous = series[Math.max(0, index - 1)] || value;
      const dayChangePercent = previous ? ((value - previous) / previous) * 100 : 0;
      const zScore = (value - mean) / deviation;

      let severity = null;
      if (zScore <= -1.8 || dayChangePercent <= -20) severity = 'high';
      else if (zScore <= -1.3 || dayChangePercent <= -12) severity = 'medium';
      else if (zScore <= -1 || dayChangePercent <= -8) severity = 'low';

      if (!severity) return null;

      return {
        day: index + 1,
        value,
        zScore: Number(zScore.toFixed(2)),
        dayChangePercent: Number(dayChangePercent.toFixed(1)),
        severity,
        reason:
          dayChangePercent <= -12
            ? `Sharp day-over-day drop (${Math.round(dayChangePercent)}%)`
            : `Below baseline signal (z=${zScore.toFixed(2)})`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const rank = { high: 3, medium: 2, low: 1 };
      return rank[b.severity] - rank[a.severity];
    })
    .slice(0, 4);
};

const buildMonthlySalesDemoPayload = (listingsDocs, dealsDocs, operationsDocs) => {
  const streams = [
    {
      key: 'listings',
      label: 'Listings',
      roleLabel: 'Listings contribution',
      quality: buildStreamQuality(listingsDocs, 'monthlyRevenueInr'),
    },
    {
      key: 'deals',
      label: 'Deals',
      roleLabel: 'Deal conversion contribution',
      quality: buildStreamQuality(dealsDocs, 'monthlyDealValueInr'),
    },
    {
      key: 'operations',
      label: 'Operations',
      roleLabel: 'Operations contribution',
      quality: buildStreamQuality(operationsDocs, 'monthlyRouteRevenueInr'),
    },
  ].map((stream) => ({
    ...stream,
    series: aggregateMonthlySeries(stream.quality.usableSeries),
    monthlyValueInr: stream.quality.monthlyValueInr,
  }));

  const totalMonthlyValueInr = streams.reduce((sum, stream) => sum + stream.monthlyValueInr, 0);
  const streamsWithContribution = streams.map((stream) => ({
    ...stream,
    contributionPercent: totalMonthlyValueInr
      ? (stream.monthlyValueInr / totalMonthlyValueInr) * 100
      : 0,
  }));

  const combinedSeries = aggregateMonthlySeries(streamsWithContribution);
  const forecast = buildLinearForecast(combinedSeries, 7);
  const dataQuality = {
    score:
      streamsWithContribution.reduce((sum, stream) => sum + stream.quality.qualityScore, 0) /
      Math.max(streamsWithContribution.length, 1),
    completeness:
      streamsWithContribution.reduce((sum, stream) => sum + stream.quality.completenessScore, 0) /
      Math.max(streamsWithContribution.length, 1),
    consistency:
      streamsWithContribution.reduce((sum, stream) => sum + stream.quality.consistencyScore, 0) /
      Math.max(streamsWithContribution.length, 1),
    freshness:
      streamsWithContribution.reduce((sum, stream) => sum + stream.quality.freshnessScore, 0) /
      Math.max(streamsWithContribution.length, 1),
    valueCoverage:
      streamsWithContribution.reduce((sum, stream) => sum + stream.quality.valueCoverageScore, 0) /
      Math.max(streamsWithContribution.length, 1),
    issues: streamsWithContribution.flatMap((stream) =>
      stream.quality.issues.map((issue) => `${stream.label}: ${issue}`),
    ),
  };

  const qualityPenalty = clamp((1 - dataQuality.score) * 0.35, 0, 0.35);
  const completenessPenalty = clamp((1 - dataQuality.completeness) * 0.2, 0, 0.2);
  const consistencyPenalty = clamp((1 - dataQuality.consistency) * 0.15, 0, 0.15);
  const adjustedConfidence = clamp(
    forecast.confidence - qualityPenalty - completenessPenalty - consistencyPenalty,
    0.25,
    0.95,
  );
  const confidencePenalty = clamp(forecast.confidence - adjustedConfidence, 0, 1);

  return {
    model: 'BigQuery ML (AR-like linear trend)',
    streams: streamsWithContribution,
    combinedSeries,
    forecast7d: forecast.points,
    baseModelConfidence: forecast.confidence,
    confidence: adjustedConfidence,
    confidencePenalty,
    trendPercent: forecast.trendPercent,
    anomalies: buildAnomalies(combinedSeries),
    totalMonthlyValueInr,
    dataQuality,
    roiBreakdown: {
      listingsContributionPercent:
        streamsWithContribution.find((stream) => stream.key === 'listings')?.contributionPercent || 0,
      dealConversionContributionPercent:
        streamsWithContribution.find((stream) => stream.key === 'deals')?.contributionPercent || 0,
      operationsContributionPercent:
        streamsWithContribution.find((stream) => stream.key === 'operations')?.contributionPercent || 0,
    },
  };
};

const mergeBundle = (parts) => {
  const factories = buildFactoryPayload(parts.factory || []);
  const stats = buildStatsPayload(parts.dashboard || []);
  const audit = buildAuditPayload(parts.auditEvent || []);
  const recommendations = buildRecommendationPayload(parts.recommendation || []);
  const charts = buildChartPayload(parts.chartSeries || []);
  const monthlySalesDemo = buildMonthlySalesDemoPayload(
    parts.listings || [],
    parts.deals || [],
    parts.operations || [],
  );

  const verification = [...factories.verification];
  if (audit.auditCount) {
    verification.push({
      label: 'Audit events',
      value: String(audit.auditCount),
      detail: 'Actions recorded in immutable event logs',
    });
  }

  if (recommendations.length) {
    const avgConfidence = Math.round(
      (recommendations.reduce((acc, item) => acc + item.confidence, 0) / recommendations.length) * 100,
    );

    verification.push({
      label: 'AI confidence',
      value: `${avgConfidence}%`,
      detail: 'Average confidence from recommendation engine',
    });
  }

  return {
    nearbyCities: factories.nearbyCities,
    localFactories: factories.localFactories,
    stats,
    savings: charts.savings,
    matchQuality: charts.matchQuality,
    lifecycle: charts.lifecycle,
    feed: audit.feed,
    auditTrail: audit.auditTrail,
    recommendations,
    verification,
    demoWorkflow: buildDemoWorkflow(recommendations, audit.auditTrail),
    monthlySalesDemo,
  };
};

export const subscribeToDashboardBundle = (cluster, onNext, onError) => {
  const parts = {
    factory: [],
    dashboard: [],
    auditEvent: [],
    recommendation: [],
    chartSeries: [],
    listings: [],
    deals: [],
    operations: [],
  };

  const emit = () => {
    onNext(mergeBundle(parts));
  };

  const listeners = [
    {
      key: 'factory',
      q: buildQuery(COLLECTIONS.factory, cluster),
    },
    {
      key: 'dashboard',
      q: buildQuery(COLLECTIONS.dashboard, cluster),
    },
    {
      key: 'auditEvent',
      q: buildQuery(COLLECTIONS.auditEvent, cluster, { limit: 24 }),
    },
    {
      key: 'recommendation',
      q: buildQuery(COLLECTIONS.recommendation, cluster, { limit: 12 }),
    },
    {
      key: 'chartSeries',
      q: buildQuery(COLLECTIONS.chartSeries, cluster),
    },
    {
      key: 'listings',
      q: buildQuery(COLLECTIONS.listings, cluster, { limit: 40 }),
    },
    {
      key: 'deals',
      q: buildQuery(COLLECTIONS.deals, cluster, { limit: 40 }),
    },
    {
      key: 'operations',
      q: buildQuery(COLLECTIONS.operations, cluster, { limit: 40 }),
    },
  ];

  const unsubs = listeners.map(({ key, q }) =>
    onSnapshot(
      q,
      (snapshot) => {
        parts[key] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        emit();
      },
      (error) => {
        onError(error);
      },
    ),
  );

  return () => {
    unsubs.forEach((unsub) => unsub());
  };
};

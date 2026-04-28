import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const toDateValue = (value) => (value?.toDate ? value.toDate() : null);

const mapPredictiveAlert = (snapshotDoc) => {
  const data = snapshotDoc.data();

  return {
    id: snapshotDoc.id,
    cluster: data.cluster || 'All Clusters',
    city: data.city || 'Unknown',
    resourceType: data.resourceType || 'fabric',
    modelName: data.modelName || 'bqml_surplus_forecast_v1',
    predictionWindowDays: Number(data.predictionWindowDays || 7),
    surplusProbability: Number(data.surplusProbability || 0),
    predictedQuantity: Number(data.predictedQuantity || 0),
    confidence: Number(data.confidence || 0),
    severity: data.severity || 'medium',
    recommendation: data.recommendation || 'Monitor inventory and list surplus early.',
    createdAt: toDateValue(data.createdAt),
    updatedAt: toDateValue(data.updatedAt),
  };
};

export const subscribeToPredictiveSurplusAlerts = (onNext, onError) => {
  return onSnapshot(
    collection(db, 'predictiveSurplusAlerts'),
    (snapshot) => {
      const alerts = snapshot.docs.map(mapPredictiveAlert);
      onNext(alerts);
    },
    onError,
  );
};

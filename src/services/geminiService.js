import { GoogleGenerativeAI } from '@google/generative-ai';

const FALLBACK_MODELS = [
  import.meta.env.VITE_GEMINI_MODEL,
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
].filter(Boolean);

let cachedClient = null;
const cachedModels = new Map();

const getClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key missing. Set VITE_GEMINI_KEY in your environment.');
  }

  if (cachedClient) return cachedClient;

  cachedClient = new GoogleGenerativeAI(apiKey);
  return cachedClient;
};

const getModel = (modelName) => {
  if (cachedModels.has(modelName)) {
    return cachedModels.get(modelName);
  }

  const client = getClient();
  const model = client.getGenerativeModel({ model: modelName });
  cachedModels.set(modelName, model);
  return model;
};

const parseJsonPayload = (rawText) => {
  const trimmed = String(rawText || '').trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;

    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  }
};

const normalizeRecommendation = (data, fallbackAction) => {
  const reasons = Array.isArray(data?.reasons)
    ? data.reasons.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 3)
    : [];

  const confidenceNumber = Number(data?.confidence);
  const safeConfidence = Number.isFinite(confidenceNumber)
    ? Math.min(Math.max(Math.round(confidenceNumber), 60), 99)
    : 82;

  return {
    title: String(data?.title || 'Prioritize local verified partners first').trim(),
    summary: String(data?.summary || 'Gemini was unable to provide a detailed summary.').trim(),
    reasons: reasons.length ? reasons : ['No structured reasons returned from Gemini.'],
    confidence: `${safeConfidence}% confidence`,
    action: String(data?.action || fallbackAction).trim(),
  };
};

export const generateDashboardRecommendation = async ({
  cluster,
  city,
  cityFactoryCount,
  verifiedFactoryCount,
  matchScore,
  moneySavedInr,
  selectedFactory,
}) => {
  const prompt = [
    'You are an operations copilot for ThreadNet, a textile resource exchange platform.',
    'Return ONLY valid JSON (no markdown) with this exact schema:',
    '{"title":"string","summary":"string","reasons":["string","string","string"],"confidence":number,"action":"string"}',
    'Constraints:',
    '- Keep summary under 30 words.',
    '- Provide exactly 3 concrete reasons.',
    '- Confidence must be a number between 60 and 99.',
    '- Action must be one imperative sentence.',
    'Context:',
    `cluster=${cluster}`,
    `city=${city}`,
    `cityFactoryCount=${cityFactoryCount}`,
    `verifiedFactoryCount=${verifiedFactoryCount}`,
    `matchScore=${matchScore}`,
    `moneySavedInr=${moneySavedInr}`,
    `selectedFactory=${selectedFactory}`,
  ].join('\n');

  let lastError = null;
  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = getModel(modelName);
      const response = await model.generateContent(prompt);
      const rawText = response?.response?.text?.() || '';
      const payload = parseJsonPayload(rawText);

      if (!payload) {
        throw new Error('Gemini returned a non-JSON response.');
      }

      return normalizeRecommendation(payload, `Launch deal from ${selectedFactory || city}`);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Unable to generate Gemini recommendation with available models.');
};
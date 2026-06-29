/**
 * Vercel Serverless Function — GET /api/exchange/rates
 */
const { handleExchangeRates } = require('../_lib/exchange-handler');
const { getExchangeRateApiKey } = require('../_lib/env');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'GET만 허용됩니다.' });
  }

  const result = await handleExchangeRates(getExchangeRateApiKey);
  return res.status(result.status).json(result.data);
};

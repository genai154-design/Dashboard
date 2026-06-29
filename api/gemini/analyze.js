/**
 * Vercel Serverless Function — POST /api/gemini/analyze
 */
const { handleGeminiNewsAnalysis } = require('../_lib/gemini-handler');
const { getGeminiApiKey } = require('../_lib/env');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'POST만 허용됩니다.' });
  }

  const result = await handleGeminiNewsAnalysis(req.body, getGeminiApiKey);
  return res.status(result.status).json(result.data);
};

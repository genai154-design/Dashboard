/**
 * Vercel Serverless Function — POST /api/naver/search
 */
const { handleNaverNewsSearch } = require('../_lib/naver-handler');
const { getNaverCredentials } = require('../_lib/env');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'POST만 허용됩니다.' });
  }

  const result = await handleNaverNewsSearch(req.body, getNaverCredentials);
  return res.status(result.status).json(result.data);
};

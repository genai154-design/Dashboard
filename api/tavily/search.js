/**
 * Vercel Serverless Function — POST /api/tavily/search
 * TAVILY_API_KEY는 Vercel 프로젝트 환경 변수에 설정
 */
const { handleTavilySearch } = require('../_lib/tavily-handler');
const { getTavilyApiKey } = require('../_lib/env');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'POST만 허용됩니다.' });
  }

  const result = await handleTavilySearch(req.body, getTavilyApiKey);
  return res.status(result.status).json(result.data);
};

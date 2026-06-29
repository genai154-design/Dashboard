/**
 * Vercel Serverless — GET /api/kakao/callback
 */
const {
  getKakaoRestApiKey,
  getKakaoClientSecret,
  getKakaoRedirectUri,
  getAppOrigin,
  isProductionRuntime,
} = require('../_lib/env');
const { handleKakaoCallback } = require('../_lib/kakao-handler');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'GET만 허용됩니다.' });
  }

  return handleKakaoCallback(req, res, {
    getRestApiKey: getKakaoRestApiKey,
    getClientSecret: getKakaoClientSecret,
    getRedirectUri: getKakaoRedirectUri,
    getAppOrigin,
    isProductionRuntime,
  });
};

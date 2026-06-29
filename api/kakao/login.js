/**
 * Vercel Serverless — GET /api/kakao/login
 */
const {
  getKakaoRestApiKey,
  getKakaoRedirectUri,
} = require('../_lib/env');
const { handleKakaoLogin } = require('../_lib/kakao-handler');

module.exports = (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'GET만 허용됩니다.' });
  }

  return handleKakaoLogin(res, getKakaoRestApiKey, getKakaoRedirectUri);
};

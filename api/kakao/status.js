/**
 * Vercel Serverless — GET /api/kakao/status
 */
const { handleKakaoStatus } = require('../_lib/kakao-handler');

module.exports = (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'GET만 허용됩니다.' });
  }

  const result = handleKakaoStatus(req);
  return res.status(result.status).json(result.data);
};

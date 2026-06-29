/**
 * Vercel Serverless — POST /api/kakao/send
 */
const { getAppOrigin } = require('../_lib/env');
const { handleKakaoSend } = require('../_lib/kakao-handler');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'POST만 허용됩니다.' });
  }

  const result = await handleKakaoSend(req, res, { getAppOrigin });
  return res.status(result.status).json(result.data);
};

/**
 * 카카오 API 프록시 — Express 라우터 (로컬 개발용)
 */
const express = require('express');
const {
  getKakaoRestApiKey,
  getKakaoClientSecret,
  getKakaoRedirectUri,
  getAppOrigin,
  isProductionRuntime,
} = require('../../api/_lib/env');
const {
  handleKakaoLogin,
  handleKakaoCallback,
  handleKakaoSend,
  handleKakaoStatus,
} = require('../../api/_lib/kakao-handler');

const router = express.Router();
const kakaoDeps = {
  getRestApiKey: getKakaoRestApiKey,
  getClientSecret: getKakaoClientSecret,
  getRedirectUri: getKakaoRedirectUri,
  getAppOrigin,
  isProductionRuntime,
};

router.get('/login', (req, res) => {
  handleKakaoLogin(res, getKakaoRestApiKey, getKakaoRedirectUri);
});

router.get('/callback', async (req, res) => {
  await handleKakaoCallback(req, res, kakaoDeps);
});

router.post('/send', async (req, res) => {
  const result = await handleKakaoSend(req, res, { getAppOrigin });
  return res.status(result.status).json(result.data);
});

router.get('/status', (req, res) => {
  const result = handleKakaoStatus(req);
  return res.status(result.status).json(result.data);
});

module.exports = router;

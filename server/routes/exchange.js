/**
 * Exchange Rate API 프록시 — Express 라우터 (로컬 개발용)
 */
const express = require('express');
const { getExchangeRateApiKey } = require('../../api/_lib/env');
const { handleExchangeRates } = require('../../api/_lib/exchange-handler');

const router = express.Router();

router.get('/rates', async (_req, res) => {
  const result = await handleExchangeRates(getExchangeRateApiKey);
  return res.status(result.status).json(result.data);
});

module.exports = router;

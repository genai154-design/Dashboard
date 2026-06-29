/**
 * Tavily API 프록시 — Express 라우터 (로컬 개발용)
 */
const express = require('express');
const { getTavilyApiKey } = require('../../api/_lib/env');
const { handleTavilySearch } = require('../../api/_lib/tavily-handler');

const router = express.Router();

router.post('/search', async (req, res) => {
  const result = await handleTavilySearch(req.body, getTavilyApiKey);
  return res.status(result.status).json(result.data);
});

module.exports = router;

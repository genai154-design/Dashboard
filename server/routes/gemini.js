/**
 * Gemini API 프록시 — Express 라우터 (로컬 개발용)
 */
const express = require('express');
const { getGeminiApiKey } = require('../../api/_lib/env');
const { handleGeminiNewsAnalysis } = require('../../api/_lib/gemini-handler');

const router = express.Router();

router.post('/analyze', async (req, res) => {
  const result = await handleGeminiNewsAnalysis(req.body, getGeminiApiKey);
  return res.status(result.status).json(result.data);
});

module.exports = router;

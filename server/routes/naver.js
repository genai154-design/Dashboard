/**
 * 네이버 검색 API 프록시 — Express 라우터 (로컬 개발용)
 */
const express = require('express');
const { getNaverCredentials } = require('../../api/_lib/env');
const { handleNaverNewsSearch } = require('../../api/_lib/naver-handler');

const router = express.Router();

router.post('/search', async (req, res) => {
  const result = await handleNaverNewsSearch(req.body, getNaverCredentials);
  return res.status(result.status).json(result.data);
});

module.exports = router;

/**
 * Tavily API 프록시 — 키는 서버 환경 변수만 사용, 클라이언트에 노출하지 않음
 */
const express = require('express');
const { getTavilyApiKey } = require('../lib/env');

const TAVILY_SEARCH_URL = 'https://api.tavily.com/search';

const router = express.Router();

// 클라이언트가 보낼 수 있는 옵션만 허용 — api_key 등은 서버에서 주입
const ALLOWED_FIELDS = [
  'query',
  'search_depth',
  'topic',
  'max_results',
  'include_answer',
  'include_raw_content',
  'include_images',
  'time_range',
  'include_domains',
  'exclude_domains',
  'country',
];

router.post('/search', async (req, res) => {
  const { query } = req.body || {};

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'query는 필수입니다.' });
  }

  try {
    const apiKey = getTavilyApiKey();

    const payload = { query: query.trim() };
    for (const field of ALLOWED_FIELDS) {
      if (field === 'query') continue;
      if (req.body[field] !== undefined) {
        payload[field] = req.body[field];
      }
    }

    const response = await fetch(TAVILY_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.detail || data.error || 'Tavily API 요청 실패',
      });
    }

    return res.json(data);
  } catch (err) {
    const message = err.message || 'Tavily 프록시 오류';
    const status = message.includes('TAVILY_API_KEY') ? 503 : 500;
    return res.status(status).json({ error: message });
  }
});

module.exports = router;

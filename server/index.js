/**
 * 로컬 개발용 Express 서버
 * - 정적 파일(대시보드·날씨 페이지) 제공
 * - Tavily API: /api/tavily/search (Vercel 배포 시 Serverless Function 사용)
 */
const express = require('express');
const path = require('path');
const { rootDir, port, hasTavilyApiKey, hasExchangeRateApiKey, hasNaverCredentials, hasGeminiApiKey, getGeminiModel } = require('../api/_lib/env');
const tavilyRouter = require('./routes/tavily');
const exchangeRouter = require('./routes/exchange');
const naverRouter = require('./routes/naver');
const geminiRouter = require('./routes/gemini');

const app = express();

app.use(express.json({ limit: '1mb' }));

// 비밀·서버 소스 직접 접근 차단 — 배포 시 .env 유출 방지
app.use((req, res, next) => {
  const blocked =
    req.path.startsWith('/server') ||
    req.path.startsWith('/api/_lib') ||
    req.path.startsWith('/node_modules') ||
    req.path.startsWith('/secrets') ||
    req.path === '/.env' ||
    req.path.startsWith('/.env.');

  if (blocked) {
    return res.status(404).end();
  }
  next();
});

app.use('/api/tavily', tavilyRouter);
app.use('/api/exchange', exchangeRouter);
app.use('/api/naver', naverRouter);
app.use('/api/gemini', geminiRouter);

// dotfiles(.env 등) 정적 제공 금지
app.use(
  express.static(rootDir, {
    index: ['index.html'],
    dotfiles: 'deny',
  })
);

app.listen(port, () => {
  console.log(`Dashboard 서버: http://localhost:${port}`);
  console.log(`  index:  http://localhost:${port}/index.html`);
  console.log(`  weather: http://localhost:${port}/weather.html`);

  if (!hasTavilyApiKey()) {
    console.warn(
      '  [경고] TAVILY_API_KEY 미설정 — .env.example을 참고하여 .env를 만드세요.'
    );
  } else {
    console.log('  Tavily API: POST /api/tavily/search');
  }

  if (hasExchangeRateApiKey()) {
    console.log('  Exchange Rate API: GET /api/exchange/rates (키 사용 · 전일 대비)');
  } else {
    console.log('  Exchange Rate API: GET /api/exchange/rates (Open Access · 키 선택)');
  }

  if (hasNaverCredentials()) {
    console.log('  Naver News API: POST /api/naver/search');
  } else {
    console.warn(
      '  [경고] NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 미설정 — 국내 뉴스 검색 불가'
    );
  }

  if (hasGeminiApiKey()) {
    console.log(`  Gemini API: POST /api/gemini/analyze (${getGeminiModel()})`);
  } else {
    console.warn('  [경고] GEMINI_API_KEY 미설정 — AI 분석 불가');
  }
});

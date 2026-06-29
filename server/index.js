/**
 * 로컬·배포용 서버
 * - 정적 파일(대시보드·날씨 페이지) 제공
 * - Tavily API는 /api/tavily/* 프록시로만 호출 (키는 process.env)
 */
const express = require('express');
const path = require('path');
const { rootDir, port, hasTavilyApiKey } = require('./lib/env');
const tavilyRouter = require('./routes/tavily');

const app = express();

app.use(express.json({ limit: '1mb' }));

// 비밀·서버 소스 직접 접근 차단 — 배포 시 .env 유출 방지
app.use((req, res, next) => {
  const blocked =
    req.path.startsWith('/server') ||
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
    console.log('  Tavily API: /api/tavily/search (키는 서버에서만 사용)');
  }
});

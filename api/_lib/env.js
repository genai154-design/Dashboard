/**
 * 환경 변수 — 로컬(.env) / Vercel(대시보드 환경 변수) 공통
 * api/_lib/ — Vercel에서 Serverless Function으로 노출되지 않음
 */
const path = require('path');
const dotenv = require('dotenv');

const rootDir = path.resolve(__dirname, '../..');

// Vercel은 process.env를 주입 — .env 없어도 동작
dotenv.config({ path: path.join(rootDir, '.env') });

function getTavilyApiKey() {
  const key = process.env.TAVILY_API_KEY?.trim();
  if (!key) {
    throw new Error(
      'TAVILY_API_KEY가 설정되지 않았습니다. 로컬: .env 파일 / Vercel: 프로젝트 환경 변수를 설정하세요.'
    );
  }
  return key;
}

function hasTavilyApiKey() {
  return Boolean(process.env.TAVILY_API_KEY?.trim());
}

/** Exchange Rate API 키 — 없으면 open access 엔드포인트 사용 */
function getExchangeRateApiKey() {
  return process.env.EXCHANGE_RATE_API_KEY?.trim() || null;
}

function hasExchangeRateApiKey() {
  return Boolean(getExchangeRateApiKey());
}

module.exports = {
  rootDir,
  port: Number(process.env.PORT) || 3000,
  getTavilyApiKey,
  hasTavilyApiKey,
  getExchangeRateApiKey,
  hasExchangeRateApiKey,
};

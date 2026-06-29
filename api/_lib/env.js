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

/** 네이버 검색 API 자격 증명 */
function getNaverCredentials() {
  const clientId = process.env.NAVER_CLIENT_ID?.trim();
  const clientSecret = process.env.NAVER_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      'NAVER_CLIENT_ID / NAVER_CLIENT_SECRET이 설정되지 않았습니다. .env 또는 Vercel 환경 변수를 확인하세요.'
    );
  }

  return { clientId, clientSecret };
}

function hasNaverCredentials() {
  return Boolean(
    process.env.NAVER_CLIENT_ID?.trim() && process.env.NAVER_CLIENT_SECRET?.trim()
  );
}

/** Google AI Studio Gemini API 키 */
function getGeminiApiKey() {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      'GEMINI_API_KEY가 설정되지 않았습니다. .env 또는 Vercel 환경 변수를 확인하세요.'
    );
  }
  return key;
}

function hasGeminiApiKey() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/** Gemini 모델 ID — .env GEMINI_MODEL, 미설정 시 gemini-2.5-flash-lite */
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';

function getGeminiModel() {
  const model = process.env.GEMINI_MODEL?.trim();
  return model || DEFAULT_GEMINI_MODEL;
}

module.exports = {
  rootDir,
  port: Number(process.env.PORT) || 3000,
  getTavilyApiKey,
  hasTavilyApiKey,
  getExchangeRateApiKey,
  hasExchangeRateApiKey,
  getNaverCredentials,
  hasNaverCredentials,
  getGeminiApiKey,
  hasGeminiApiKey,
  getGeminiModel,
  DEFAULT_GEMINI_MODEL,
};

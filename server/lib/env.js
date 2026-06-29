/**
 * 환경 변수 로드 — .env는 프로젝트 루트에만 존재, 서버 프로세스에서만 읽음
 */
const path = require('path');
const dotenv = require('dotenv');

const rootDir = path.resolve(__dirname, '../../');

// dotenv는 기본적으로 process.env만 수정 — 클라이언트에 전달되지 않음
dotenv.config({ path: path.join(rootDir, '.env') });

/** Tavily API 키 — 없으면 프록시 호출 시 에러 */
function getTavilyApiKey() {
  const key = process.env.TAVILY_API_KEY?.trim();
  if (!key) {
    throw new Error(
      'TAVILY_API_KEY가 설정되지 않았습니다. .env.example을 참고하여 .env 파일을 만드세요.'
    );
  }
  return key;
}

function hasTavilyApiKey() {
  return Boolean(process.env.TAVILY_API_KEY?.trim());
}

module.exports = {
  rootDir,
  port: Number(process.env.PORT) || 3000,
  getTavilyApiKey,
  hasTavilyApiKey,
};

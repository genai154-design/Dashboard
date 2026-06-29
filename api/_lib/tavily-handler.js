/**
 * Tavily 검색 공통 핸들러 — Express(로컬)와 Vercel Serverless Function에서 공유
 */
const TAVILY_SEARCH_URL = 'https://api.tavily.com/search';

// 클라이언트가 보낼 수 있는 옵션만 허용 — api_key는 서버에서 주입
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

/**
 * @param {object} body - 요청 본문
 * @param {() => string} getApiKey - API 키 반환 함수 (환경별 주입)
 * @returns {Promise<{ status: number, data: object }>}
 */
async function handleTavilySearch(body, getApiKey) {
  const { query } = body || {};

  if (!query || typeof query !== 'string' || !query.trim()) {
    return { status: 400, data: { error: 'query는 필수입니다.' } };
  }

  try {
    const apiKey = getApiKey();

    const payload = { query: query.trim() };
    for (const field of ALLOWED_FIELDS) {
      if (field === 'query') continue;
      if (body[field] !== undefined) {
        payload[field] = body[field];
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
      return {
        status: response.status,
        data: { error: data.detail || data.error || 'Tavily API 요청 실패' },
      };
    }

    return { status: 200, data };
  } catch (err) {
    const message = err.message || 'Tavily 프록시 오류';
    const status = message.includes('TAVILY_API_KEY') ? 503 : 500;
    return { status, data: { error: message } };
  }
}

module.exports = { handleTavilySearch, ALLOWED_FIELDS };

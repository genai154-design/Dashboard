/**
 * Tavily 클라이언트 — API 키 없이 서버 프록시만 호출
 * 브라우저에는 키가 포함되지 않음
 */
const TAVILY_PROXY = '/api/tavily/search';

/**
 * Tavily 검색 (서버 프록시 경유)
 * @param {string} query - 검색어
 * @param {object} [options] - search_depth, max_results 등 (api_key 제외)
 */
async function tavilySearch(query, options = {}) {
  const response = await fetch(TAVILY_PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, ...options }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Tavily 요청 실패 (${response.status})`);
  }

  return data;
}

// 전역 헬퍼 — 모듈 번들러 없이 HTML에서 script로 사용
window.TavilyAPI = { search: tavilySearch };

/**
 * 네이버 검색 API 클라이언트 — 서버 프록시 경유
 */
const NAVER_PROXY = '/api/naver/search';

async function searchNews(query, options = {}) {
  const response = await fetch(NAVER_PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, ...options }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `네이버 검색 실패 (${response.status})`);
  }

  return data;
}

window.NaverAPI = { searchNews };

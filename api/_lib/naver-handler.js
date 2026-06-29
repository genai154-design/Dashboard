/**
 * 네이버 검색 API — 뉴스 검색 공통 핸들러
 * https://developers.naver.com/docs/serviceapi/search/news/news.md
 */
const NAVER_NEWS_URL = 'https://openapi.naver.com/v1/search/news.json';

/** 네이버 API HTML 태그·엔티티 제거 */
function stripHtml(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'");
}

/** 네이버 뉴스 항목 → 클라이언트 공통 형식 */
function normalizeItem(item) {
  return {
    title: stripHtml(item.title),
    url: item.link || item.originallink || '',
    content: stripHtml(item.description),
    published_date: item.pubDate,
    originallink: item.originallink || '',
  };
}

/**
 * @param {object} body - { query, display?, sort? }
 * @param {() => { clientId: string, clientSecret: string }} getCredentials
 */
async function handleNaverNewsSearch(body, getCredentials) {
  const { query } = body || {};

  if (!query || typeof query !== 'string' || !query.trim()) {
    return { status: 400, data: { error: 'query는 필수입니다.' } };
  }

  try {
    const { clientId, clientSecret } = getCredentials();
    const display = Math.min(Math.max(Number(body.display) || 6, 1), 10);
    const sort = body.sort === 'sim' ? 'sim' : 'date';

    const params = new URLSearchParams({
      query: query.trim(),
      display: String(display),
      start: '1',
      sort,
    });

    const response = await fetch(`${NAVER_NEWS_URL}?${params}`, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        status: response.status,
        data: { error: data.errorMessage || data.error || '네이버 검색 API 요청 실패' },
      };
    }

    const items = (data.items || []).map(normalizeItem);

    return {
      status: 200,
      data: {
        total: data.total || items.length,
        items,
        source: 'Naver',
      },
    };
  } catch (err) {
    const message = err.message || '네이버 뉴스 검색 실패';
    const status = message.includes('NAVER') ? 503 : 500;
    return { status, data: { error: message } };
  }
}

module.exports = { handleNaverNewsSearch, stripHtml };

/**
 * Tavily 뉴스 검색 — 인사이트 뉴스 카드 및 하단 뉴스 목록 연동
 * API 키는 서버 프록시(/api/tavily/search)에서만 사용
 */

let lastNewsQuery = '';

/** XSS 방지용 HTML 이스케이프 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** URL에서 출처 도메인 추출 */
function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Web';
  }
}

/** Tavily published_date → 표시용 날짜 */
function formatNewsDate(dateStr) {
  if (!dateStr) return '최근';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/** 인사이트 뉴스 카드 결과 영역 렌더링 */
function renderNewsCardResults(results, query) {
  const container = document.getElementById('news-search-results');
  const badge = document.getElementById('news-count-badge');
  if (!container) return;

  if (!results || results.length === 0) {
    container.innerHTML = `
      <p class="insight-news-empty">"${escapeHtml(query)}" 검색 결과가 없습니다.</p>
    `;
    if (badge) badge.textContent = '0건';
    return;
  }

  // 카드에는 상위 3건만 — 한눈에 보기 쉽게
  const top = results.slice(0, 3);

  container.innerHTML = top.map((item, i) => `
    <a href="${escapeHtml(item.url)}" class="insight-news-item insight-news-item--link" target="_blank" rel="noopener noreferrer">
      <span class="insight-news-item__dot ${i === 0 ? 'insight-news-item__dot--hot' : ''}"></span>
      <div class="insight-news-item__text">
        <p class="insight-news-item__title">${escapeHtml(item.title)}</p>
        <span class="insight-news-item__time">${escapeHtml(formatNewsDate(item.published_date))} · ${escapeHtml(extractDomain(item.url))}</span>
      </div>
    </a>
  `).join('');

  if (badge) badge.textContent = `${results.length}건`;
}

/** 하단 전체 뉴스 섹션 렌더링 — Tavily 결과로 갱신 */
function renderFullNewsList(results, query) {
  const list = document.getElementById('news-list');
  if (!list) return;

  if (!results || results.length === 0) {
    list.innerHTML = `
      <p class="news-empty">"${escapeHtml(query)}"에 대한 뉴스를 찾지 못했습니다.</p>
    `;
    return;
  }

  list.innerHTML = results.map((item) => `
    <article class="news-item news-item--tavily">
      <time class="news-date">${escapeHtml(formatNewsDate(item.published_date))}</time>
      <span class="news-category news-category--live">Tavily</span>
      <div class="news-content">
        <h3 class="news-title">
          <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="news-title-link">
            ${escapeHtml(item.title)}
          </a>
        </h3>
        <p class="news-summary">${escapeHtml(item.content || '')}</p>
        <p class="news-source">${escapeHtml(extractDomain(item.url))}</p>
      </div>
    </article>
  `).join('');
}

/** 로딩·오류 상태 표시 */
function setNewsCardState(state, message = '') {
  const container = document.getElementById('news-search-results');
  const badge = document.getElementById('news-count-badge');
  const card = document.getElementById('news-insight-card');

  if (card) card.classList.toggle('is-loading', state === 'loading');

  if (!container) return;

  if (state === 'loading') {
    container.innerHTML = `
      <div class="insight-news-loading">
        <div class="insight-news-loading__spinner" aria-hidden="true"></div>
        <span>Tavily로 뉴스 검색 중…</span>
      </div>
    `;
    if (badge) badge.textContent = '검색 중';
    return;
  }

  if (state === 'error') {
    container.innerHTML = `
      <div class="insight-news-error">
        <p>${escapeHtml(message)}</p>
        <p class="insight-news-error__hint">로컬: <code>npm start</code> · Vercel: <code>npm run dev:vercel</code></p>
      </div>
    `;
    if (badge) badge.textContent = '오류';
  }
}

/** Tavily API로 뉴스 검색 실행 */
async function searchDefenseNews(query) {
  const trimmed = (query || '').trim();
  if (!trimmed) return;

  lastNewsQuery = trimmed;
  setNewsCardState('loading');

  const input = document.getElementById('news-search-input');
  if (input) input.value = trimmed;

  try {
    if (!window.TavilyAPI) {
      throw new Error('Tavily 클라이언트가 로드되지 않았습니다.');
    }

    const data = await TavilyAPI.search(trimmed, {
      topic: 'news',
      search_depth: 'basic',
      max_results: 6,
    });

    const results = data.results || [];
    renderNewsCardResults(results, trimmed);
    renderFullNewsList(results, trimmed);
  } catch (err) {
    setNewsCardState('error', err.message || '뉴스 검색에 실패했습니다.');
  }
}

/** 검색 폼·퀵 토픽 버튼 이벤트 연결 */
function bindNewsSearchEvents() {
  const form = document.getElementById('news-search-form');
  const input = document.getElementById('news-search-input');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      searchDefenseNews(input?.value);
    });
  }

  document.querySelectorAll('[data-news-query]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const query = btn.getAttribute('data-news-query');
      searchDefenseNews(query);
    });
  });
}

/** 뉴스 카드 초기화 — 기본 검색어로 첫 로드 */
function initNewsSearch() {
  bindNewsSearchEvents();

  const config = DEFENSE_DATA.tavilyNews;
  const defaultQuery = config?.defaultQuery || 'defense industry news';

  searchDefenseNews(defaultQuery);
}

/** 새로고침 시 마지막 검색어로 재조회 */
function refreshNewsSearch() {
  const config = DEFENSE_DATA.tavilyNews;
  const query = lastNewsQuery || config?.defaultQuery || 'defense industry news';
  searchDefenseNews(query);
}

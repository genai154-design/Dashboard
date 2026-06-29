/**
 * Tavily 뉴스 검색 — 국외 뉴스 패널 (좌측)
 * API 키는 서버 프록시(/api/tavily/search)에서만 사용
 */

let lastTavilyQuery = '';
let lastTavilyResults = [];

function notifyNewsUpdated() {
  document.dispatchEvent(new CustomEvent('news-search-updated'));
}

function getLastTavilyResults() {
  return lastTavilyResults;
}

function getLastTavilyQuery() {
  return lastTavilyQuery;
}

window.getLastTavilyResults = getLastTavilyResults;
window.getLastTavilyQuery = getLastTavilyQuery;

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Web';
  }
}

function formatNewsDate(dateStr) {
  if (!dateStr) return '최근';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function renderTavilyPanelResults(results, query) {
  const container = document.getElementById('tavily-search-results');
  const badge = document.getElementById('tavily-count-badge');
  const panel = document.getElementById('tavily-panel');
  if (panel) panel.classList.remove('is-loading');

  if (!container) return;

  if (!results || results.length === 0) {
    container.innerHTML = `<p class="insight-news-empty">"${escapeHtml(query)}" 국외 뉴스가 없습니다.</p>`;
    if (badge) badge.textContent = '0건';
    return;
  }

  const top = results.slice(0, 4);
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

function renderTavilyFullList(results, query) {
  const list = document.getElementById('news-list-global');
  if (!list) return;

  if (!results || results.length === 0) {
    list.innerHTML = `<p class="news-empty">"${escapeHtml(query)}" 국외 뉴스를 찾지 못했습니다.</p>`;
    return;
  }

  list.innerHTML = results.map((item) => `
    <article class="news-item news-item--tavily">
      <time class="news-date">${escapeHtml(formatNewsDate(item.published_date))}</time>
      <span class="news-category news-category--live">국외</span>
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

function setTavilyPanelState(state, message = '') {
  const container = document.getElementById('tavily-search-results');
  const badge = document.getElementById('tavily-count-badge');
  const panel = document.getElementById('tavily-panel');
  if (panel) panel.classList.toggle('is-loading', state === 'loading');
  if (!container) return;

  if (state === 'loading') {
    container.innerHTML = `
      <div class="insight-news-loading">
        <div class="insight-news-loading__spinner" aria-hidden="true"></div>
        <span>국외 뉴스 검색 중…</span>
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

async function searchTavilyNews(query) {
  const trimmed = (query || '').trim();
  if (!trimmed) return;

  lastTavilyQuery = trimmed;
  setTavilyPanelState('loading');

  const input = document.getElementById('tavily-search-input');
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
    lastTavilyResults = results;
    renderTavilyPanelResults(results, trimmed);
    renderTavilyFullList(results, trimmed);
    notifyNewsUpdated();
  } catch (err) {
    setTavilyPanelState('error', err.message || '국외 뉴스 검색에 실패했습니다.');
  }
}

function bindTavilySearchEvents() {
  const form = document.getElementById('tavily-search-form');
  const input = document.getElementById('tavily-search-input');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      searchTavilyNews(input?.value);
    });
  }

  document.querySelectorAll('[data-tavily-query]').forEach((btn) => {
    btn.addEventListener('click', () => {
      searchTavilyNews(btn.getAttribute('data-tavily-query'));
    });
  });
}

function initTavilySearch() {
  bindTavilySearchEvents();
  const defaultQuery = DEFENSE_DATA.tavilyNews?.defaultQuery || 'defense industry news';
  searchTavilyNews(defaultQuery);
}

function refreshTavilySearch() {
  const query = lastTavilyQuery || DEFENSE_DATA.tavilyNews?.defaultQuery || 'defense industry news';
  searchTavilyNews(query);
}

/** Tavily + Naver 뉴스 패널 동시 초기화 */
function initNewsSearch() {
  initTavilySearch();
  if (typeof initNaverSearch === 'function') {
    initNaverSearch();
  }
}

function refreshNewsSearch() {
  refreshTavilySearch();
  if (typeof refreshNaverSearch === 'function') {
    refreshNaverSearch();
  }
}

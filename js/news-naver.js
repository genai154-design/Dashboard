/**
 * 네이버 뉴스 검색 — 국내 뉴스 패널 (우측)
 */

let lastNaverQuery = '';
let lastNaverResults = [];

function notifyNewsUpdated() {
  document.dispatchEvent(new CustomEvent('news-search-updated'));
}

function getLastNaverResults() {
  return lastNaverResults;
}

function getLastNaverQuery() {
  return lastNaverQuery;
}

window.getLastNaverResults = getLastNaverResults;
window.getLastNaverQuery = getLastNaverQuery;

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatNaverDate(dateStr) {
  if (!dateStr) return '최근';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function extractSource(item) {
  try {
    const url = item.originallink || item.url;
    return new URL(url).hostname.replace(/^www\./, '').replace(/\.co\.kr$/, '');
  } catch {
    return '국내';
  }
}

function renderNaverPanelResults(items, query) {
  const container = document.getElementById('naver-search-results');
  const badge = document.getElementById('naver-count-badge');
  const panel = document.getElementById('naver-panel');
  if (panel) panel.classList.remove('is-loading');

  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `<p class="insight-news-empty">"${escapeHtml(query)}" 국내 뉴스가 없습니다.</p>`;
    if (badge) badge.textContent = '0건';
    return;
  }

  const top = items.slice(0, 4);
  container.innerHTML = top.map((item, i) => `
    <a href="${escapeHtml(item.url)}" class="insight-news-item insight-news-item--link" target="_blank" rel="noopener noreferrer">
      <span class="insight-news-item__dot insight-news-item__dot--naver ${i === 0 ? 'insight-news-item__dot--hot' : ''}"></span>
      <div class="insight-news-item__text">
        <p class="insight-news-item__title">${escapeHtml(item.title)}</p>
        <span class="insight-news-item__time">${escapeHtml(formatNaverDate(item.published_date))} · ${escapeHtml(extractSource(item))}</span>
      </div>
    </a>
  `).join('');

  if (badge) badge.textContent = `${items.length}건`;
}

function renderNaverFullList(items, query) {
  const list = document.getElementById('news-list-domestic');
  if (!list) return;

  if (!items || items.length === 0) {
    list.innerHTML = `<p class="news-empty">"${escapeHtml(query)}" 국내 뉴스를 찾지 못했습니다.</p>`;
    return;
  }

  list.innerHTML = items.map((item) => `
    <article class="news-item news-item--naver">
      <time class="news-date">${escapeHtml(formatNaverDate(item.published_date))}</time>
      <span class="news-category news-category--naver">국내</span>
      <div class="news-content">
        <h3 class="news-title">
          <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="news-title-link">
            ${escapeHtml(item.title)}
          </a>
        </h3>
        <p class="news-summary">${escapeHtml(item.content || '')}</p>
        <p class="news-source">${escapeHtml(extractSource(item))}</p>
      </div>
    </article>
  `).join('');
}

function setNaverPanelState(state, message = '') {
  const container = document.getElementById('naver-search-results');
  const badge = document.getElementById('naver-count-badge');
  const panel = document.getElementById('naver-panel');
  if (panel) panel.classList.toggle('is-loading', state === 'loading');
  if (!container) return;

  if (state === 'loading') {
    container.innerHTML = `
      <div class="insight-news-loading">
        <div class="insight-news-loading__spinner insight-news-loading__spinner--naver" aria-hidden="true"></div>
        <span>네이버 뉴스 검색 중…</span>
      </div>
    `;
    if (badge) badge.textContent = '검색 중';
    return;
  }

  if (state === 'error') {
    container.innerHTML = `
      <div class="insight-news-error">
        <p>${escapeHtml(message)}</p>
        <p class="insight-news-error__hint">NAVER_CLIENT_ID · NAVER_CLIENT_SECRET 확인</p>
      </div>
    `;
    if (badge) badge.textContent = '오류';
  }
}

async function searchNaverNews(query) {
  const trimmed = (query || '').trim();
  if (!trimmed) return;

  lastNaverQuery = trimmed;
  setNaverPanelState('loading');

  const input = document.getElementById('naver-search-input');
  if (input) input.value = trimmed;

  try {
    if (!window.NaverAPI) throw new Error('Naver API 클라이언트가 로드되지 않았습니다.');

    const data = await NaverAPI.searchNews(trimmed, { display: 6, sort: 'date' });
    const items = data.items || [];
    lastNaverResults = items;
    renderNaverPanelResults(items, trimmed);
    renderNaverFullList(items, trimmed);
    notifyNewsUpdated();
  } catch (err) {
    setNaverPanelState('error', err.message || '국내 뉴스 검색에 실패했습니다.');
  }
}

function bindNaverSearchEvents() {
  const form = document.getElementById('naver-search-form');
  const input = document.getElementById('naver-search-input');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      searchNaverNews(input?.value);
    });
  }

  document.querySelectorAll('[data-naver-query]').forEach((btn) => {
    btn.addEventListener('click', () => {
      searchNaverNews(btn.getAttribute('data-naver-query'));
    });
  });
}

function initNaverSearch() {
  bindNaverSearchEvents();
  const defaultQuery = DEFENSE_DATA.naverNews?.defaultQuery || '방산 K방산';
  searchNaverNews(defaultQuery);
}

function refreshNaverSearch() {
  const query = lastNaverQuery || DEFENSE_DATA.naverNews?.defaultQuery || '방산 K방산';
  searchNaverNews(query);
}

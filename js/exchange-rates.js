/**
 * 환율 인사이트 카드 — Exchange Rate API 실시간 연동
 */

/** XSS 방지 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** 환율 카드 UI 상태 */
function setFxCardState(state, message = '') {
  const body = document.getElementById('fx-rates-body');
  const badge = document.getElementById('fx-date-badge');
  const card = document.getElementById('fx-insight-card');

  if (card) card.classList.toggle('is-loading', state === 'loading');
  if (!body) return;

  if (state === 'loading') {
    body.innerHTML = `
      <div class="insight-fx-loading">
        <div class="insight-news-loading__spinner" aria-hidden="true"></div>
        <span>환율 불러오는 중…</span>
      </div>
    `;
    if (badge) badge.textContent = '조회 중';
    return;
  }

  if (state === 'error') {
    body.innerHTML = `
      <div class="insight-fx-error">
        <p>${escapeHtml(message)}</p>
        <p class="insight-fx-error__hint">로컬: <code>npm start</code> · Vercel: 환경 변수 확인</p>
      </div>
    `;
    if (badge) badge.textContent = '오류';
  }
}

/** API 응답으로 환율 카드 렌더링 */
function renderFxCard(data) {
  const body = document.getElementById('fx-rates-body');
  const badge = document.getElementById('fx-date-badge');
  if (!body) return;

  body.innerHTML = `
    ${data.rates.map((rate) => `
      <div class="insight-fx-row">
        <span class="insight-fx-pair">${escapeHtml(rate.pair)}</span>
        <span class="insight-fx-value">${escapeHtml(rate.value)}</span>
        <span class="insight-fx-change insight-fx-change--${rate.direction === 'neutral' ? 'flat' : rate.direction}">
          ${rate.direction === 'up' ? '▲' : rate.direction === 'down' ? '▼' : '—'} ${escapeHtml(rate.change)}
        </span>
      </div>
    `).join('')}
    <p class="insight-fx-note">${escapeHtml(data.note)}</p>
  `;

  if (badge) badge.textContent = data.baseDate;
}

/** Exchange Rate API 호출 */
async function loadExchangeRates() {
  setFxCardState('loading');

  try {
    if (!window.ExchangeAPI) {
      throw new Error('Exchange API 클라이언트가 로드되지 않았습니다.');
    }

    const data = await ExchangeAPI.fetchRates();
    renderFxCard(data);
  } catch (err) {
    setFxCardState('error', err.message || '환율 정보를 가져오지 못했습니다.');
  }
}

/** 환율 카드 새로고침 버튼 */
function bindFxRefresh() {
  const btn = document.getElementById('fx-refresh-btn');
  if (btn) {
    btn.addEventListener('click', () => loadExchangeRates());
  }
}

function initExchangeRates() {
  bindFxRefresh();
  loadExchangeRates();
}

function refreshExchangeRates() {
  loadExchangeRates();
}

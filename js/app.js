/**
 * 방산 동향 대시보드 — UI 렌더링 및 인터랙션
 */

/** HTML 속성값 이스케이프 — 퀵 검색 버튼 data 속성용 */
function escapeHtmlAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

/** 인사이트 카드(뉴스·입찰·환율·AI) 렌더링 */
function renderInsightCards() {
  const grid = document.getElementById('insight-grid');
  const { bidding } = DEFENSE_DATA.insightCards;

  grid.innerHTML = `
    <!-- 뉴스 검색 — 국외(Tavily) · 국내(Naver) 이중 패널 -->
    <article class="insight-card insight-card--news-dual news-dual-card" id="news-dual-card">
      <div class="insight-card__header news-dual-card__header">
        <div class="insight-card__title-wrap">
          <div class="insight-card__icon insight-card__icon--news">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/></svg>
          </div>
          <div>
            <h3 class="insight-card__title">뉴스 검색</h3>
            <p class="news-dual-card__subtitle">국외 · 국내 실시간 검색</p>
          </div>
        </div>
        <a href="#news" class="insight-card__link">전체 뉴스 보기 →</a>
      </div>

      <div class="news-dual-grid">
        <!-- 좌측: Tavily 국외 뉴스 -->
        <section class="news-panel news-panel--global" id="tavily-panel">
          <div class="news-panel__head">
            <span class="news-panel__badge">🌍 국외</span>
            <span class="news-panel__source">Tavily</span>
            <span class="news-panel__count" id="tavily-count-badge">—</span>
          </div>

          <form class="insight-news-search" id="tavily-search-form" aria-label="국외 방산 뉴스 검색">
            <input
              type="search"
              id="tavily-search-input"
              class="insight-news-search__input"
              placeholder="Global defense news…"
              autocomplete="off"
              aria-label="국외 뉴스 검색어"
            />
            <button type="submit" class="insight-news-search__btn" aria-label="국외 뉴스 검색">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </button>
          </form>

          <div class="insight-news-chips" role="group" aria-label="국외 빠른 검색">
            ${(DEFENSE_DATA.tavilyNews?.quickTopics || []).map((t) => `
              <button type="button" class="insight-news-chip" data-tavily-query="${escapeHtmlAttr(t.query)}">${t.label}</button>
            `).join('')}
          </div>

          <div class="news-panel__body" id="tavily-search-results">
            <div class="insight-news-loading">
              <div class="insight-news-loading__spinner" aria-hidden="true"></div>
              <span>국외 뉴스 불러오는 중…</span>
            </div>
          </div>
        </section>

        <!-- 우측: Naver 국내 뉴스 -->
        <section class="news-panel news-panel--domestic" id="naver-panel">
          <div class="news-panel__head">
            <span class="news-panel__badge news-panel__badge--naver">🇰🇷 국내</span>
            <span class="news-panel__source news-panel__source--naver">Naver</span>
            <span class="news-panel__count news-panel__count--naver" id="naver-count-badge">—</span>
          </div>

          <form class="insight-news-search insight-news-search--naver" id="naver-search-form" aria-label="국내 방산 뉴스 검색">
            <input
              type="search"
              id="naver-search-input"
              class="insight-news-search__input insight-news-search__input--naver"
              placeholder="방산·국방 뉴스 검색…"
              autocomplete="off"
              aria-label="국내 뉴스 검색어"
            />
            <button type="submit" class="insight-news-search__btn insight-news-search__btn--naver" aria-label="국내 뉴스 검색">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </button>
          </form>

          <div class="insight-news-chips" role="group" aria-label="국내 빠른 검색">
            ${(DEFENSE_DATA.naverNews?.quickTopics || []).map((t) => `
              <button type="button" class="insight-news-chip insight-news-chip--naver" data-naver-query="${escapeHtmlAttr(t.query)}">${t.label}</button>
            `).join('')}
          </div>

          <div class="news-panel__body" id="naver-search-results">
            <div class="insight-news-loading">
              <div class="insight-news-loading__spinner insight-news-loading__spinner--naver" aria-hidden="true"></div>
              <span>국내 뉴스 불러오는 중…</span>
            </div>
          </div>
        </section>
      </div>
    </article>

    <!-- 입찰 카드 -->
    <article class="insight-card insight-card--bid">
      <div class="insight-card__header">
        <div class="insight-card__title-wrap">
          <div class="insight-card__icon insight-card__icon--bid">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <h3 class="insight-card__title">입찰</h3>
        </div>
        <span class="insight-card__badge insight-card__badge--count">진행 ${bidding.activeCount}건</span>
      </div>
      <div class="insight-card__body">
        <div class="insight-bid-summary">
          <span class="insight-bid-summary__label">총 사업 규모</span>
          <span class="insight-bid-summary__value">${bidding.totalAmount}</span>
        </div>
        ${bidding.items.map((item) => `
          <div class="insight-bid-item">
            <div class="insight-bid-item__row">
              <span class="insight-bid-item__title">${item.title}</span>
              <span class="insight-bid-item__deadline">${item.deadline}</span>
            </div>
            <div class="insight-bid-item__meta">
              <span>${item.agency}</span>
              <span>${item.amount}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </article>

    <!-- 환율 카드 — Exchange Rate API 실시간 -->
    <article class="insight-card insight-card--fx" id="fx-insight-card">
      <div class="insight-card__header">
        <div class="insight-card__title-wrap">
          <div class="insight-card__icon insight-card__icon--fx">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M9 9h4.5a2.5 2.5 0 0 1 0 5H9M15 15H10.5a2.5 2.5 0 0 1 0-5H15"/></svg>
          </div>
          <h3 class="insight-card__title">환율</h3>
        </div>
        <div class="insight-card__header-actions">
          <span class="insight-card__badge insight-card__badge--count" id="fx-date-badge">—</span>
          <button type="button" class="insight-fx-refresh" id="fx-refresh-btn" aria-label="환율 새로고침">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
        </div>
      </div>
      <div class="insight-card__body" id="fx-rates-body">
        <div class="insight-fx-loading">
          <div class="insight-news-loading__spinner" aria-hidden="true"></div>
          <span>환율 불러오는 중…</span>
        </div>
      </div>
      <div class="insight-card__footer">
        <span class="insight-card__source">ExchangeRate-API</span>
      </div>
    </article>

    <!-- AI 분석 카드 — Gemini 2.5 Flash Lite -->
    <article class="insight-card insight-card--ai" id="ai-insight-card">
      <div class="insight-card__header">
        <div class="insight-card__title-wrap">
          <div class="insight-card__icon insight-card__icon--ai">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2a4 4 0 0 0-4 4v1H6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1v1a4 4 0 0 0 8 0v-1h1a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/></svg>
          </div>
          <h3 class="insight-card__title">AI 분석</h3>
        </div>
        <div class="insight-card__header-actions">
          <span class="insight-card__badge insight-card__badge--ai" id="ai-status-badge">Gemini</span>
          <button type="button" class="insight-ai-refresh" id="ai-refresh-btn" aria-label="AI 분석 새로고침">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
        </div>
      </div>
      <div class="insight-card__body" id="ai-analysis-body">
        <div class="insight-ai-loading">
          <div class="insight-news-loading__spinner insight-news-loading__spinner--ai" aria-hidden="true"></div>
          <span>뉴스 검색 후 AI 분석을 시작합니다…</span>
        </div>
      </div>
      <div class="insight-card__footer">
        <span class="insight-ai-updated" id="ai-updated-at">분석 대기 중</span>
        <span class="insight-card__source">Gemini 2.5 Flash Lite</span>
      </div>
    </article>
  `;
}

/** KPI 카드 렌더링 */
function renderKPIs(year) {
  const grid = document.getElementById('kpi-grid');
  const items = DEFENSE_DATA.kpi[year] || DEFENSE_DATA.kpi['2026'];

  grid.innerHTML = items.map((item) => `
    <article class="kpi-card">
      <div class="kpi-icon ${KPI_ICON_CLASS[item.icon] || 'kpi-icon--green'}">
        ${KPI_ICONS[item.icon] || ''}
      </div>
      <div class="kpi-label">${item.label}</div>
      <div class="kpi-value">${item.value}</div>
      <div class="kpi-change ${item.direction}">
        ${item.direction === 'positive' ? '▲' : item.direction === 'negative' ? '▼' : '—'}
        ${item.change} vs 전년
      </div>
    </article>
  `).join('');
}

/** 지역 동향 카드 렌더링 */
function renderRegions() {
  const grid = document.getElementById('region-grid');

  grid.innerHTML = DEFENSE_DATA.regions.map((region) => `
    <article class="region-card">
      <div class="region-header">
        <span class="region-name">${region.name}</span>
        <span class="region-status region-status--${region.status}">${region.statusLabel}</span>
      </div>
      <div class="region-budget">${region.budget}</div>
      <div class="region-trend">${region.trend}</div>
      <div class="region-tags">
        ${region.tags.map((tag) => `<span class="region-tag">${tag}</span>`).join('')}
      </div>
    </article>
  `).join('');
}

/** 기술 트렌드 카드 렌더링 */
function renderTechnologies() {
  const grid = document.getElementById('tech-grid');

  grid.innerHTML = DEFENSE_DATA.technologies.map((tech) => `
    <article class="tech-card">
      <div class="tech-rank">${tech.rank}</div>
      <h3 class="tech-name">${tech.name}</h3>
      <p class="tech-desc">${tech.desc}</p>
      <div class="tech-progress">
        <div class="tech-progress-label">
          <span>도입률</span>
          <span>${tech.adoption}%</span>
        </div>
        <div class="tech-progress-bar">
          <div class="tech-progress-fill" style="width: ${tech.adoption}%"></div>
        </div>
      </div>
      <div class="tech-progress">
        <div class="tech-progress-label">
          <span>투자 증가</span>
          <span>${tech.investment}%</span>
        </div>
        <div class="tech-progress-bar">
          <div class="tech-progress-fill" style="width: ${tech.investment}%; background: linear-gradient(90deg, #4a9eff, #7eb8ff)"></div>
        </div>
      </div>
    </article>
  `).join('');
}

/** 마지막 업데이트 시각 표시 — 데스크톱·모바일 동시 갱신 */
function updateTimestamp() {
  const formatted = new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const desktop = document.getElementById('last-updated');
  const mobile = document.getElementById('last-updated-mobile');
  if (desktop) desktop.textContent = formatted;
  if (mobile) mobile.textContent = formatted;
}

/** 사이드바 네비게이션 — 스크롤 위치에 따라 active 상태 갱신 */
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = Array.from(navItems).map((item) =>
    document.getElementById(item.getAttribute('href').slice(1))
  );

  function onScroll() {
    // 모바일 하단 네비 높이를 반영해 섹션 활성화 오프셋 조정
    const navOffset = window.innerWidth <= 768 ? 80 : 120;
    const scrollY = window.scrollY + navOffset;

    sections.forEach((section, i) => {
      if (!section) return;
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;

      if (scrollY >= top && scrollY < bottom) {
        navItems.forEach((n) => n.classList.remove('active'));
        navItems[i].classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      navItems.forEach((n) => n.classList.remove('active'));
      item.classList.add('active');
    });
  });
}

/** 연도 필터 변경 */
function initYearFilter() {
  const select = document.getElementById('year-filter');

  select.addEventListener('change', () => {
    renderKPIs(select.value);
  });
}

/** 새로고침 버튼 — KPI·타임스탬프 갱신 및 시각적 피드백 */
function initRefresh() {
  const btn = document.getElementById('btn-refresh');
  const select = document.getElementById('year-filter');

  btn.addEventListener('click', () => {
    btn.classList.add('spinning');
    btn.disabled = true;

  // 짧은 지연으로 새로고침 UX 제공 (실제 API 연동 시 fetch로 교체)
    setTimeout(() => {
      renderKPIs(select.value);
      renderInsightCards();
      initNewsSearch();
      initExchangeRates();
      initGeminiAnalysis();
      updateTimestamp();
      resizeCharts();
      btn.classList.remove('spinning');
      btn.disabled = false;
    }, 600);
  });
}

/** 대시보드 초기화 */
function initDashboard() {
  const year = document.getElementById('year-filter').value;

  renderKPIs(year);
  renderInsightCards();
  initNewsSearch();
  initExchangeRates();
  initGeminiAnalysis();
  renderRegions();
  renderTechnologies();
  updateTimestamp();
  initCharts();
  initNavigation();
  initYearFilter();
  initRefresh();

  // 화면 회전·리사이즈 시 차트 레이아웃 재조정
  window.addEventListener('resize', () => {
    if (typeof resizeCharts === 'function') resizeCharts();
  }, { passive: true });
}

document.addEventListener('DOMContentLoaded', initDashboard);

/**
 * Gemini AI 분석 — Tavily·Naver 뉴스 검색 결과 요약·분석
 * 모델: .env GEMINI_MODEL (기본 gemini-2.5-flash-lite)
 */

let analysisDebounceTimer = null;
let analysisInFlight = false;
let geminiDocumentEventsBound = false;
let lastAiAnalysis = null;

function getLastAiAnalysis() {
  return lastAiAnalysis;
}

window.getLastAiAnalysis = getLastAiAnalysis;

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getHighlightLabel(type) {
  if (type === 'opportunity') return '기회';
  if (type === 'risk') return '리스크';
  return '주목';
}

function getSentimentClass(score, sentiment) {
  if (sentiment === '부정' || score < 35) return 'insight-ai-sentiment-label--negative';
  if (sentiment === '중립' || score < 65) return 'insight-ai-sentiment-label--neutral';
  return '';
}

function formatAnalyzedAt(isoString) {
  if (!isoString) return '방금';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  return d.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function collectNewsPayload() {
  const globalNews =
    typeof window.getLastTavilyResults === 'function'
      ? window.getLastTavilyResults()
      : [];
  const domesticNews =
    typeof window.getLastNaverResults === 'function'
      ? window.getLastNaverResults()
      : [];
  const globalQuery =
    typeof window.getLastTavilyQuery === 'function'
      ? window.getLastTavilyQuery()
      : '';
  const domesticQuery =
    typeof window.getLastNaverQuery === 'function'
      ? window.getLastNaverQuery()
      : '';

  return { globalNews, domesticNews, globalQuery, domesticQuery };
}

function setAiCardState(state, message = '') {
  const body = document.getElementById('ai-analysis-body');
  const badge = document.getElementById('ai-status-badge');
  const card = document.getElementById('ai-insight-card');
  const updated = document.getElementById('ai-updated-at');

  if (card) card.classList.toggle('is-loading', state === 'loading');

  const kakaoBtn = document.getElementById('ai-kakao-send-btn');
  if (kakaoBtn) {
    kakaoBtn.disabled = state === 'loading' || state === 'waiting' || state === 'error' || !lastAiAnalysis;
  }

  if (!body) return;

  if (state === 'loading') {
    body.innerHTML = `
      <div class="insight-ai-loading">
        <div class="insight-news-loading__spinner insight-news-loading__spinner--ai" aria-hidden="true"></div>
        <span>Gemini가 뉴스를 분석 중…</span>
      </div>
    `;
    if (badge) badge.textContent = '분석 중';
    return;
  }

  if (state === 'waiting') {
    body.innerHTML = `
      <p class="insight-ai-waiting">${escapeHtml(message || '뉴스 검색 완료 후 AI 분석이 시작됩니다.')}</p>
    `;
    if (badge) badge.textContent = '대기';
    if (updated) updated.textContent = '분석 대기 중';
    return;
  }

  if (state === 'error') {
    body.innerHTML = `
      <div class="insight-ai-error">
        <p>${escapeHtml(message)}</p>
        <p class="insight-ai-error__hint">npm start로 서버 실행 · prompt/news-analysis.md · GEMINI_API_KEY 확인</p>
      </div>
    `;
    if (badge) badge.textContent = '오류';
    lastAiAnalysis = null;
  }
}

function renderAiAnalysis(data) {
  lastAiAnalysis = data;
  const body = document.getElementById('ai-analysis-body');
  const badge = document.getElementById('ai-status-badge');
  const updated = document.getElementById('ai-updated-at');
  const card = document.getElementById('ai-insight-card');

  if (card) card.classList.remove('is-loading');
  if (!body) return;

  const score = data.sentimentScore ?? 50;
  const sentiment = data.sentiment || '중립';
  const sentimentClass = getSentimentClass(score, sentiment);
  const highlights = data.highlights || [];

  body.innerHTML = `
    <div class="insight-ai-sentiment">
      <span class="insight-ai-score">${score}</span>
      <span class="insight-ai-sentiment-label ${sentimentClass}">
        ${escapeHtml(sentiment)} 전망
      </span>
    </div>
    <p class="insight-ai-summary">${escapeHtml(data.summary)}</p>
    ${highlights.map((h) => `
      <div class="insight-ai-highlight">
        <span class="insight-ai-highlight__tag insight-ai-highlight__tag--${escapeHtml(h.type)}">
          ${escapeHtml(getHighlightLabel(h.type))}
        </span>
        <span>${escapeHtml(h.text)}</span>
      </div>
    `).join('')}
    <p class="insight-ai-meta">
      분석 뉴스 ${data.newsCount?.global || 0}건(국외) · ${data.newsCount?.domestic || 0}건(국내)
    </p>
  `;

  if (badge) badge.textContent = 'Gemini';
  if (updated) {
    updated.textContent = `마지막 분석: ${formatAnalyzedAt(data.analyzedAt)}`;
  }

  const modelLabel = document.getElementById('ai-model-label');
  if (modelLabel && data.model) {
    modelLabel.textContent = data.model;
  }

  const kakaoBtn = document.getElementById('ai-kakao-send-btn');
  if (kakaoBtn) kakaoBtn.disabled = false;
}

async function runGeminiAnalysis() {
  if (analysisInFlight) return;

  const { globalNews, domesticNews, globalQuery, domesticQuery } =
    collectNewsPayload();

  if (globalNews.length === 0 && domesticNews.length === 0) {
    setAiCardState('waiting');
    return;
  }

  analysisInFlight = true;
  setAiCardState('loading');

  try {
    if (!window.GeminiAPI) {
      throw new Error('Gemini API 클라이언트가 로드되지 않았습니다.');
    }

    const data = await GeminiAPI.analyzeNews({
      globalNews,
      domesticNews,
      globalQuery,
      domesticQuery,
    });

    renderAiAnalysis(data);
  } catch (err) {
    setAiCardState('error', err.message || 'AI 분석에 실패했습니다.');
  } finally {
    analysisInFlight = false;
  }
}

/** 뉴스 검색 완료 후 디바운스 — 연속 검색 시 마지막만 분석 */
function scheduleGeminiAnalysis() {
  clearTimeout(analysisDebounceTimer);
  analysisDebounceTimer = setTimeout(runGeminiAnalysis, 1200);
}

function bindGeminiEvents() {
  const refreshBtn = document.getElementById('ai-refresh-btn');
  // 카드 재렌더 시 중복 리스너 방지
  if (refreshBtn && !refreshBtn.dataset.bound) {
    refreshBtn.dataset.bound = '1';
    refreshBtn.addEventListener('click', () => runGeminiAnalysis());
  }

  if (!geminiDocumentEventsBound) {
    document.addEventListener('news-search-updated', scheduleGeminiAnalysis);
    geminiDocumentEventsBound = true;
  }
}

function initGeminiAnalysis() {
  bindGeminiEvents();
  setAiCardState('waiting');
  scheduleGeminiAnalysis();
}

function refreshGeminiAnalysis() {
  runGeminiAnalysis();
}

/**
 * Gemini API 클라이언트 — 서버 프록시 경유
 */
const GEMINI_PROXY = '/api/gemini/analyze';

async function analyzeNews(payload) {
  const response = await fetch(GEMINI_PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Gemini 분석 실패 (${response.status})`);
  }

  return data;
}

window.GeminiAPI = { analyzeNews };

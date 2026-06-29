/**
 * 카카오 API 클라이언트 — 서버 프록시 경유
 */
const KAKAO_API = '/api/kakao';

async function getStatus() {
  const response = await fetch(`${KAKAO_API}/status`, { credentials: 'same-origin' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || '카카오 상태 확인 실패');
  }
  return data;
}

async function sendAnalysis(analysis) {
  const response = await fetch(`${KAKAO_API}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ analysis }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = new Error(data.error || `카카오톡 전송 실패 (${response.status})`);
    err.needLogin = data.needLogin;
    throw err;
  }

  return data;
}

function startLogin() {
  window.location.href = `${KAKAO_API}/login`;
}

window.KakaoAPI = { getStatus, sendAnalysis, startLogin };

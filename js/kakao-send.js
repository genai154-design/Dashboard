/**
 * AI 분석 결과 → 카카오톡 나에게 보내기
 */

let kakaoConnected = false;

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function setKakaoStatus(message, type = 'info') {
  const el = document.getElementById('ai-kakao-status');
  if (!el) return;
  el.textContent = message || '';
  el.className = `insight-kakao-status insight-kakao-status--${type}`;
}

function setKakaoSendLoading(loading) {
  const btn = document.getElementById('ai-kakao-send-btn');
  const card = document.getElementById('ai-insight-card');
  if (btn) {
    btn.disabled = loading || !window.getLastAiAnalysis?.();
    btn.classList.toggle('is-sending', loading);
  }
  if (card) card.classList.toggle('is-kakao-sending', loading);
}

/** OAuth 복귀 URL 파라미터 처리 */
function handleKakaoReturnParams() {
  const params = new URLSearchParams(window.location.search);
  const kakao = params.get('kakao');

  if (!kakao) return;

  if (kakao === 'connected') {
    kakaoConnected = true;
    setKakaoStatus('카카오 연동 완료. 분석 결과를 보낼 수 있습니다.', 'success');
  } else if (kakao === 'error') {
    const reason = params.get('reason') || '알 수 없는 오류';
    setKakaoStatus(`카카오 연동 실패: ${reason}`, 'error');
  }

  params.delete('kakao');
  params.delete('reason');
  const clean =
    window.location.pathname +
    (params.toString() ? `?${params.toString()}` : '') +
    window.location.hash;
  window.history.replaceState({}, '', clean);
}

async function refreshKakaoStatus() {
  if (!window.KakaoAPI) return;

  try {
    const data = await KakaoAPI.getStatus();
    kakaoConnected = data.connected;
    if (kakaoConnected) {
      setKakaoStatus('카카오 연동됨', 'success');
    }
  } catch {
    /* 상태 확인 실패는 무시 */
  }
}

async function sendAnalysisToKakao() {
  const analysis = window.getLastAiAnalysis?.();
  if (!analysis) {
    setKakaoStatus('먼저 AI 분석을 완료하세요.', 'error');
    return;
  }

  if (!window.KakaoAPI) {
    setKakaoStatus('카카오 API 클라이언트가 로드되지 않았습니다.', 'error');
    return;
  }

  setKakaoSendLoading(true);
  setKakaoStatus('카카오톡으로 전송 중…', 'info');

  try {
    await KakaoAPI.sendAnalysis(analysis);
    setKakaoStatus('카카오톡으로 보냈습니다.', 'success');
    kakaoConnected = true;
  } catch (err) {
    if (err.needLogin) {
      setKakaoStatus('카카오 로그인 후 다시 시도합니다…', 'info');
      KakaoAPI.startLogin();
      return;
    }
    setKakaoStatus(err.message || '전송에 실패했습니다.', 'error');
  } finally {
    setKakaoSendLoading(false);
  }
}

function bindKakaoSendEvents() {
  const btn = document.getElementById('ai-kakao-send-btn');
  if (btn && !btn.dataset.bound) {
    btn.dataset.bound = '1';
    btn.addEventListener('click', sendAnalysisToKakao);
  }
}

function initKakaoSend() {
  handleKakaoReturnParams();
  bindKakaoSendEvents();
  refreshKakaoStatus();
}

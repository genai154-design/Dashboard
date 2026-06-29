/**
 * 카카오 로그인 · 카카오톡 나에게 보내기 공통 핸들러
 */
const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';
const KAKAO_TOKEN_URL = 'https://kapi.kakao.com/oauth/token';
const KAKAO_MEMO_URL = 'https://kapi.kakao.com/v2/api/talk/memo/default/send';

const COOKIE_ACCESS = 'kakao_access_token';
const COOKIE_REFRESH = 'kakao_refresh_token';
const KAKAO_TEXT_MAX = 200;

/** 요청 Cookie 헤더 파싱 */
function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (name) cookies[name] = decodeURIComponent(value);
  });
  return cookies;
}

/** OAuth·세션 쿠키 설정 */
function setTokenCookies(res, tokenData, isProduction) {
  const secure = isProduction ? '; Secure' : '';
  const accessMaxAge = Number(tokenData.expires_in) || 21600;
  const refreshMaxAge = Number(tokenData.refresh_token_expires_in) || 5184000;

  const cookies = [
    `${COOKIE_ACCESS}=${encodeURIComponent(tokenData.access_token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${accessMaxAge}${secure}`,
  ];

  if (tokenData.refresh_token) {
    cookies.push(
      `${COOKIE_REFRESH}=${encodeURIComponent(tokenData.refresh_token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${refreshMaxAge}${secure}`
    );
  }

  res.setHeader('Set-Cookie', cookies);
}

/** 카카오 로그인 페이지로 리다이렉트 */
function buildAuthorizeUrl(getRestApiKey, getRedirectUri) {
  const params = new URLSearchParams({
    client_id: getRestApiKey(),
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: 'talk_message',
  });
  return `${KAKAO_AUTH_URL}?${params.toString()}`;
}

function handleKakaoLogin(res, getRestApiKey, getRedirectUri) {
  const url = buildAuthorizeUrl(getRestApiKey, getRedirectUri);
  res.writeHead(302, { Location: url });
  res.end();
}

/** 인가 코드 → 액세스 토큰 교환 */
async function exchangeAuthorizationCode(
  code,
  getRestApiKey,
  getClientSecret,
  getRedirectUri
) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: getRestApiKey(),
    redirect_uri: getRedirectUri(),
    code,
    client_secret: getClientSecret(),
  });

  const response = await fetch(KAKAO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data.error_description || data.error || '카카오 토큰 발급 실패'
    );
  }
  return data;
}

async function handleKakaoCallback(req, res, deps) {
  const { getAppOrigin, isProductionRuntime } = deps;
  const origin = getAppOrigin();
  const redirectBase = `${origin}/index.html`;

  const error = req.query?.error;
  if (error) {
    res.writeHead(302, {
      Location: `${redirectBase}?kakao=error&reason=${encodeURIComponent(error)}`,
    });
    return res.end();
  }

  const code = req.query?.code;
  if (!code) {
    res.writeHead(302, { Location: `${redirectBase}?kakao=error&reason=no_code` });
    return res.end();
  }

  try {
    const tokenData = await exchangeAuthorizationCode(
      code,
      deps.getRestApiKey,
      deps.getClientSecret,
      deps.getRedirectUri
    );
    setTokenCookies(res, tokenData, isProductionRuntime());
    res.writeHead(302, { Location: `${redirectBase}?kakao=connected` });
    return res.end();
  } catch (err) {
    const reason = encodeURIComponent(err.message || 'token_error');
    res.writeHead(302, { Location: `${redirectBase}?kakao=error&reason=${reason}` });
    return res.end();
  }
}

function getHighlightLabel(type) {
  if (type === 'opportunity') return '기회';
  if (type === 'risk') return '리스크';
  return '주목';
}

/** AI 분석 결과 → 카카오 텍스트 템플릿 (200자 제한) */
function formatAnalysisMessage(analysis) {
  const score = analysis.sentimentScore ?? '-';
  const sentiment = analysis.sentiment || '중립';
  const summary = analysis.summary || '';
  const highlights = (analysis.highlights || []).slice(0, 2);

  let text = `[방산 AI] ${sentiment} ${score}점\n${summary}`;

  highlights.forEach((h) => {
    if (h?.text) {
      text += `\n• ${getHighlightLabel(h.type)}: ${h.text}`;
    }
  });

  if (analysis.model) {
    text += `\n(${analysis.model})`;
  }

  if (text.length > KAKAO_TEXT_MAX) {
    return `${text.slice(0, KAKAO_TEXT_MAX - 1)}…`;
  }
  return text;
}

/** 카카오톡 나에게 보내기 */
async function sendTalkMemo(accessToken, text, linkUrl) {
  const template = {
    object_type: 'text',
    text,
    link: {
      web_url: linkUrl,
      mobile_web_url: linkUrl,
    },
    button_title: '대시보드',
  };

  const body = new URLSearchParams({
    template_object: JSON.stringify(template),
  });

  const response = await fetch(KAKAO_MEMO_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(
      data.msg || data.error_description || '카카오톡 메시지 전송 실패'
    );
    err.status = response.status;
    err.code = data.code;
    throw err;
  }
  return data;
}

async function handleKakaoSend(req, res, deps) {
  const cookies = parseCookies(req.headers?.cookie);
  const accessToken = cookies[COOKIE_ACCESS];

  if (!accessToken) {
    return {
      status: 401,
      data: {
        error: '카카오 로그인이 필요합니다.',
        needLogin: true,
      },
    };
  }

  const analysis = req.body?.analysis;
  if (!analysis || typeof analysis !== 'object') {
    return { status: 400, data: { error: 'analysis 데이터가 필요합니다.' } };
  }

  if (!analysis.summary) {
    return {
      status: 400,
      data: { error: '분석 요약이 없습니다. AI 분석을 먼저 실행하세요.' },
    };
  }

  try {
    const origin = deps.getAppOrigin();
    const text = formatAnalysisMessage(analysis);
    const linkUrl = `${origin}/index.html#insight-cards`;

    await sendTalkMemo(accessToken, text, linkUrl);

    return {
      status: 200,
      data: { ok: true, message: '카카오톡으로 분석 결과를 보냈습니다.' },
    };
  } catch (err) {
    const needLogin =
      err.status === 401 || err.code === -401 || err.code === -2;
    return {
      status: err.status && err.status >= 400 ? err.status : 500,
      data: {
        error: err.message || '카카오톡 전송 실패',
        needLogin,
      },
    };
  }
}

function handleKakaoStatus(req) {
  const cookies = parseCookies(req.headers?.cookie);
  return {
    status: 200,
    data: { connected: Boolean(cookies[COOKIE_ACCESS]) },
  };
}

module.exports = {
  parseCookies,
  handleKakaoLogin,
  handleKakaoCallback,
  handleKakaoSend,
  handleKakaoStatus,
  COOKIE_ACCESS,
};

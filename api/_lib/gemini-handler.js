/**
 * Gemini API — 뉴스 검색 결과 요약·분석 공통 핸들러
 * 모델: gemini-2.5-flash-lite
 */
const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    sentiment: { type: 'string', description: '긍정, 중립, 또는 부정' },
    sentimentScore: { type: 'integer', description: '0~100 감성 점수' },
    summary: { type: 'string', description: '한국어 요약 2~3문장' },
    highlights: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['opportunity', 'risk', 'watch'] },
          text: { type: 'string' },
        },
        required: ['type', 'text'],
      },
    },
  },
  required: ['sentiment', 'sentimentScore', 'summary', 'highlights'],
};

/** 뉴스 본문 길이 제한 — 토큰·비용 절감 */
function truncate(str, max) {
  if (!str) return '';
  return str.length <= max ? str : `${str.slice(0, max)}…`;
}

/** 클라이언트 뉴스 항목 정규화 */
function normalizeNewsItem(item, region) {
  if (!item || typeof item !== 'object') return null;
  const title = truncate(String(item.title || ''), 200);
  if (!title) return null;
  return {
    title,
    content: truncate(String(item.content || item.description || ''), 400),
    url: String(item.url || item.link || ''),
    region,
  };
}

/** Gemini에 전달할 뉴스 목록 텍스트 구성 */
function buildNewsDigest(globalNews, domesticNews) {
  const sections = [];

  if (globalNews.length > 0) {
    sections.push('## 국외 뉴스 (Tavily)');
    globalNews.forEach((n, i) => {
      sections.push(
        `${i + 1}. [${n.title}] ${n.content}${n.url ? ` (${n.url})` : ''}`
      );
    });
  }

  if (domesticNews.length > 0) {
    sections.push('## 국내 뉴스 (Naver)');
    domesticNews.forEach((n, i) => {
      sections.push(
        `${i + 1}. [${n.title}] ${n.content}${n.url ? ` (${n.url})` : ''}`
      );
    });
  }

  return sections.join('\n');
}

function buildPrompt(digest, globalQuery, domesticQuery) {
  return `당신은 방위산업·국방 분야 전문 애널리스트입니다.
아래 뉴스 검색 결과를 바탕으로 방산 업계 동향을 분석하고 한국어로 답변하세요.

국외 검색어: ${globalQuery || '없음'}
국내 검색어: ${domesticQuery || '없음'}

${digest}

분석 지침:
- sentiment: "긍정", "중립", "부정" 중 하나 (K-방산·국방 산업 관점)
- sentimentScore: 0~100 (높을수록 긍정적 전망)
- summary: 핵심 동향 2~3문장
- highlights: 3~4개 (type은 opportunity=기회, risk=리스크, watch=주목)`;
}

/**
 * @param {object} body - { globalNews?, domesticNews?, globalQuery?, domesticQuery? }
 * @param {() => string} getApiKey
 */
async function handleGeminiNewsAnalysis(body, getApiKey) {
  const globalRaw = Array.isArray(body?.globalNews) ? body.globalNews : [];
  const domesticRaw = Array.isArray(body?.domesticNews) ? body.domesticNews : [];

  const globalNews = globalRaw
    .slice(0, 6)
    .map((item) => normalizeNewsItem(item, 'global'))
    .filter(Boolean);
  const domesticNews = domesticRaw
    .slice(0, 6)
    .map((item) => normalizeNewsItem(item, 'domestic'))
    .filter(Boolean);

  if (globalNews.length === 0 && domesticNews.length === 0) {
    return {
      status: 400,
      data: { error: '분석할 뉴스가 없습니다. 먼저 뉴스를 검색하세요.' },
    };
  }

  try {
    const apiKey = getApiKey();
    const digest = buildNewsDigest(globalNews, domesticNews);
    const prompt = buildPrompt(
      digest,
      body?.globalQuery,
      body?.domesticQuery
    );

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          // Flash-Lite: thinking 비활성화로 응답 속도·비용 최적화
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg =
        data?.error?.message ||
        data?.error?.status ||
        'Gemini API 요청 실패';
      return { status: response.status, data: { error: errMsg } };
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return {
        status: 502,
        data: { error: 'Gemini 응답이 비어 있습니다.' },
      };
    }

    let analysis;
    try {
      analysis = JSON.parse(rawText);
    } catch {
      return {
        status: 502,
        data: { error: 'Gemini 응답 JSON 파싱에 실패했습니다.' },
      };
    }

    const highlights = (analysis.highlights || [])
      .filter((h) => h && h.type && h.text)
      .slice(0, 5);

    return {
      status: 200,
      data: {
        sentiment: analysis.sentiment || '중립',
        sentimentScore: Math.min(
          100,
          Math.max(0, Number(analysis.sentimentScore) || 50)
        ),
        summary: analysis.summary || '',
        highlights,
        model: GEMINI_MODEL,
        analyzedAt: new Date().toISOString(),
        newsCount: {
          global: globalNews.length,
          domestic: domesticNews.length,
        },
      },
    };
  } catch (err) {
    const message = err.message || 'Gemini 분석 실패';
    const status = message.includes('GEMINI') ? 503 : 500;
    return { status, data: { error: message } };
  }
}

module.exports = { handleGeminiNewsAnalysis, GEMINI_MODEL };

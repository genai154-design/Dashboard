/**
 * Exchange Rate API 연동 — USD 기준 환율을 KRW 페어로 변환
 * https://www.exchangerate-api.com/
 */
const TARGET_CURRENCIES = ['EUR', 'JPY', 'GBP'];

// 키ed API 실패 시 Open Access로 대체 가능한 오류
const FALLBACK_ERROR_TYPES = new Set([
  'inactive-account',
  'invalid-key',
  'quota-reached',
]);

const ERROR_MESSAGES = {
  'inactive-account':
    'ExchangeRate-API 계정이 비활성입니다. 가입 시 이메일 인증을 완료하거나, .env의 EXCHANGE_RATE_API_KEY를 제거해 Open Access를 사용하세요.',
  'invalid-key': 'Exchange Rate API 키가 올바르지 않습니다. .env의 EXCHANGE_RATE_API_KEY를 확인하세요.',
  'quota-reached': 'Exchange Rate API 월간 할당량을 초과했습니다. Open Access로 대체 조회합니다.',
};

/** API 키 유무에 따라 URL·인증 헤더 결정 */
function getLatestRequest(apiKey) {
  if (apiKey) {
    return {
      url: 'https://v6.exchangerate-api.com/v6/latest/USD',
      headers: { Authorization: `Bearer ${apiKey}` },
    };
  }
  return {
    url: 'https://open.er-api.com/v6/latest/USD',
    headers: {},
  };
}

function getHistoricalRequest(apiKey, year, month, day) {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return {
    url: `https://v6.exchangerate-api.com/v6/history/USD/${year}/${mm}/${dd}`,
    headers: { Authorization: `Bearer ${apiKey}` },
  };
}

function mapApiError(errorType) {
  return ERROR_MESSAGES[errorType] || errorType || 'Exchange Rate API 오류';
}

/** API 응답에서 rates 객체 추출 — HTTP 200이어도 result:error 인 경우 처리 */
function extractRates(data) {
  if (data.result === 'error' || (data.result && data.result !== 'success')) {
    const errorType = data['error-type'] || data.error || 'unknown';
    const err = new Error(mapApiError(errorType));
    err.errorType = errorType;
    throw err;
  }
  const rates = data.conversion_rates || data.rates;
  if (!rates) {
    throw new Error('환율 데이터 형식이 올바르지 않습니다.');
  }
  return rates;
}

/** USD 기준 rates → 원화 환율 페어 계산 */
function toKrwPairs(rates) {
  const krwPerUsd = rates.KRW;
  if (!krwPerUsd) throw new Error('KRW 환율 데이터를 찾을 수 없습니다.');

  const pairs = [{ pair: 'USD/KRW', value: krwPerUsd }];

  for (const code of TARGET_CURRENCIES) {
    const perUsd = rates[code];
    if (!perUsd) continue;
    pairs.push({ pair: `${code}/KRW`, value: krwPerUsd / perUsd });
  }

  return pairs;
}

function formatRate(pair, value) {
  if (pair === 'JPY/KRW') return value.toFixed(2);
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcChange(current, previous) {
  if (previous == null || Number.isNaN(previous)) {
    return { change: '—', direction: 'neutral' };
  }
  const diff = current - previous;
  const sign = diff >= 0 ? '+' : '';
  return {
    change: `${sign}${diff.toFixed(2)}`,
    direction: diff >= 0 ? 'up' : 'down',
  };
}

function getYesterdayUtc() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

async function fetchRatesFromApi(url, headers) {
  const response = await fetch(url, { headers });
  const data = await response.json().catch(() => ({}));

  // ExchangeRate-API는 오류도 200 + result:error 로 반환하는 경우가 있음
  if (!response.ok && data.result !== 'error') {
    const errorType = data['error-type'] || data.error;
    const err = new Error(mapApiError(errorType));
    err.errorType = errorType;
    throw err;
  }

  return extractRates(data);
}

/** 최신 환율 — 키 오류 시 Open Access 자동 대체 */
async function fetchLatestRates(apiKey) {
  if (!apiKey) {
    const open = getLatestRequest(null);
    const rates = await fetchRatesFromApi(open.url, open.headers);
    return { rates, usedFallback: false, keyed: false };
  }

  const keyed = getLatestRequest(apiKey);
  try {
    const rates = await fetchRatesFromApi(keyed.url, keyed.headers);
    return { rates, usedFallback: false, keyed: true };
  } catch (err) {
    if (!FALLBACK_ERROR_TYPES.has(err.errorType)) throw err;

    const open = getLatestRequest(null);
    const rates = await fetchRatesFromApi(open.url, open.headers);
    return { rates, usedFallback: true, keyed: false, fallbackReason: err.errorType };
  }
}

/**
 * @param {() => string|null} getApiKey
 * @returns {Promise<{ status: number, data: object }>}
 */
async function handleExchangeRates(getApiKey) {
  try {
    const apiKey = getApiKey()?.trim() || null;
    const { rates: latestRates, usedFallback, keyed, fallbackReason } = await fetchLatestRates(apiKey);

    let previousRates = null;
    // 전일 대비는 유효한 키로 keyed API 성공했을 때만
    if (keyed && apiKey) {
      const { year, month, day } = getYesterdayUtc();
      const hist = getHistoricalRequest(apiKey, year, month, day);
      try {
        previousRates = await fetchRatesFromApi(hist.url, hist.headers);
      } catch {
        previousRates = null;
      }
    }

    const currentPairs = toKrwPairs(latestRates);
    const previousPairs = previousRates ? toKrwPairs(previousRates) : [];
    const prevMap = Object.fromEntries(previousPairs.map((p) => [p.pair, p.value]));

    const rates = currentPairs.map((item) => {
      const { change, direction } = calcChange(item.value, prevMap[item.pair]);
      return {
        pair: item.pair,
        value: formatRate(item.pair, item.value),
        change,
        direction,
      };
    });

    let note = 'ExchangeRate-API Open Access · 일 1회 갱신';
    if (keyed) {
      note = 'ExchangeRate-API 실시간 · 전일 대비';
    } else if (usedFallback && fallbackReason === 'inactive-account') {
      note = 'Open Access (계정 비활성 — 이메일 인증 후 키 사용 가능)';
    } else if (usedFallback) {
      note = `Open Access (${fallbackReason} — 키 API 대체)`;
    }

    return {
      status: 200,
      data: {
        baseDate: new Date().toISOString().slice(0, 10),
        rates,
        note,
        source: 'ExchangeRate-API',
        fallback: usedFallback,
      },
    };
  } catch (err) {
    return { status: 500, data: { error: err.message || '환율 조회 실패' } };
  }
}

module.exports = { handleExchangeRates };

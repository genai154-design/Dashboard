/**
 * Exchange Rate API 연동 — USD 기준 환율을 KRW 페어로 변환
 * https://www.exchangerate-api.com/
 */
const TARGET_CURRENCIES = ['EUR', 'JPY', 'GBP'];

/** API 키 유무에 따라 URL·인증 헤더 결정 */
function getLatestRequest(apiKey) {
  if (apiKey) {
    return {
      url: 'https://v6.exchangerate-api.com/v6/latest/USD',
      headers: { Authorization: `Bearer ${apiKey}` },
    };
  }
  // 키 없을 때 open access (일일 갱신, 전일 대비 미제공)
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

/** API 응답에서 rates 객체 추출 (v6 / open access 필드명 통일) */
function extractRates(data) {
  if (data.result && data.result !== 'success') {
    throw new Error(data['error-type'] || data.error || 'Exchange Rate API 오류');
  }
  return data.conversion_rates || data.rates;
}

/** USD 기준 rates → 원화 환율 페어 계산 */
function toKrwPairs(rates) {
  const krwPerUsd = rates.KRW;
  if (!krwPerUsd) throw new Error('KRW 환율 데이터를 찾을 수 없습니다.');

  const pairs = [
    { pair: 'USD/KRW', value: krwPerUsd },
  ];

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

  if (!response.ok) {
    throw new Error(data['error-type'] || data.error || `Exchange Rate API (${response.status})`);
  }

  return extractRates(data);
}

/**
 * @param {() => string|null} getApiKey
 * @returns {Promise<{ status: number, data: object }>}
 */
async function handleExchangeRates(getApiKey) {
  try {
    const apiKey = getApiKey()?.trim() || null;
    const { url, headers } = getLatestRequest(apiKey);
    const latestRates = await fetchRatesFromApi(url, headers);

    let previousRates = null;
    if (apiKey) {
      const { year, month, day } = getYesterdayUtc();
      const hist = getHistoricalRequest(apiKey, year, month, day);
      try {
        previousRates = await fetchRatesFromApi(hist.url, hist.headers);
      } catch {
        // 전일 데이터 실패 시 등락만 생략
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

    const updatedUtc = new Date().toISOString().slice(0, 10);

    return {
      status: 200,
      data: {
        baseDate: updatedUtc,
        rates,
        note: apiKey
          ? 'ExchangeRate-API 실시간 · 전일 대비'
          : 'ExchangeRate-API Open Access · 일 1회 갱신',
        source: 'ExchangeRate-API',
      },
    };
  } catch (err) {
    const message = err.message || '환율 조회 실패';
    const status = message.includes('API_KEY') ? 503 : 500;
    return { status, data: { error: message } };
  }
}

module.exports = { handleExchangeRates };

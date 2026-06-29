/**
 * Exchange Rate API 클라이언트 — 서버 프록시 경유
 */
const EXCHANGE_PROXY = '/api/exchange/rates';

async function fetchExchangeRates() {
  const response = await fetch(EXCHANGE_PROXY);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `환율 요청 실패 (${response.status})`);
  }

  return data;
}

window.ExchangeAPI = { fetchRates: fetchExchangeRates };

/**
 * 전국 날씨 — Open-Meteo API 연동
 * API 키 불필요, 좌표 배치 요청으로 전국 도시 날씨를 한 번에 조회
 */

// 전국 주요 도시 좌표 — 기상청 전국 관측 지점과 유사하게 선정
const KOREA_CITIES = [
  { name: '서울', lat: 37.5665, lon: 126.9780 },
  { name: '부산', lat: 35.1796, lon: 129.0756 },
  { name: '대구', lat: 35.8714, lon: 128.6014 },
  { name: '인천', lat: 37.4563, lon: 126.7052 },
  { name: '광주', lat: 35.1595, lon: 126.8526 },
  { name: '대전', lat: 36.3504, lon: 127.3845 },
  { name: '울산', lat: 35.5384, lon: 129.3114 },
  { name: '세종', lat: 36.4800, lon: 127.2890 },
  { name: '제주', lat: 33.4996, lon: 126.5312 },
  { name: '강릉', lat: 37.7519, lon: 128.8761 },
  { name: '춘천', lat: 37.8813, lon: 127.7298 },
  { name: '전주', lat: 35.8242, lon: 127.1480 },
  { name: '목포', lat: 34.7936, lon: 126.3887 },
  { name: '포항', lat: 36.0320, lon: 129.3650 },
  { name: '수원', lat: 37.2636, lon: 127.0286 },
  { name: '청주', lat: 36.6424, lon: 127.4890 },
  { name: '안동', lat: 36.5684, lon: 128.7294 },
];

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

// 자동 갱신 간격(초) — 타이머·인터벌 모두 이 값을 사용
const AUTO_REFRESH_SEC = 30;

// Leaflet 지도 인스턴스 — 날씨 갱신 시 마커만 교체
let weatherMap = null;
let markerLayer = null;

// 자동 갱신 타이머 상태
let countdownSec = AUTO_REFRESH_SEC;
let countdownInterval = null;
let fetchInProgress = false;
const WEATHER_CODES = {
  0: { label: '맑음', icon: '☀️', class: 'clear' },
  1: { label: '대체로 맑음', icon: '🌤️', class: 'clear' },
  2: { label: '약간 흐림', icon: '⛅', class: 'cloudy' },
  3: { label: '흐림', icon: '☁️', class: 'cloudy' },
  45: { label: '안개', icon: '🌫️', class: 'fog' },
  48: { label: '짙은 안개', icon: '🌫️', class: 'fog' },
  51: { label: '가벼운 이슬비', icon: '🌦️', class: 'rain' },
  53: { label: '이슬비', icon: '🌦️', class: 'rain' },
  55: { label: '강한 이슬비', icon: '🌦️', class: 'rain' },
  56: { label: '가벼운 진눈깨비', icon: '🌨️', class: 'snow' },
  57: { label: '진눈깨비', icon: '🌨️', class: 'snow' },
  61: { label: '약한 비', icon: '🌧️', class: 'rain' },
  63: { label: '비', icon: '🌧️', class: 'rain' },
  65: { label: '강한 비', icon: '🌧️', class: 'rain' },
  66: { label: '약한 진눈깨비', icon: '🌨️', class: 'snow' },
  67: { label: '진눈깨비', icon: '🌨️', class: 'snow' },
  71: { label: '약한 눈', icon: '🌨️', class: 'snow' },
  73: { label: '눈', icon: '🌨️', class: 'snow' },
  75: { label: '강한 눈', icon: '🌨️', class: 'snow' },
  77: { label: '싸락눈', icon: '🌨️', class: 'snow' },
  80: { label: '약한 소나기', icon: '🌦️', class: 'rain' },
  81: { label: '소나기', icon: '🌦️', class: 'rain' },
  82: { label: '강한 소나기', icon: '🌧️', class: 'rain' },
  85: { label: '약한 눈 소나기', icon: '🌨️', class: 'snow' },
  86: { label: '강한 눈 소나기', icon: '🌨️', class: 'snow' },
  95: { label: '뇌우', icon: '⛈️', class: 'storm' },
  96: { label: '뇌우·우박', icon: '⛈️', class: 'storm' },
  99: { label: '강한 뇌우', icon: '⛈️', class: 'storm' },
};

/** DOM 요소 참조 */
const els = {
  statusPanel: document.getElementById('status-panel'),
  loading: document.getElementById('loading'),
  error: document.getElementById('error'),
  errorMessage: document.getElementById('error-message'),
  summarySection: document.getElementById('summary-section'),
  mapSection: document.getElementById('map-section'),
  weatherSection: document.getElementById('weather-section'),
  weatherGrid: document.getElementById('weather-grid'),
  updateTime: document.getElementById('update-time'),
  avgTemp: document.getElementById('avg-temp'),
  maxTemp: document.getElementById('max-temp'),
  maxCity: document.getElementById('max-city'),
  minTemp: document.getElementById('min-temp'),
  minCity: document.getElementById('min-city'),
  cityCount: document.getElementById('city-count'),
  btnRefresh: document.getElementById('btn-refresh'),
  btnRetry: document.getElementById('btn-retry'),
  autoRefreshBar: document.getElementById('auto-refresh-bar'),
  refreshTimer: document.getElementById('refresh-timer'),
  refreshProgress: document.getElementById('refresh-progress'),
};

/** 날씨 코드를 한국어·아이콘으로 변환 */
function getWeatherInfo(code) {
  return WEATHER_CODES[code] || { label: '알 수 없음', icon: '❓', class: 'cloudy' };
}

/** 온도 포맷 (정수, °) */
function formatTemp(value) {
  return `${Math.round(value)}°`;
}

/** Open-Meteo API URL 생성 — 다중 좌표를 쉼표로 연결하여 한 번에 요청 */
function buildApiUrl() {
  const latitudes = KOREA_CITIES.map((c) => c.lat).join(',');
  const longitudes = KOREA_CITIES.map((c) => c.lon).join(',');

  const params = new URLSearchParams({
    latitude: latitudes,
    longitude: longitudes,
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
    ].join(','),
    timezone: 'Asia/Seoul',
    wind_speed_unit: 'kmh',
  });

  return `${OPEN_METEO_BASE}?${params}`;
}

/** 로딩·오류·콘텐츠 표시 상태 전환 */
function setViewState(state) {
  els.statusPanel.hidden = state === 'content';
  els.loading.hidden = state !== 'loading';
  els.error.hidden = state !== 'error';
  els.summarySection.hidden = state !== 'content';
  els.mapSection.hidden = state !== 'content';
  els.weatherSection.hidden = state !== 'content';
}

/** Leaflet 지도 초기화 — 다크 테마 타일로 페이지 UI와 통일 */
function initMap() {
  if (weatherMap) return;

  weatherMap = L.map('weather-map', {
    center: [36.4, 127.8],
    zoom: 7,
    minZoom: 6,
    maxZoom: 12,
    scrollWheelZoom: true,
  });

  // Carto 다크 타일 — API 키 없이 OpenStreetMap 데이터 활용
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(weatherMap);

  markerLayer = L.layerGroup().addTo(weatherMap);
}

/** 지도 마커용 커스텀 아이콘 — 이모지 + 기온 표시 */
function createMarkerIcon(weather) {
  const info = getWeatherInfo(weather.weatherCode);
  const temp = Math.round(weather.temperature);

  return L.divIcon({
    className: 'weather-marker-icon',
    html: `
      <div class="weather-marker weather-marker--${info.class}">
        <span class="weather-marker__emoji">${info.icon}</span>
        <span class="weather-marker__temp">${temp}°</span>
      </div>
    `,
    iconSize: [64, 64],
    iconAnchor: [32, 32],
    popupAnchor: [0, -36],
  });
}

/** 팝업 HTML — 클릭 시 상세 날씨 정보 */
function buildPopupContent(weather) {
  const info = getWeatherInfo(weather.weatherCode);
  const windRounded = Math.round(weather.windSpeed);

  return `
    <div class="map-popup">
      <h3 class="map-popup__city">${weather.city}</h3>
      <div class="map-popup__hero">
        <span class="map-popup__emoji">${info.icon}</span>
        <span class="map-popup__temp">${Math.round(weather.temperature)}<small>°C</small></span>
      </div>
      <p class="map-popup__condition">${info.label}</p>
      <p class="map-popup__wind">💨 풍속 ${windRounded} km/h</p>
    </div>
  `;
}

/** 날씨 데이터로 지도 마커 갱신 */
function updateMapMarkers(weatherList, options = {}) {
  const { fitBounds = true } = options;
  if (!weatherMap || !markerLayer) return;

  markerLayer.clearLayers();

  const bounds = [];

  weatherList.forEach((w) => {
    if (!w.lat || !w.lon) return;

    const marker = L.marker([w.lat, w.lon], { icon: createMarkerIcon(w) });
    marker.bindPopup(buildPopupContent(w), {
      className: 'weather-popup',
      maxWidth: 220,
      closeButton: false,
    });
    markerLayer.addLayer(marker);
    bounds.push([w.lat, w.lon]);
  });

  // 전국 도시가 한 화면에 들어오도록 범위 자동 조정 (자동 갱신 시에는 줌 유지)
  if (bounds.length > 0 && fitBounds) {
    weatherMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
  }
}

/** 전국 요약 통계 렌더링 */
function renderSummary(weatherList) {
  const temps = weatherList.map((w) => w.temperature);
  const avg = temps.reduce((a, b) => a + b, 0) / temps.length;

  const maxItem = weatherList.reduce((a, b) => (a.temperature > b.temperature ? a : b));
  const minItem = weatherList.reduce((a, b) => (a.temperature < b.temperature ? a : b));

  els.avgTemp.textContent = formatTemp(avg);
  els.maxTemp.textContent = formatTemp(maxItem.temperature);
  els.maxCity.textContent = maxItem.city;
  els.minTemp.textContent = formatTemp(minItem.temperature);
  els.minCity.textContent = minItem.city;
  els.cityCount.textContent = `${weatherList.length}개 도시`;
}

/** 지역별 날씨 카드 렌더링 — 기온·날씨·풍속·이모지를 한눈에 */
function renderWeatherCards(weatherList) {
  const sorted = [...weatherList].sort((a, b) => b.temperature - a.temperature);

  els.weatherGrid.innerHTML = sorted.map((w) => {
    const info = getWeatherInfo(w.weatherCode);
    const windRounded = Math.round(w.windSpeed);

    return `
      <article class="city-card city-card--${info.class}" aria-label="${w.city} 날씨">
        <header class="city-card__header">
          <h3 class="city-card__name">${w.city}</h3>
        </header>

        <div class="city-card__hero">
          <div class="city-card__emoji-wrap" aria-hidden="true">
            <span class="city-card__emoji">${info.icon}</span>
          </div>
          <div class="city-card__temp-block">
            <span class="city-card__temp">${Math.round(w.temperature)}</span>
            <span class="city-card__unit">°C</span>
          </div>
        </div>

        <div class="city-card__condition">
          <span class="city-card__condition-badge">${info.label}</span>
        </div>

        <footer class="city-card__footer">
          <div class="city-card__stat">
            <span class="city-card__stat-emoji" aria-hidden="true">💨</span>
            <div class="city-card__stat-text">
              <span class="city-card__stat-label">풍속</span>
              <span class="city-card__stat-value">${windRounded} <small>km/h</small></span>
            </div>
          </div>
        </footer>
      </article>
    `;
  }).join('');
}

/** API 응답을 도시별 날씨 객체로 변환 */
function parseApiResponse(data) {
  // 다중 좌표 요청 시 배열로 반환됨
  const locations = Array.isArray(data) ? data : [data];

  return locations.map((loc, index) => {
    const current = loc.current;
    const city = KOREA_CITIES[index]?.name || `지역 ${index + 1}`;

    // ISO 시각을 한국 시간 HH:mm 형식으로 표시
    const observedAt = new Date(current.time).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return {
      city,
      lat: KOREA_CITIES[index]?.lat,
      lon: KOREA_CITIES[index]?.lon,
      temperature: current.temperature_2m,
      apparentTemp: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      weatherCode: current.weather_code,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m,
      observedAt,
    };
  });
}

/** Open-Meteo API 호출 및 UI 갱신 */
async function fetchWeather(options = {}) {
  const { silent = false } = options;

  if (fetchInProgress) return;
  fetchInProgress = true;

  if (!silent) {
    setViewState('loading');
    els.btnRefresh.classList.add('spinning');
    els.btnRefresh.disabled = true;
  } else {
    els.autoRefreshBar?.classList.add('is-refreshing');
  }

  try {
    const response = await fetch(buildApiUrl());

    if (!response.ok) {
      throw new Error(`API 오류 (${response.status})`);
    }

    const data = await response.json();
    const weatherList = parseApiResponse(data);

    if (!weatherMap) initMap();

    renderSummary(weatherList);
    updateMapMarkers(weatherList, { fitBounds: !silent });
    renderWeatherCards(weatherList);
    setViewState('content');

    // hidden 해제 후 Leaflet이 지도 영역 크기를 다시 계산해야 함
    requestAnimationFrame(() => {
      if (weatherMap) weatherMap.invalidateSize();
    });

    // 관측 시각 표시 — 사용자가 데이터 신선도를 확인할 수 있게
    els.updateTime.textContent = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    resetCountdown();
  } catch (err) {
    els.errorMessage.textContent = `날씨 정보를 가져오지 못했습니다. ${err.message}`;
    if (!silent) setViewState('error');
    resetCountdown();
  } finally {
    fetchInProgress = false;
    els.autoRefreshBar?.classList.remove('is-refreshing');
    if (!silent) {
      els.btnRefresh.classList.remove('spinning');
      els.btnRefresh.disabled = false;
    }
  }
}

/** 타이머 UI 갱신 — 숫자·진행 바 동기화 */
function updateCountdownDisplay() {
  if (els.refreshTimer) {
    els.refreshTimer.textContent = String(countdownSec);
  }
  if (els.refreshProgress) {
    const percent = (countdownSec / AUTO_REFRESH_SEC) * 100;
    els.refreshProgress.style.width = `${percent}%`;
  }
}

/** 갱신 완료 후 카운트다운을 30초로 리셋 */
function resetCountdown() {
  countdownSec = AUTO_REFRESH_SEC;
  updateCountdownDisplay();
}

/** 1초마다 카운트다운 — 0초 도달 시 자동 갱신(백그라운드) */
function startAutoRefreshTimer() {
  if (countdownInterval) clearInterval(countdownInterval);

  countdownSec = AUTO_REFRESH_SEC;
  updateCountdownDisplay();

  countdownInterval = setInterval(() => {
    countdownSec -= 1;

    if (countdownSec <= 0) {
      fetchWeather({ silent: true });
      return;
    }

    updateCountdownDisplay();
  }, 1000);
}

/** 초기화 — 새로고침·재시도·자동 갱신 타이머 연결 */
function init() {
  els.btnRefresh.addEventListener('click', () => fetchWeather());
  els.btnRetry.addEventListener('click', () => fetchWeather());
  startAutoRefreshTimer();
  fetchWeather();
}

document.addEventListener('DOMContentLoaded', init);

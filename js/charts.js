/**
 * Chart.js 차트 생성 및 테마 설정
 */
const CHART_COLORS = {
  primary: '#3d9a6e',
  primaryLight: '#4ec98a',
  secondary: '#4a9eff',
  amber: '#e8a838',
  danger: '#e05252',
  purple: '#a882ff',
  grid: '#243044',
  text: '#8b9cb3',
};

const chartInstances = {};

/** 차트 공통 기본 옵션 */
function baseChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: CHART_COLORS.text,
          font: { family: 'Inter', size: 11 },
          boxWidth: 12,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#151c26',
        borderColor: '#243044',
        borderWidth: 1,
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'JetBrains Mono', size: 12 },
        padding: 10,
      },
    },
  };
}

/** 글로벌 국방비 추이 — 라인 차트 */
function createSpendingTrendChart() {
  const ctx = document.getElementById('chart-spending-trend');
  if (!ctx) return;

  chartInstances.spendingTrend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: DEFENSE_DATA.spendingTrend.labels,
      datasets: [{
        label: '국방비 (조 USD)',
        data: DEFENSE_DATA.spendingTrend.values,
        borderColor: CHART_COLORS.primary,
        backgroundColor: 'rgba(61, 154, 110, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: CHART_COLORS.primaryLight,
        pointBorderColor: CHART_COLORS.primary,
        pointRadius: 4,
        pointHoverRadius: 6,
      }],
    },
    options: {
      ...baseChartOptions(),
      scales: {
        x: {
          grid: { color: CHART_COLORS.grid, drawBorder: false },
          ticks: { color: CHART_COLORS.text, font: { size: 11 } },
        },
        y: {
          grid: { color: CHART_COLORS.grid, drawBorder: false },
          ticks: {
            color: CHART_COLORS.text,
            font: { family: 'JetBrains Mono', size: 11 },
            callback: (v) => `$${v}T`,
          },
        },
      },
      plugins: {
        ...baseChartOptions().plugins,
        legend: { display: false },
      },
    },
  });
}

/** 주요국 국방비 비교 — 가로 바 차트 */
function createCountryCompareChart() {
  const ctx = document.getElementById('chart-country-compare');
  if (!ctx) return;

  const colors = DEFENSE_DATA.countryCompare.values.map((_, i) => {
    const palette = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.amber, CHART_COLORS.danger, CHART_COLORS.purple, '#6ec9a0', '#7eb8ff', '#f0c060'];
    return palette[i % palette.length];
  });

  chartInstances.countryCompare = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: DEFENSE_DATA.countryCompare.labels,
      datasets: [{
        label: '국방비 (십억 USD)',
        data: DEFENSE_DATA.countryCompare.values,
        backgroundColor: colors,
        borderRadius: 4,
        borderSkipped: false,
      }],
    },
    options: {
      ...baseChartOptions(),
      indexAxis: 'y',
      scales: {
        x: {
          grid: { color: CHART_COLORS.grid, drawBorder: false },
          ticks: {
            color: CHART_COLORS.text,
            font: { family: 'JetBrains Mono', size: 11 },
            callback: (v) => `$${v}B`,
          },
        },
        y: {
          grid: { display: false },
          ticks: { color: CHART_COLORS.text, font: { size: 11 } },
        },
      },
      plugins: {
        ...baseChartOptions().plugins,
        legend: { display: false },
      },
    },
  });
}

/** 예산 분야별 구성 — 도넛 차트 */
function createBudgetBreakdownChart() {
  const ctx = document.getElementById('chart-budget-breakdown');
  if (!ctx) return;

  chartInstances.budgetBreakdown = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: DEFENSE_DATA.budgetBreakdown.labels,
      datasets: [{
        data: DEFENSE_DATA.budgetBreakdown.values,
        backgroundColor: [
          CHART_COLORS.primary,
          CHART_COLORS.secondary,
          CHART_COLORS.amber,
          CHART_COLORS.purple,
          CHART_COLORS.text,
        ],
        borderColor: '#151c26',
        borderWidth: 2,
      }],
    },
    options: {
      ...baseChartOptions(),
      cutout: '65%',
      plugins: {
        ...baseChartOptions().plugins,
        legend: {
          position: 'right',
          labels: {
            color: CHART_COLORS.text,
            font: { size: 10 },
            boxWidth: 10,
            padding: 8,
          },
        },
      },
    },
  });
}

/** 연간 성장률 — 바 차트 */
function createGrowthRateChart() {
  const ctx = document.getElementById('chart-growth-rate');
  if (!ctx) return;

  chartInstances.growthRate = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: DEFENSE_DATA.growthRate.labels,
      datasets: [{
        label: '성장률 (%)',
        data: DEFENSE_DATA.growthRate.values,
        backgroundColor: DEFENSE_DATA.growthRate.values.map((v) =>
          v >= 6 ? CHART_COLORS.primary : CHART_COLORS.secondary
        ),
        borderRadius: 4,
      }],
    },
    options: {
      ...baseChartOptions(),
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: CHART_COLORS.text, font: { size: 10 } },
        },
        y: {
          grid: { color: CHART_COLORS.grid, drawBorder: false },
          ticks: {
            color: CHART_COLORS.text,
            font: { family: 'JetBrains Mono', size: 10 },
            callback: (v) => `${v}%`,
          },
        },
      },
      plugins: {
        ...baseChartOptions().plugins,
        legend: { display: false },
      },
    },
  });
}

/** 수출 상위 품목 — 폴라 영역 차트 */
function createExportItemsChart() {
  const ctx = document.getElementById('chart-export-items');
  if (!ctx) return;

  chartInstances.exportItems = new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels: DEFENSE_DATA.exportItems.labels,
      datasets: [{
        data: DEFENSE_DATA.exportItems.values,
        backgroundColor: [
          'rgba(61, 154, 110, 0.7)',
          'rgba(74, 158, 255, 0.7)',
          'rgba(232, 168, 56, 0.7)',
          'rgba(224, 82, 82, 0.7)',
          'rgba(168, 130, 255, 0.7)',
          'rgba(139, 156, 179, 0.5)',
        ],
        borderColor: '#151c26',
        borderWidth: 1,
      }],
    },
    options: {
      ...baseChartOptions(),
      scales: {
        r: {
          grid: { color: CHART_COLORS.grid },
          ticks: { display: false },
        },
      },
      plugins: {
        ...baseChartOptions().plugins,
        legend: {
          position: 'right',
          labels: {
            color: CHART_COLORS.text,
            font: { size: 10 },
            boxWidth: 10,
            padding: 6,
          },
        },
      },
    },
  });
}

/** 모든 차트 초기화 */
function initCharts() {
  createSpendingTrendChart();
  createCountryCompareChart();
  createBudgetBreakdownChart();
  createGrowthRateChart();
  createExportItemsChart();
}

/** 차트 리사이즈 — 새로고침 시 레이아웃 재조정 */
function resizeCharts() {
  Object.values(chartInstances).forEach((chart) => chart.resize());
}

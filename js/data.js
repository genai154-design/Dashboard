/**
 * 방산 동향 대시보드 — 참고용 샘플 데이터
 * 실제 운영 시 API 또는 공개 통계(SIPRI 등)로 교체
 */
const DEFENSE_DATA = {
  kpi: {
    2026: [
      { label: '글로벌 국방비', value: '$2.72T', change: '+5.8%', direction: 'positive', icon: 'budget' },
      { label: '방산 수출액', value: '$128B', change: '+12.3%', direction: 'positive', icon: 'export' },
      { label: '활성 분쟁 지역', value: '47', change: '+3', direction: 'negative', icon: 'conflict' },
      { label: 'R&D 투자', value: '$98.4B', change: '+8.1%', direction: 'positive', icon: 'rd' },
    ],
    2025: [
      { label: '글로벌 국방비', value: '$2.57T', change: '+6.2%', direction: 'positive', icon: 'budget' },
      { label: '방산 수출액', value: '$114B', change: '+9.7%', direction: 'positive', icon: 'export' },
      { label: '활성 분쟁 지역', value: '44', change: '+2', direction: 'negative', icon: 'conflict' },
      { label: 'R&D 투자', value: '$91.0B', change: '+7.4%', direction: 'positive', icon: 'rd' },
    ],
    2024: [
      { label: '글로벌 국방비', value: '$2.44T', change: '+5.4%', direction: 'positive', icon: 'budget' },
      { label: '방산 수출액', value: '$104B', change: '+8.2%', direction: 'positive', icon: 'export' },
      { label: '활성 분쟁 지역', value: '42', change: '+1', direction: 'negative', icon: 'conflict' },
      { label: 'R&D 투자', value: '$84.8B', change: '+6.9%', direction: 'positive', icon: 'rd' },
    ],
  },

  spendingTrend: {
    labels: ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'],
    values: [1.92, 1.98, 2.05, 2.18, 2.31, 2.44, 2.57, 2.72],
  },

  countryCompare: {
    labels: ['미국', '중국', '러시아', '인도', '영국', '한국', '일본', '프랑스'],
    values: [997, 296, 109, 81, 69, 48, 54, 56],
  },

  budgetBreakdown: {
    labels: ['인력·운영', '장비·무기', 'R&D', '인프라', '기타'],
    values: [38, 28, 18, 12, 7],
  },

  growthRate: {
    labels: ['2020', '2021', '2022', '2023', '2024', '2025', '2026'],
    values: [3.1, 3.5, 6.3, 6.0, 5.4, 6.2, 5.8],
  },

  exportItems: {
    labels: ['항공기', '함정', '미사일', '전차·차량', '전자·센서', '기타'],
    values: [32, 22, 18, 14, 12, 10],
  },

  regions: [
    {
      name: '북미',
      budget: '$1.05T',
      trend: 'YoY +4.2%',
      status: 'medium',
      statusLabel: '안정 증가',
      tags: ['NATO 협력', '우주·사이버', 'AI 방산'],
    },
    {
      name: '유럽',
      budget: '$412B',
      trend: 'YoY +9.8%',
      status: 'high',
      statusLabel: '급증',
      tags: ['러시아 대응', '방산 재편', '동유럽 투자'],
    },
    {
      name: '동아시아',
      budget: '$385B',
      trend: 'YoY +7.1%',
      status: 'high',
      statusLabel: '급증',
      tags: ['한·미·일 협력', '대만 해협', '무인체계'],
    },
    {
      name: '중동',
      budget: '$198B',
      trend: 'YoY +3.5%',
      status: 'medium',
      statusLabel: '안정 증가',
      tags: ['프리미엄 수출', '드론·미사일', '지역 분쟁'],
    },
    {
      name: '남아시아',
      budget: '$112B',
      trend: 'YoY +11.2%',
      status: 'high',
      statusLabel: '급증',
      tags: ['인도 국산화', '해양 강화', '인프라'],
    },
    {
      name: '한국',
      budget: '$48B',
      trend: 'YoY +4.8%',
      status: 'medium',
      statusLabel: '안정 증가',
      tags: ['K-방산 수출', '3대 전략', '우주·사이버'],
    },
  ],

  technologies: [
    {
      rank: '#01',
      name: 'AI·자율 무기체계',
      desc: '실시간 전장 인식, 자율 타겟팅, 군사 AI 거버넌스 논쟁 확대',
      adoption: 78,
      investment: 92,
    },
    {
      rank: '#02',
      name: '무인체계 (UAV/UGV)',
      desc: '소형·군집 드론, 해상·지상 무인체계 대량 배치 가속',
      adoption: 85,
      investment: 88,
    },
    {
      rank: '#03',
      name: '사이버·전자전',
      desc: '위성·통신 보호, 전자공격·방어, 군사 네트워크 하드닝',
      adoption: 72,
      investment: 80,
    },
    {
      rank: '#04',
      name: '우주·위성 방산',
      desc: '군사 위성, 반위성 무기, 우주 감시·통신 인프라 확충',
      adoption: 65,
      investment: 86,
    },
    {
      rank: '#05',
      name: '하이퍼스피어·미사일',
      desc: '초음속 미사일, 대함·대지 정밀 타격 체계 경쟁 심화',
      adoption: 58,
      investment: 75,
    },
    {
      rank: '#06',
      name: '첨단 센서·네트워크',
      desc: '멀티도메인 작전(MDO), 센서 융합, 전장 데이터 실시간 연동',
      adoption: 70,
      investment: 72,
    },
  ],

  // Tavily 국외 뉴스 검색 설정
  tavilyNews: {
    defaultQuery: 'global defense industry news 2026',
    quickTopics: [
      { label: 'NATO', query: 'NATO defense spending budget 2026' },
      { label: 'Ukraine', query: 'Ukraine defense weapons military aid' },
      { label: 'Drones', query: 'military drones UAV defense systems' },
      { label: 'M&A', query: 'defense industry merger acquisition' },
    ],
  },

  // Naver 국내 뉴스 검색 설정
  naverNews: {
    defaultQuery: '방산 K방산 국방',
    quickTopics: [
      { label: 'K-방산', query: 'K방산 수출' },
      { label: '방위사업', query: '방위사업청' },
      { label: 'KF-21', query: 'KF-21' },
      { label: 'LIG', query: 'LIG넥스원' },
    ],
  },

  // 인사이트 카드용 요약 데이터 (뉴스는 Tavily·Naver 실시간 검색으로 대체)
  insightCards: {
    news: {
      todayCount: 0,
      items: [],
    },
    bidding: {
      activeCount: 8,
      totalAmount: '₩2.4조',
      items: [
        { title: '차세대 무인 수상정 개발', agency: '방위사업청', deadline: 'D-5', amount: '₩890억' },
        { title: 'KF-21 전자전 장비 조달', agency: '공군', deadline: 'D-12', amount: '₩1,240억' },
        { title: '지휘통신망 고도화 사업', agency: '합참', deadline: 'D-18', amount: '₩520억' },
      ],
    },
    aiAnalysis: {
      sentiment: '긍정',
      sentimentScore: 72,
      summary: '유럽·중동 방산 수요 확대와 K-방산 수출 모멘텀이 지속됩니다. 다만 환율 변동성과 원자재 가격 상승이 수익성에 부담 요인으로 작용할 수 있습니다.',
      highlights: [
        { type: 'opportunity', text: 'NATO 국방비 확대 → K-방산 수출 기회 증가' },
        { type: 'risk', text: '원/달러 환율 상승 → 해외 계약 원화 환산 이익 개선' },
        { type: 'watch', text: '무인체계·AI 분야 입찰 집중 — 경쟁 심화 주의' },
      ],
      updatedAt: '10분 전',
    },
  },

  news: [
    {
      date: '2026-06-28',
      category: 'budget',
      categoryLabel: '예산',
      title: 'NATO 회원국, 2030년 GDP 3.5% 국방비 목표 합의',
      summary: '동유럽 전방 배치 확대와 방산 산업 투자를 동시에 추진하는 방침이 확정되었습니다.',
      source: 'NATO · Reuters',
    },
    {
      date: '2026-06-25',
      category: 'tech',
      categoryLabel: '기술',
      title: '한국, 차세대 무인 수상정 개발 계약 체결',
      summary: 'AI 기반 자율 운항 및 군집 작전 기능을 탑재한 수상 무인체계 개발이 본격화됩니다.',
      source: '방위사업청',
    },
    {
      date: '2026-06-22',
      category: 'export',
      categoryLabel: '수출',
      title: 'K-9 자주포, 중동 추가 수출 계약 임박',
      summary: '지역 안보 불안으로 자주포·방공 시스템 수요가 급증하는 가운데 한국 방산 수출이 확대됩니다.',
      source: 'Defense News',
    },
    {
      date: '2026-06-18',
      category: 'policy',
      categoryLabel: '정책',
      title: 'EU, 방산 통합 펀드 2차 라운드 150억 유로 배정',
      summary: '유럽 방산 공동 조달 및 생산 능력 확대를 위한 대규모 투자가 가속화됩니다.',
      source: 'European Commission',
    },
    {
      date: '2026-06-14',
      category: 'alliance',
      categoryLabel: '동맹',
      title: '한·미·일, 실시간 미사일 경보 데이터 공유 체계 가동',
      summary: '북한 미사일 위협 대응을 위한 삼국 연합 정보 공유가 운영 단계로 전환되었습니다.',
      source: 'Yonhap · AP',
    },
    {
      date: '2026-06-10',
      category: 'tech',
      categoryLabel: '기술',
      title: '미 국방부, 군사 AI 사용 원칙 개정안 발표',
      summary: '자율 무기체계의 인간 감독 원칙을 강화하고 민간 AI 기업과의 협력 프레임을 명확히 했습니다.',
      source: 'U.S. DoD',
    },
  ],
};

// KPI 아이콘 SVG 경로 매핑
const KPI_ICONS = {
  budget: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  export: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>',
  conflict: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  rd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>',
};

const KPI_ICON_CLASS = {
  budget: 'kpi-icon--green',
  export: 'kpi-icon--blue',
  conflict: 'kpi-icon--red',
  rd: 'kpi-icon--amber',
};

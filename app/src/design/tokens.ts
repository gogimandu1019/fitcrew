// FitCrew 디자인 토큰 — 이 파일이 원본이다. (design/ 폴더의 문서·HTML 목업은 이 값을 설명한다)
// 디자인 컨셉 제안(2026-10) 시안에서 추출한 값 + 새로 정한 항목.
// 다크 단일 테마. 값 출처가 "시안"이면 시안 그대로, "신규"면 이번에 추가한 값.

export const color = {
  // 바탕 (시안)
  night: '#0E0F0E', // 화면 배경
  card: '#181A18', // 카드
  cardBorder: '#2B2E2B',
  off: '#2A2D2A', // 꺼진 아바타, 진행 막대 트랙
  field: '#222522', // 비활성 버튼, 칩 배경
  line: '#3A3E3A',
  tabBar: '#141614', // 하단 탭 바 배경 (시안)

  // 강조 — "했다"의 신호에만 사용 (시안)
  lime: '#C8F031',
  limeTint: '#1E2A12', // 라임 강조 배경(1위 뱃지 등). 종목 칩에는 쓰지 않음

  // 글자 (시안)
  text: '#F2F4EF',
  textSub: '#C9CEC4',
  textMuted: '#9AA096',
  textDisabled: '#8A9086',
  textDim: '#6C726A', // 대비 3.9:1 — 큰 숫자·장식에만 사용
  avatarOffText: '#8A9086', // 꺼진 아바타 글자 (시안의 #6C726A에서 상향, 대비 4.3:1)

  // 소셜 로그인 (시안)
  kakao: '#FEE500',
  kakaoText: '#191919',

  // 신규: 오류·경고 (종목 코랄과 겹치지 않게 아이콘과 함께 사용)
  danger: '#FF5C5C',
} as const;

// 종목 색 팔레트 — 사용자가 종목마다 고른다. 8색.
// 라임은 "했다" 신호 전용이라 제외. 하늘·코랄·보라·앰버는 시안 값, 나머지 4색은 신규.
// 화이트는 본문 글자색(#F2F4EF)과 구분하려고 순백을 쓴다.
// 칩 배경은 색 + 14% 투명도: `${hex}24`.
export const sportPalette = [
  { key: 'sky', hex: '#5CC8FF', label: '하늘' },
  { key: 'coral', hex: '#FF7A66', label: '코랄' },
  { key: 'violet', hex: '#B79CFF', label: '보라' },
  { key: 'amber', hex: '#FFC24D', label: '앰버' },
  { key: 'mint', hex: '#6FC9A0', label: '민트' },
  { key: 'pink', hex: '#FF8FC7', label: '핑크' },
  { key: 'orange', hex: '#FF9E4A', label: '오렌지' },
  { key: 'white', hex: '#FFFFFF', label: '화이트' },
] as const;

// 기본 추천 종목과 기본 색 (사용자가 바꿀 수 있음)
export const defaultSports = [
  { name: '러닝', color: 'mint' },
  { name: '수영', color: 'sky' },
  { name: '헬스', color: 'coral' },
  { name: '요가', color: 'violet' },
  { name: '사이클', color: 'amber' },
] as const;

// 멤버 아바타 배경 — 가입 순서(또는 id 해시)로 고정 배정. 라임은 "완료 링" 전용이라 제외.
export const avatarPalette = [
  '#E0705F',
  '#5CA8E0',
  '#B79CFF',
  '#E8B84A',
  '#6FC9A0',
  '#E58FB8',
  '#E89452',
  '#7FD0D0',
] as const;

export const font = {
  // 숫자 전용: 시간(2:25), 순위, 인원, 그룹 코드. @expo-google-fonts/barlow-condensed
  numeric: {
    600: 'BarlowCondensed_600SemiBold',
    700: 'BarlowCondensed_700Bold',
    800: 'BarlowCondensed_800ExtraBold',
  },
  // 한글·본문: 시스템 폰트(fontFamily를 지정하지 않음). 굵기는 400/500/700/800만 사용.
  bodyWeights: [400, 500, 700, 800],
} as const;

export const type = {
  // [size, weight] — 시안 기준
  numHero: { size: 104, weight: 800, family: 'numeric', lineHeight: 1 }, // 디자인 시스템 페이지 예시용
  numCard: { size: 76, weight: 800, family: 'numeric', lineHeight: 0.95 }, // 주간 카드 2:25
  numRank: { size: 28, weight: 700, family: 'numeric' }, // 코드 입력칸, 순위
  numInline: { size: 22, weight: 700, family: 'numeric' }, // 5 / 8
  numSmall: { size: 17, weight: 700, family: 'numeric' }, // 날짜별 합계
  title: { size: 24, weight: 800 },
  headline: { size: 22, weight: 800 }, // 크루 이름
  item: { size: 17, weight: 700 },
  itemSm: { size: 15, weight: 700 },
  body: { size: 15, weight: 400 },
  caption: { size: 13, weight: 400 },
  micro: { size: 12, weight: 400 },
} as const;

export const radius = {
  cell: 12, // 코드 입력칸
  button: 16, // CTA, 작은 카드
  card: 20, // 피드 카드, 시트
  hero: 28, // 주간 운동 카드
  pill: 999, // 칩, 코드 뱃지
} as const;

// 4pt 기반. 시안에서 쓰인 값(2,3,6,10,12,14)은 컴포넌트 내부 미세 조정용.
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, huge: 40 } as const;

export const layout = {
  screenPadX: 20,
  ctaHeight: 56,
  inputHeight: 54,
  avatar: { sm: 38, md: 40, lg: 48 },
  ring: { width: 2, gap: 2 }, // 완료 링: 배경색 2px 간격 + 라임 2px (lg는 3/5)
  // 하단 탭: 홈 · 랭킹 · 내 정보 (3개). 시안은 4탭(기록 포함)이었으나 변경.
  tabBarHeight: 84, // 아래 12px는 홈 인디케이터 여백
  // 기록 버튼: 탭이 아니라 '내 정보' 탭 바로 위에 떠 있는 라임 둥근 사각형 (시안의 기록 버튼 모양 그대로)
  fab: { width: 64, height: 56, radius: 20, gapAboveTabBar: 12, rightInset: 41 },
  // 스크롤 목록은 아래에 이만큼 비워 둔다: 84 + 12 + 56 + 16
  listBottomInset: 168,
} as const;

// 모션: 시안엔 없음 → 신규 제안. "불이 켜지는" 순간에만 쓴다.
export const motion = {
  ringOn: { duration: 280, easing: 'easeOut' }, // 기록 저장 후 내 링이 켜짐
  progress: { duration: 400, easing: 'easeOut' },
  tap: { scale: 0.97, duration: 90 },
} as const;

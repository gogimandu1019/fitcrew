// DB 함수가 던지는 오류 코드(supabase/migrations 의 raise exception '<코드>')를 사용자 문구로 바꾼다.

const MESSAGES: Record<string, string> = {
  invalid_code: '없는 코드예요. 다시 확인해 주세요.',
  group_full: '이 크루는 정원 30명이 가득 찼어요.',
  already_member: '이미 참여한 크루예요.',
  under_age: '만 14세 이상부터 가입할 수 있어요.',
  daily_limit_exceeded: '하루 운동 시간은 24시간을 넘길 수 없어요.',
  future_not_allowed: '앞으로의 시각은 기록할 수 없어요.',
  invalid_sport: '사용할 수 없는 종목이에요. 종목을 다시 골라 주세요.',
  forbidden: '이 작업을 할 권한이 없어요.',
  not_inactive: '30일 이상 기록이 없는 크루원만 내보낼 수 있어요.',
  invalid_period: '기간을 다시 선택해 주세요.',
  duplicate_sport: '이미 있는 종목이에요.',
  no_backend: '서버가 연결되지 않았어요. (미리보기 모드)',
  native_not_supported: '모바일 앱 로그인은 아직 준비 중이에요. 웹에서 이용해 주세요.',
  provider_not_enabled: 'Google 로그인이 아직 켜지지 않았어요.',
};

export const FALLBACK_MESSAGE = '잠시 후 다시 시도해 주세요.';

export class AppError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.name = 'AppError';
    this.code = code;
  }
}

// Postgres 오류 메시지는 코드 그대로(`group_full`)이거나 접두어가 붙어 올 수 있어, 알려진 코드가 들어 있으면 그것을 쓴다.
export function errorCode(raw: unknown): string {
  const text = raw instanceof Error ? raw.message : typeof raw === 'string' ? raw : '';
  const known = Object.keys(MESSAGES).find((code) => text.includes(code));
  if (known) return known;
  // 종목 이름 중복은 DB의 unique 제약이 던지는 일반 메시지로 온다.
  if (text.includes('duplicate key') && text.includes('user_sports')) return 'duplicate_sport';
  return 'unknown';
}

export function errorMessage(raw: unknown): string {
  return MESSAGES[errorCode(raw)] ?? FALLBACK_MESSAGE;
}

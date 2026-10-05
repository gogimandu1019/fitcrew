// 화면 입력 검증. DB의 check 제약(supabase/migrations/..._schema.sql)과 같은 규칙을 쓴다.
// DB가 최종 방어선이고, 여기는 사용자가 빨리 알아채게 하는 용도다.

export const LIMITS = {
  nickname: { min: 1, max: 10 },
  groupName: { min: 1, max: 20 },
  sportName: { min: 1, max: 20 },
  age: { min: 14, max: 120 },
  heightCm: { min: 100, max: 250 },
  weightKg: { min: 20, max: 300 },
  goalMin: { min: 30, max: 2400, step: 30, default: 240 },
} as const;

export const GOAL_PRESETS = [120, 180, 240, 300, 420] as const; // 2:00 ~ 7:00

export type NumberCheck = { ok: true; value: number } | { ok: false; error: 'empty' | 'invalid' | 'under_age' | 'range' };

export function trimmedLength(text: string): number {
  return Array.from(text.trim()).length; // 한글·이모지를 글자 단위로 센다
}

export function isValidName(text: string, limit: { min: number; max: number }): boolean {
  const n = trimmedLength(text);
  return n >= limit.min && n <= limit.max;
}

// 숫자 칸: 입력 중에는 숫자(와 소수점 한 개)만 남긴다.
export function digitsOnly(text: string, allowDecimal = false): string {
  if (!allowDecimal) return text.replace(/[^0-9]/g, '');
  const cleaned = text.replace(/[^0-9.]/g, '');
  const [head, ...rest] = cleaned.split('.');
  return rest.length ? `${head}.${rest.join('').slice(0, 1)}` : head;
}

function check(text: string, min: number, max: number): NumberCheck {
  if (text.trim() === '') return { ok: false, error: 'empty' };
  const value = Number(text);
  if (!Number.isFinite(value)) return { ok: false, error: 'invalid' };
  if (value < min || value > max) return { ok: false, error: 'range' };
  return { ok: true, value };
}

export function checkAge(text: string): NumberCheck {
  if (text.trim() === '') return { ok: false, error: 'empty' };
  const value = Number(text);
  if (!Number.isInteger(value)) return { ok: false, error: 'invalid' };
  if (value < LIMITS.age.min) return { ok: false, error: 'under_age' }; // 만 14세 미만 가입 차단
  if (value > LIMITS.age.max) return { ok: false, error: 'range' };
  return { ok: true, value };
}
export const checkHeight = (text: string) => check(text, LIMITS.heightCm.min, LIMITS.heightCm.max);
export const checkWeight = (text: string) => check(text, LIMITS.weightKg.min, LIMITS.weightKg.max);

// ---- 주간 목표 ----
export function stepGoal(current: number, direction: 1 | -1): number {
  const next = current + direction * LIMITS.goalMin.step;
  return Math.min(LIMITS.goalMin.max, Math.max(LIMITS.goalMin.min, next));
}
export function dailyAverageMin(goalMin: number): number {
  return Math.round(goalMin / 7);
}

// ---- 그룹 코드: 영문+숫자 6자리 ----
export const CODE_LENGTH = 6;
export function normalizeCode(text: string): string {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH);
}
export function isCompleteCode(text: string): boolean {
  return normalizeCode(text).length === CODE_LENGTH;
}

// ---- 종목 ----
export const sportKey = (name: string) => name.trim().toLowerCase(); // DB의 name_key와 같은 규칙

export type DraftSport = { name: string; color: string };

// 이름을 정리해 추가한다. 공백·대소문자만 다른 중복은 무시하고, 규칙에 어긋나면 null.
export function addSport(list: DraftSport[], name: string, color: string): DraftSport[] | null {
  const clean = name.trim();
  if (!isValidName(clean, LIMITS.sportName)) return null;
  if (list.some((s) => sportKey(s.name) === sportKey(clean))) return null;
  return [...list, { name: clean, color }];
}

// 아직 쓰지 않은 색 중 첫 번째. 모두 썼으면 처음부터 다시.
export function nextUnusedColor(used: string[], palette: readonly string[]): string {
  return palette.find((c) => !used.includes(c)) ?? palette[used.length % palette.length];
}

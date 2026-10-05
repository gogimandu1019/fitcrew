// 하루·주의 경계는 KST 03:00. DB의 fit_day() 등과 같은 규칙을 앱에서도 쓴다 (supabase/migrations/..._schema.sql).
// 기기의 시간대와 상관없이 항상 한국 시간으로 계산한다. Intl 시간대 지원에 기대지 않고 직접 계산한다.

const HOUR = 3600_000;
const KST_OFFSET = 9 * HOUR;
const DAY_SHIFT = 3 * HOUR; // 하루는 03:00에 시작

const pad = (n: number) => String(n).padStart(2, '0');
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

type DateLike = Date | string | number;
const ms = (d: DateLike) => new Date(d).getTime();

// 'YYYY-MM-DD' — 03:00 전이면 전날
export function fitDay(d: DateLike): string {
  const x = new Date(ms(d) + KST_OFFSET - DAY_SHIFT);
  return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}`;
}

function parseDay(day: string): { y: number; m: number; d: number } {
  const [y, m, d] = day.split('-').map(Number);
  return { y, m, d };
}

export function addDays(day: string, n: number): string {
  const { y, m, d } = parseDay(day);
  const x = new Date(Date.UTC(y, m - 1, d + n));
  return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}`;
}

// 실제 시각의 한국 시계 "HH:MM" (03:00 보정 없음)
export function kstClock(d: DateLike): string {
  const x = new Date(ms(d) + KST_OFFSET);
  return `${pad(x.getUTCHours())}:${pad(x.getUTCMinutes())}`;
}

// 운동일(fit day)과 한국 시계 시각으로 실제 시점을 만든다. 00:00~02:59는 그 운동일의 '다음 달력 날짜'에 속한다.
export function instantFor(day: string, hh: number, mm: number): Date {
  const { y, m, d } = parseDay(day);
  const calendarShift = hh < 3 ? 1 : 0;
  return new Date(Date.UTC(y, m - 1, d + calendarShift, hh, mm) - KST_OFFSET);
}

// "오늘" / "어제" / "10월 3일 금요일"
export function dayLabel(day: string, today: string): string {
  if (day === today) return '오늘';
  if (day === addDays(today, -1)) return '어제';
  return longDay(day);
}

export function longDay(day: string): string {
  const { y, m, d } = parseDay(day);
  const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${m}월 ${d}일 ${WEEKDAYS[w]}요일`;
}

export function shortDay(day: string): string {
  const { m, d } = parseDay(day);
  return `${m}/${d}`;
}

// 입력 중인 "HHMM" 숫자를 "HH:MM"으로. 4자리가 되면 시·분 범위를 검사한다.
export function parseClock(text: string): { hh: number; mm: number } | null {
  const digits = text.replace(/[^0-9]/g, '');
  if (digits.length !== 4) return null;
  const hh = Number(digits.slice(0, 2));
  const mm = Number(digits.slice(2));
  return hh <= 23 && mm <= 59 ? { hh, mm } : null;
}

export function formatClockInput(text: string): string {
  const digits = text.replace(/[^0-9]/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

export const INTENSITY_LABEL = { light: '가볍게', normal: '보통', hard: '힘들게' } as const;

// 앞으로의 시각 기록은 막는다. 시계 오차를 감안해 10분까지는 허용한다 (DB의 workouts_validate와 같은 규칙).
export const FUTURE_TOLERANCE_MS = 10 * 60_000;
export function isTooFarInFuture(instant: Date, now: number = Date.now()): boolean {
  return instant.getTime() > now + FUTURE_TOLERANCE_MS;
}

// 몇 일 전인지 (오늘이면 0). 크루장 화면의 "마지막 기록" 표시용.
export function daysSince(iso: string, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 86400_000));
}

export function lastWorkoutLabel(iso: string | null, now: number = Date.now()): string {
  if (!iso) return '기록 없음';
  const d = daysSince(iso, now);
  return d === 0 ? '마지막 기록 오늘' : `마지막 기록 ${d}일 전`;
}

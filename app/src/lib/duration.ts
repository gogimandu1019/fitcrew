// 운동 시간 입력: 시간(h)과 분(m)을 따로 다룬다. 저장은 항상 합계 분(정수).
// 합계는 5분~24시간. (DB는 1분~1440분이고, 스핀 버튼은 5분 단위로 움직여 0분 기록을 만들지 않는다.)

export const MIN_TOTAL = 5;
export const MAX_TOTAL = 1440;
export const MINUTE_STEP = 5;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function splitHm(total: number): { h: number; m: number } {
  const t = clamp(Math.round(total), 0, MAX_TOTAL);
  return { h: Math.floor(t / 60), m: t % 60 };
}

// 24:00을 넘지 않게, 24시간이면 분은 0으로 맞춘다.
export function joinHm(h: number, m: number): number {
  const hh = clamp(Math.floor(h), 0, 24);
  const mm = hh === 24 ? 0 : clamp(Math.floor(m), 0, 59);
  return hh * 60 + mm;
}

// 스핀 버튼: 시간 ±1, 분 ±5(5의 배수로 맞춰 가며). 5분 아래나 24시간 위로는 움직이지 않는다.
export function stepHours(total: number, dir: 1 | -1): number {
  const { h, m } = splitHm(total);
  const next = joinHm(h + dir, m);
  return next >= MIN_TOTAL && next <= MAX_TOTAL ? next : total;
}

export function stepMinutes(total: number, dir: 1 | -1): number {
  const { h, m } = splitHm(total);
  const snapped = dir > 0 ? Math.floor(m / MINUTE_STEP) * MINUTE_STEP + MINUTE_STEP : Math.ceil(m / MINUTE_STEP) * MINUTE_STEP - MINUTE_STEP;
  if (snapped < 0 || snapped > 59) return total; // 시간 칸과 따로 움직이므로 분이 넘치거나 모자라도 시간은 건드리지 않는다
  const next = joinHm(h, snapped);
  return next >= MIN_TOTAL && next <= MAX_TOTAL ? next : total;
}

// 직접 입력: 빈 칸은 0으로 본다. 합계가 1분 미만이면 호출한 쪽에서 막는다.
export function setHours(total: number, text: string): number {
  return joinHm(Number(text.replace(/[^0-9]/g, '') || 0), splitHm(total).m);
}
export function setMinutes(total: number, text: string): number {
  return joinHm(splitHm(total).h, Number(text.replace(/[^0-9]/g, '') || 0));
}

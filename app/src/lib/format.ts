// 시간은 모든 종목의 공통 단위다. 분(min) 정수로 저장하고 화면에서만 "2:25"로 바꾼다.

export function formatHm(totalMin: number): string {
  const safe = Math.max(0, Math.round(totalMin));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

// 달성률(%). 목표를 넘어도 100으로 자르지 않고 그대로 보여준다.
export function achievementPercent(totalMin: number, goalMin: number): number {
  if (goalMin <= 0) return 0;
  return Math.round((totalMin / goalMin) * 100);
}

// 진행 막대는 100%에서 멈춘다.
export function barRatio(totalMin: number, goalMin: number): number {
  if (goalMin <= 0) return 0;
  return Math.min(1, Math.max(0, totalMin / goalMin));
}

export function remainingMin(totalMin: number, goalMin: number): number {
  return Math.max(0, goalMin - totalMin);
}

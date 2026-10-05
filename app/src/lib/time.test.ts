import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  addDays, dayLabel, daysSince, lastWorkoutLabel, fitDay, formatClockInput, instantFor, isTooFarInFuture, kstClock, longDay, parseClock,
} from './time.ts';

// DB 테스트(supabase/tests/db.test.js)와 같은 값. 앱과 DB가 같은 날로 계산하는지 확인한다.
test('하루 경계: 03:00 전은 전날, 03:00부터 새 하루 (DB fit_day와 동일)', () => {
  assert.equal(fitDay('2026-10-06T02:59:00+09:00'), '2026-10-05');
  assert.equal(fitDay('2026-10-06T03:00:00+09:00'), '2026-10-06');
  assert.equal(fitDay('2026-10-05T12:00:00+09:00'), '2026-10-05');
});

test('기기 시간대와 무관하게 한국 시간으로 계산', () => {
  // UTC 18:00 = KST 03:00 (다음 날)
  assert.equal(fitDay('2026-10-04T18:00:00Z'), '2026-10-05');
  assert.equal(fitDay('2026-10-04T17:59:00Z'), '2026-10-04');
  assert.equal(kstClock('2026-10-04T21:10:00Z'), '06:10'); // 시안의 06:10
});

test('날짜 계산과 라벨', () => {
  assert.equal(addDays('2026-10-01', -1), '2026-09-30');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(dayLabel('2026-10-05', '2026-10-05'), '오늘');
  assert.equal(dayLabel('2026-10-04', '2026-10-05'), '어제');
  assert.equal(dayLabel('2026-10-03', '2026-10-05'), '10월 3일 토요일');
  assert.equal(longDay('2026-10-05'), '10월 5일 월요일'); // 시안: 10월 5일 월요일
});

test('운동일 + 시각 → 실제 시점: 00~02시는 다음 달력 날짜', () => {
  assert.equal(instantFor('2026-10-05', 6, 10).toISOString(), '2026-10-04T21:10:00.000Z');
  assert.equal(fitDay(instantFor('2026-10-05', 6, 10)), '2026-10-05');
  // 10/5 운동일의 01:30은 달력상 10/6 01:30
  const late = instantFor('2026-10-05', 1, 30);
  assert.equal(late.toISOString(), '2026-10-05T16:30:00.000Z');
  assert.equal(fitDay(late), '2026-10-05');
  assert.equal(kstClock(late), '01:30');
});

test('시각 입력', () => {
  assert.deepEqual(parseClock('0610'), { hh: 6, mm: 10 });
  assert.deepEqual(parseClock('06:10'), { hh: 6, mm: 10 });
  assert.equal(parseClock('2460'), null);
  assert.equal(parseClock('061'), null);
  assert.equal(formatClockInput('0610'), '06:10');
  assert.equal(formatClockInput('06'), '06');
  assert.equal(formatClockInput('06101'), '06:10');
});

test('미래 시각: 10분까지는 허용, 그 이상은 거부', () => {
  const now = Date.parse('2026-10-05T12:00:00+09:00');
  assert.equal(isTooFarInFuture(new Date(now + 9 * 60_000), now), false);
  assert.equal(isTooFarInFuture(new Date(now + 10 * 60_000), now), false);
  assert.equal(isTooFarInFuture(new Date(now + 10 * 60_000 + 1), now), true);
  assert.equal(isTooFarInFuture(new Date(now - 3600_000), now), false);
});

test('마지막 기록 표시', () => {
  const now = Date.parse('2026-10-05T12:00:00Z');
  assert.equal(daysSince('2026-10-05T01:00:00Z', now), 0);
  assert.equal(daysSince('2026-09-24T12:00:00Z', now), 11);
  assert.equal(lastWorkoutLabel(null, now), '기록 없음');
  assert.equal(lastWorkoutLabel('2026-10-05T01:00:00Z', now), '마지막 기록 오늘');
  assert.equal(lastWorkoutLabel('2026-08-25T12:00:00Z', now), '마지막 기록 41일 전');
});

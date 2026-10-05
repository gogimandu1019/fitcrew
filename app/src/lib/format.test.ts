import assert from 'node:assert/strict';
import { test } from 'node:test';

import { errorCode, errorMessage, FALLBACK_MESSAGE } from './errors.ts';
import { achievementPercent, barRatio, formatHm, remainingMin } from './format.ts';

test('시간 표기: 분 → h:mm', () => {
  assert.equal(formatHm(145), '2:25');
  assert.equal(formatHm(240), '4:00');
  assert.equal(formatHm(5), '0:05');
  assert.equal(formatHm(0), '0:00');
  assert.equal(formatHm(-3), '0:00');
});

test('주간 카드: 2:25 / 4:00 은 달성률 60%, 남은 시간 1:35 (시안 값)', () => {
  assert.equal(achievementPercent(145, 240), 60);
  assert.equal(formatHm(remainingMin(145, 240)), '1:35');
  assert.equal(barRatio(145, 240), 145 / 240);
});

test('목표 초과: 달성률은 그대로, 막대는 100%에서 멈추고 남은 시간은 0', () => {
  assert.equal(achievementPercent(300, 240), 125);
  assert.equal(barRatio(300, 240), 1);
  assert.equal(remainingMin(300, 240), 0);
});

test('목표 0 이하는 0으로 처리', () => {
  assert.equal(achievementPercent(100, 0), 0);
  assert.equal(barRatio(100, 0), 0);
});

test('오류 코드 → 문구 (DB가 던지는 코드와 동기)', () => {
  assert.equal(errorCode(new Error('group_full')), 'group_full');
  assert.equal(errorCode('P0001: invalid_code'), 'invalid_code');
  assert.equal(errorMessage(new Error('under_age')), '만 14세 이상부터 가입할 수 있어요.');
  assert.equal(errorMessage(new Error('???')), FALLBACK_MESSAGE);
  assert.equal(errorMessage(new Error('Unsupported provider: provider_not_enabled')), 'Google 로그인이 아직 켜지지 않았어요.');
  assert.equal(errorMessage(undefined), FALLBACK_MESSAGE);
  assert.equal(errorMessage(new Error('duplicate key value violates unique constraint "user_sports_user_id_name_key_key"')), '이미 있는 종목이에요.');
});

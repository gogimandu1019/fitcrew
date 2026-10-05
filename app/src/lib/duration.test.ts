import assert from 'node:assert/strict';
import { test } from 'node:test';

import { joinHm, setHours, setMinutes, splitHm, stepHours, stepMinutes } from './duration.ts';

test('합계 분 ↔ 시간·분', () => {
  assert.deepEqual(splitHm(90), { h: 1, m: 30 });
  assert.deepEqual(splitHm(1440), { h: 24, m: 0 });
  assert.equal(joinHm(1, 30), 90);
  assert.equal(joinHm(24, 30), 1440); // 24시간이면 분은 0
  assert.equal(joinHm(2, 75), 2 * 60 + 59); // 분은 59까지
});

test('시간 스핀: ±1시간, 분은 그대로', () => {
  assert.equal(stepHours(30, 1), 90);
  assert.equal(stepHours(90, -1), 30);
  assert.equal(stepHours(90, 1), 150);
});

test('시간 스핀: 5분 아래로는 내려가지 않고, 24시간을 넘지 않는다', () => {
  assert.equal(stepHours(30, -1), 30); // 0시간 30분 → 시간을 더 내리면 -1시간
  assert.equal(stepHours(1440, 1), 1440);
  assert.equal(stepHours(60, -1), 60); // 0:00 이 되므로 막는다
  assert.equal(stepHours(23 * 60 + 30, 1), 1440); // 24:30은 없으므로 24:00으로 맞춰짐
});

test('분 스핀: 5분 단위, 5의 배수가 아니면 가까운 5의 배수로', () => {
  assert.equal(stepMinutes(60 + 30, 1), 60 + 35);
  assert.equal(stepMinutes(60 + 30, -1), 60 + 25);
  assert.equal(stepMinutes(17, 1), 20); // 17 → 20
  assert.equal(stepMinutes(17, -1), 15); // 17 → 15
});

test('분 스핀: 시간 칸을 건드리지 않고 0~59에서 멈춘다', () => {
  assert.equal(stepMinutes(60 + 55, 1), 60 + 55); // 59를 넘기지 않음
  assert.equal(stepMinutes(60, -1), 60); // 1:00에서 분 0 아래로 안 감
  assert.equal(stepMinutes(5, -1), 5); // 0:00이 되는 것을 막음
  assert.equal(stepMinutes(30, -1), 25);
});

test('직접 입력', () => {
  assert.equal(setHours(30, '2'), 150);
  assert.equal(setHours(30, ''), 30); // 빈 칸은 0시간
  assert.equal(setMinutes(60, '45'), 105);
  assert.equal(setMinutes(60, '99'), 60 + 59);
  assert.equal(setHours(30, '30'), 1440); // 24시간으로 제한
});

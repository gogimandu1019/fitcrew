import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  addSport, checkAge, checkHeight, checkWeight, dailyAverageMin, digitsOnly, isCompleteCode, isValidName,
  LIMITS, nextUnusedColor, normalizeCode, sportKey, stepGoal, trimmedLength,
} from './validation.ts';

test('닉네임·이름: 공백을 뺀 글자 수로 1~N자', () => {
  assert.equal(isValidName('민지', LIMITS.nickname), true);
  assert.equal(isValidName('   ', LIMITS.nickname), false);
  assert.equal(isValidName('가나다라마바사아자차카', LIMITS.nickname), false);
  assert.equal(isValidName('가나다라마바사아자차', LIMITS.nickname), true); // 정확히 10자
  assert.equal(trimmedLength(' 러닝 '), 2);
});

test('나이: 14세 미만은 가입 차단, 소수·빈칸·너무 큰 값은 거부', () => {
  assert.deepEqual(checkAge('28'), { ok: true, value: 28 });
  assert.deepEqual(checkAge('14'), { ok: true, value: 14 });
  assert.deepEqual(checkAge('13'), { ok: false, error: 'under_age' });
  assert.deepEqual(checkAge(''), { ok: false, error: 'empty' });
  assert.deepEqual(checkAge('28.5'), { ok: false, error: 'invalid' });
  assert.deepEqual(checkAge('121'), { ok: false, error: 'range' });
});

test('키·몸무게 범위 (DB check와 동일)', () => {
  assert.deepEqual(checkHeight('165.5'), { ok: true, value: 165.5 });
  assert.deepEqual(checkHeight('99'), { ok: false, error: 'range' });
  assert.deepEqual(checkHeight('251'), { ok: false, error: 'range' });
  assert.deepEqual(checkWeight('55'), { ok: true, value: 55 });
  assert.deepEqual(checkWeight('19.9'), { ok: false, error: 'range' });
  assert.deepEqual(checkWeight('abc'), { ok: false, error: 'invalid' });
});

test('숫자 칸 입력 정리', () => {
  assert.equal(digitsOnly('2a8'), '28');
  assert.equal(digitsOnly('165.55', true), '165.5');
  assert.equal(digitsOnly('1.2.3', true), '1.2');
  assert.equal(digitsOnly('12.5', false), '125');
});

test('주간 목표: 30분 단위, 30분~40시간 범위에서 멈춘다', () => {
  assert.equal(stepGoal(240, 1), 270);
  assert.equal(stepGoal(240, -1), 210);
  assert.equal(stepGoal(30, -1), 30);
  assert.equal(stepGoal(2400, 1), 2400);
  assert.equal(dailyAverageMin(240), 34); // 시안: "하루 평균 약 34분"
});

test('그룹 코드: 대문자로 바꾸고 영숫자 6자리만', () => {
  assert.equal(normalizeCode(' run-24k! '), 'RUN24K');
  assert.equal(normalizeCode('abcdefgh'), 'ABCDEF');
  assert.equal(isCompleteCode('RUN24'), false);
  assert.equal(isCompleteCode('run24k'), true);
});

test('종목 추가: 공백·대소문자 중복과 규칙 위반은 무시', () => {
  const base = [{ name: '러닝', color: 'mint' }];
  assert.equal(addSport(base, ' 러닝 ', 'sky'), null);
  assert.equal(addSport(base, '', 'sky'), null);
  assert.equal(addSport(base, '가'.repeat(21), 'sky'), null);
  assert.deepEqual(addSport(base, ' 클라이밍 ', 'white'), [...base, { name: '클라이밍', color: 'white' }]);
  assert.equal(addSport([{ name: 'Climbing', color: 'white' }], 'climbing', 'pink'), null);
  assert.equal(sportKey(' Climbing '), 'climbing');
});

test('새 종목의 기본 색은 아직 안 쓴 색부터', () => {
  const palette = ['sky', 'coral', 'violet'];
  assert.equal(nextUnusedColor(['sky'], palette), 'coral');
  assert.equal(nextUnusedColor([], palette), 'sky');
  assert.equal(nextUnusedColor(['sky', 'coral', 'violet'], palette), 'sky');
});

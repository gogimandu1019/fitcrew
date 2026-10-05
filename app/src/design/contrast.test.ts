// 글자 색과 배경의 명도 대비(WCAG 2.x)를 계산해 기준 미달을 막는다.
// 본문 글자 4.5:1, 큰 글자(18px 이상·굵은 14px 이상)·아이콘 3:1.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { avatarPalette, color, sportPalette } from './tokens.ts';

function lum(hex: string): number {
  const n = parseInt(hex.slice(1, 7), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
export function ratio(a: string, b: string): number {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const BACKGROUNDS = { 화면: color.night, 카드: color.card, 칩: color.field, 탭바: color.tabBar } as const;

test('본문 글자 색은 모든 배경에서 4.5:1 이상', () => {
  for (const [bgName, bg] of Object.entries(BACKGROUNDS)) {
    for (const key of ['text', 'textSub', 'textMuted'] as const) {
      assert.ok(ratio(color[key], bg) >= 4.5, `${key} on ${bgName}: ${ratio(color[key], bg).toFixed(2)}`);
    }
  }
});

test('비활성(textDisabled)은 화면·카드·탭바에서 4.5:1 이상, 칩 배경 위에서는 3:1 이상', () => {
  for (const bg of [color.night, color.card, color.tabBar]) assert.ok(ratio(color.textDisabled, bg) >= 4.5);
  assert.ok(ratio(color.textDisabled, color.field) >= 3);
});

test('라임 버튼: 검정 글자가 4.5:1 이상, 라임 글자는 화면·카드 위에서 4.5:1 이상', () => {
  assert.ok(ratio(color.night, color.lime) >= 4.5);
  assert.ok(ratio(color.lime, color.night) >= 4.5);
  assert.ok(ratio(color.lime, color.card) >= 4.5);
  assert.ok(ratio(color.lime, color.limeTint) >= 4.5);
});

test('오류색(danger)은 화면·카드 위에서 4.5:1 이상', () => {
  assert.ok(ratio(color.danger, color.night) >= 4.5);
  assert.ok(ratio(color.danger, color.card) >= 4.5);
});

test('종목 색 글자(칩·피드)는 카드 위에서 4.5:1 이상', () => {
  for (const s of sportPalette) assert.ok(ratio(s.hex, color.card) >= 4.5, `${s.key}: ${ratio(s.hex, color.card).toFixed(2)}`);
});

test('꺼진 아바타 글자는 꺼진 배경 위에서 4:1 이상', () => {
  assert.ok(ratio(color.avatarOffText, color.off) >= 4);
});

test('아바타 색 위의 글자(어두운 색)는 4.5:1 이상', () => {
  for (const a of avatarPalette) assert.ok(ratio(color.night, a) >= 4.5);
});

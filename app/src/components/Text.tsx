import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { color as palette, font, type } from '@/design/tokens';

export type TextVariant = keyof typeof type;

type TypeSpec = { size: number; weight: number; family?: 'numeric'; lineHeight?: number };

// 한글은 시스템 폰트(fontFamily 미지정), 숫자(family: 'numeric')만 Barlow Condensed.
export function Text({
  variant = 'body',
  color = palette.text,
  style,
  ...rest
}: TextProps & { variant?: TextVariant; color?: string }) {
  const spec = type[variant] as TypeSpec;
  const base: TextStyle = { color, fontSize: spec.size };
  if (spec.family === 'numeric') {
    base.fontFamily = font.numeric[spec.weight as 600 | 700 | 800];
  } else {
    base.fontWeight = String(spec.weight) as TextStyle['fontWeight'];
  }
  if (spec.lineHeight) base.lineHeight = spec.size * spec.lineHeight;
  // 시스템 글자 크기를 따르되 1.3배까지만 키워 레이아웃이 깨지지 않게 한다.
  return <RNText maxFontSizeMultiplier={1.3} {...rest} style={[base, style]} />;
}

import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { color, layout, radius } from '@/design/tokens';

import { Text } from './Text';

export type ButtonVariant = 'primary' | 'ghost' | 'kakao' | 'google' | 'apple' | 'danger';

const LOOK: Record<ButtonVariant, { bg: string; fg: string; border?: string; weight?: '500' | '700' }> = {
  primary: { bg: color.lime, fg: color.night },
  ghost: { bg: 'transparent', fg: color.text, border: color.line },
  kakao: { bg: color.kakao, fg: color.kakaoText },
  google: { bg: color.card, fg: color.text, border: color.line, weight: '500' },
  apple: { bg: color.text, fg: color.night, weight: '500' },
  danger: { bg: 'transparent', fg: color.danger, border: '#4A2626' },
};

// 하단 고정 풀폭 CTA. 비활성이면 어두운 회색.
export function Button({ label, onPress, variant = 'primary', disabled, style }: {
  label: string; onPress?: () => void; variant?: ButtonVariant; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const look = LOOK[variant];
  const off = disabled && (variant === 'primary' || variant === 'ghost');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: off ? color.field : look.bg,
          borderColor: look.border ?? 'transparent',
          borderWidth: look.border ? 1 : 0,
          opacity: disabled && !off ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        style,
      ]}>
      <Text variant="item" color={off ? color.textDisabled : look.fg} style={look.weight ? { fontWeight: look.weight } : undefined}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: layout.ctaHeight, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' },
});

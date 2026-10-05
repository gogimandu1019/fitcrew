import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { color, radius } from '@/design/tokens';

import { Icon } from './Icon';
import { Text } from './Text';

export function SettingsCard({ children }: { children: ReactNode }) {
  return <View style={{ backgroundColor: color.card, borderRadius: radius.card, overflow: 'hidden' }}>{children}</View>;
}

// 설정 행: 왼쪽 이름, 오른쪽 값/장식 + 화살표. onPress가 없으면 눌리지 않는 안내 행.
export function SettingsRow({ label, right, onPress, danger, last, disabledHint }: {
  label: string; right?: ReactNode; onPress?: () => void; danger?: boolean; last?: boolean; disabledHint?: string;
}) {
  const content = (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56,
      borderBottomWidth: last ? 0 : 1, borderBottomColor: color.cardBorder,
    }}>
      <Text variant="body" color={danger ? color.danger : color.text} style={{ fontSize: 16 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {disabledHint ? <Text variant="caption" color={color.textDim}>{disabledHint}</Text> : right}
        {onPress ? <Icon name="chevron" size={18} color={color.textMuted} /> : null}
      </View>
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>{content}</Pressable>
  );
}

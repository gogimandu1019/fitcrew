import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { color } from '@/design/tokens';

import { Icon } from './Icon';
import { Text } from './Text';

// 초기 설정 상단: 뒤로가기 + 3단계 진행 표시줄 + n/3
export function StepHeader({ step, total = 3, onBack, right }: {
  step: number; total?: number; onBack?: () => void; right?: React.ReactNode;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 44 }}>
      {onBack !== undefined || step > 1 ? (
        <Pressable accessibilityRole="button" accessibilityLabel="뒤로" hitSlop={12} onPress={onBack ?? (() => router.back())}
          style={{ width: 40, height: 40, marginLeft: -8, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="back" />
        </Pressable>
      ) : null}
      <View accessibilityLabel={`${total}단계 중 ${step}단계`} style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < step ? color.lime : color.off }} />
        ))}
      </View>
      {right ?? <Text variant="numInline" color={color.textMuted} style={{ fontSize: 16, letterSpacing: 1 }}>{step}/{total}</Text>}
    </View>
  );
}

// 단계 표시 없이 뒤로가기만 있는 헤더 (그룹 만들기 등)
export function BackHeader() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 44 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="뒤로" hitSlop={12} onPress={() => router.back()}
        style={{ width: 40, height: 40, marginLeft: -8, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="back" />
      </Pressable>
    </View>
  );
}

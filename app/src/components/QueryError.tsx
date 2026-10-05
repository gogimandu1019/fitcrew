import { View } from 'react-native';

import { color, radius } from '@/design/tokens';

import { Button } from './Button';
import { Text } from './Text';

// 목록·카드를 불러오지 못했을 때: 다시 시도 버튼과 함께 보여 준다.
export function QueryError({ message = '불러오지 못했어요.', onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <View accessibilityRole="alert"
      style={{ backgroundColor: color.card, borderRadius: radius.card, padding: 20, alignItems: 'center', gap: 12 }}>
      <Text variant="itemSm">{message}</Text>
      <Text variant="caption" color={color.textMuted} style={{ textAlign: 'center' }}>
        네트워크를 확인하고 다시 시도해 주세요.
      </Text>
      <Button label="다시 시도" variant="ghost" onPress={onRetry} style={{ alignSelf: 'stretch' }} />
    </View>
  );
}

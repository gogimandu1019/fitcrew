import { Pressable, View } from 'react-native';

import { color } from '@/design/tokens';

import { Icon } from './Icon';
import { Text } from './Text';

// 종목 칩. 선택하면 종목 색 14% 배경 + 색 테두리 + 체크. 선택 전에는 색 점만.
export function SportChip({ name, hex, selected, onPress, small }: {
  name: string; hex: string; selected: boolean; onPress: () => void; small?: boolean;
}) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={onPress}
      style={{
        height: small ? 38 : 46, paddingHorizontal: small ? 13 : 16, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: selected ? `${hex}24` : color.field, borderWidth: 1.5, borderColor: selected ? hex : 'transparent',
      }}>
      {selected ? <Icon name="check" size={small ? 14 : 16} color={hex} strokeWidth={2.6} />
        : <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: hex }} />}
      <Text variant="body" color={selected ? hex : color.textSub} style={{ fontSize: small ? 14 : 16, fontWeight: selected ? '700' : '400' }}>{name}</Text>
    </Pressable>
  );
}

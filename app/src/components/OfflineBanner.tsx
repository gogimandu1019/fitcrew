import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color } from '@/design/tokens';
import { useOnline } from '@/lib/network';

import { Icon } from './Icon';
import { Text } from './Text';

// 연결이 끊기면 화면 위에 작게 알린다. 터치는 막지 않는다.
export function OfflineBanner() {
  const online = useOnline();
  const insets = useSafeAreaInsets();
  if (online) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 6, left: 0, right: 0, alignItems: 'center', zIndex: 100 }}>
      <View accessibilityRole="alert" accessibilityLiveRegion="polite"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: color.card, borderWidth: 1, borderColor: color.line }}>
        <Icon name="warn" size={16} color={color.danger} />
        <Text variant="caption" color={color.textSub}>오프라인이에요. 연결되면 다시 불러올게요.</Text>
      </View>
    </View>
  );
}

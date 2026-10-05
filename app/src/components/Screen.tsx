import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, layout } from '@/design/tokens';

export function Screen({ children, style, bottomInset = 0 }: {
  children: ReactNode; style?: StyleProp<ViewStyle>; bottomInset?: number;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          flex: 1, backgroundColor: color.night, paddingHorizontal: layout.screenPadX,
          paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 16) + bottomInset,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

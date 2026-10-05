import { Pressable, View } from 'react-native';

import { color, sportPalette } from '@/design/tokens';

import { Icon } from './Icon';

// 종목 색 팔레트 (8색). 라임은 "했다" 신호 전용이라 없다.
export function ColorPalette({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="종목 색" style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {sportPalette.map((c) => {
        const sel = c.key === value;
        return (
          <Pressable key={c.key} accessibilityRole="radio" accessibilityLabel={c.label} accessibilityState={{ selected: sel }}
            onPress={() => onChange(c.key)} hitSlop={4}
            style={{
              width: 34, height: 34, borderRadius: 17, backgroundColor: c.hex, alignItems: 'center', justifyContent: 'center',
              borderWidth: sel ? 2 : 0, borderColor: color.textMuted,
            }}>
            {sel ? <Icon name="check" size={16} color={color.night} strokeWidth={3} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

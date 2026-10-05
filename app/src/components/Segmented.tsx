import { Pressable, View } from 'react-native';

import { color, radius } from '@/design/tokens';

import { Text } from './Text';

export function Segmented<T extends string>({ options, value, onChange, label }: {
  options: { value: T; label: string }[]; value: T | null; onChange: (v: T) => void; label: string;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label}
      style={{ flexDirection: 'row', backgroundColor: color.card, borderWidth: 1, borderColor: color.cardBorder, borderRadius: radius.button, padding: 3 }}>
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <Pressable key={o.value} accessibilityRole="radio" accessibilityState={{ selected: sel }} onPress={() => onChange(o.value)}
            style={{ flex: 1, paddingVertical: 12, borderRadius: 13, alignItems: 'center', backgroundColor: sel ? color.lime : 'transparent' }}>
            <Text variant="body" color={sel ? color.night : color.textMuted} style={{ fontWeight: sel ? '700' : '400' }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

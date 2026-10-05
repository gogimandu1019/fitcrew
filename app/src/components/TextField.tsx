import { forwardRef, useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { color, layout, radius } from '@/design/tokens';

import { Icon } from './Icon';
import { Text } from './Text';
import { noOutline } from '@/design/web';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  counter?: string; // 예: "2/10"
  unit?: string; // 예: "cm"
  error?: string | null;
  numeric?: boolean; // 숫자 칸은 숫자 서체로 크게
};

// 기본 / 포커스(라임 테두리) / 오류(빨간 테두리 + 문구) 세 상태.
export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, counter, unit, error, numeric, onFocus, onBlur, ...rest }, ref,
) {
  const [focused, setFocused] = useState(false);
  const border = error ? color.danger : focused ? color.lime : color.cardBorder;
  const thick = error || focused;
  return (
    <View style={{ gap: 7, minWidth: 0, flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="caption" color={color.textMuted}>{label}</Text>
        {counter ? <Text variant="caption" color={color.textDim}>{counter}</Text> : null}
      </View>
      <View style={{
        height: layout.inputHeight, borderRadius: radius.button, backgroundColor: color.card,
        borderWidth: thick ? 2 : 1, borderColor: border, paddingHorizontal: thick ? 15 : 16,
        flexDirection: 'row', alignItems: 'center',
      }}>
        <TextInput
          ref={ref}
          {...rest}
          accessibilityLabel={label}
          placeholderTextColor={color.textDim}
          selectionColor={color.lime}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={[
            { flex: 1, minWidth: 0, color: color.text, ...noOutline, height: '100%', padding: 0 },
            numeric ? { fontFamily: 'BarlowCondensed_700Bold', fontSize: 24 } : { fontSize: 17 },
          ]}
        />
        {unit ? <Text variant="caption" color={color.textMuted} style={{ fontSize: 14, marginLeft: 6 }}>{unit}</Text> : null}
      </View>
      {error ? (
        <View accessibilityRole="alert" style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Icon name="warn" size={14} color={color.danger} />
          <Text variant="micro" color={color.danger} style={{ flex: 1 }}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
});

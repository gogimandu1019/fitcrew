import { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { color, radius } from '@/design/tokens';
import { CODE_LENGTH, normalizeCode } from '@/lib/validation';

import { Text } from './Text';
import { noOutline } from '@/design/web';

// 6칸 코드 입력. 실제 입력은 보이지 않는 TextInput 하나가 받고, 칸은 그 값을 보여 준다.
// 한 칸씩 자동으로 다음 칸으로 넘어가는 효과가 자연스럽게 나오고, 붙여넣기도 된다.
export function CodeInput({ value, onChange, error, autoFocus }: {
  value: string; onChange: (v: string) => void; error?: boolean; autoFocus?: boolean;
}) {
  const ref = useRef<TextInput>(null);
  const [focused, setFocused] = useState(!!autoFocus);
  const current = Math.min(value.length, CODE_LENGTH - 1);

  return (
    <Pressable accessibilityLabel="초대 코드 입력" onPress={() => ref.current?.focus()} style={{ position: 'relative' }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {Array.from({ length: CODE_LENGTH }, (_, i) => {
          const isCurrent = focused && i === current && value.length < CODE_LENGTH;
          const border = error ? color.danger : isCurrent ? color.lime : color.cardBorder;
          return (
            <View key={i} style={{
              flex: 1, height: 60, borderRadius: radius.cell, backgroundColor: color.card,
              borderWidth: error || isCurrent ? 2 : 1, borderColor: border, alignItems: 'center', justifyContent: 'center',
            }}>
              <Text variant="numRank" style={{ fontSize: 32 }}>{value[i] ?? ''}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(normalizeCode(t))}
        autoFocus={autoFocus}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        maxLength={CODE_LENGTH * 2} // 붙여넣기에 섞인 기호를 정리한 뒤 6자로 자른다
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel="초대 코드"
        caretHidden
        style={{ position: 'absolute', inset: 0, opacity: 0, color: 'transparent', ...noOutline }}
      />
    </Pressable>
  );
}

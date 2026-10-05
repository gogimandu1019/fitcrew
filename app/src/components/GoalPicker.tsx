import { Pressable, View } from 'react-native';

import { color, radius } from '@/design/tokens';
import { formatHm } from '@/lib/format';
import { dailyAverageMin, GOAL_PRESETS, LIMITS, stepGoal } from '@/lib/validation';

import { Icon } from './Icon';
import { Text } from './Text';

// 주간 목표: 시간이 공통 단위라서 숫자를 가장 크게. −/+ 는 30분 단위. 초기 설정 2/3과 내 정보 수정이 같이 쓴다.
export function GoalPicker({ value, onChange }: { value: number; onChange: (min: number) => void }) {
  const size = formatHm(value).length > 4 ? 76 : 104; // 10:00 이상은 폭에 맞춰 줄인다
  return (
    <>
      <View style={{ backgroundColor: color.card, borderRadius: radius.card, paddingVertical: 24, paddingHorizontal: 16, gap: 18, alignItems: 'center' }}>
        <Text variant="caption" color={color.textMuted}>주간 목표</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <StepButton label="30분 줄이기" icon="minus" disabled={value <= LIMITS.goalMin.min} onPress={() => onChange(stepGoal(value, -1))} />
          <Text accessibilityLiveRegion="polite" numberOfLines={1}
            style={{ flex: 1, textAlign: 'center', fontFamily: 'BarlowCondensed_800ExtraBold', fontSize: size, lineHeight: size, color: color.text }}>
            {formatHm(value)}
          </Text>
          <StepButton label="30분 늘리기" icon="plus" disabled={value >= LIMITS.goalMin.max} onPress={() => onChange(stepGoal(value, 1))} />
        </View>
        <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
          {GOAL_PRESETS.map((p) => {
            const sel = p === value;
            return (
              <Pressable key={p} accessibilityRole="button" accessibilityState={{ selected: sel }} onPress={() => onChange(p)}
                style={{ paddingVertical: 8, paddingHorizontal: 11, borderRadius: 999, backgroundColor: sel ? color.lime : color.field }}>
                <Text variant="numSmall" color={sel ? color.night : color.textSub} style={{ letterSpacing: 0.5 }}>{formatHm(p)}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Text variant="caption" color={color.textMuted} style={{ textAlign: 'center', lineHeight: 20 }}>
        하루 평균 약 <Text variant="caption" color={color.textSub} style={{ fontWeight: '700' }}>{dailyAverageMin(value)}분</Text>이에요.
      </Text>
    </>
  );
}

function StepButton({ icon, label, onPress, disabled }: { icon: 'plus' | 'minus'; label: string; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
      style={({ pressed }) => ({
        width: 48, height: 48, borderRadius: 24, backgroundColor: color.field, alignItems: 'center', justifyContent: 'center',
        opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
      })}>
      <Icon name={icon} size={22} />
    </Pressable>
  );
}

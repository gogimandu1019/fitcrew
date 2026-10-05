import { View } from 'react-native';

import { color, radius } from '@/design/tokens';
import { achievementPercent, barRatio, formatHm, remainingMin } from '@/lib/format';

import { Text } from './Text';

// 이번 주 내 운동 카드 (시안 02): 라임 카드 + 큰 숫자 + 진행 막대. 라임은 "했다"의 신호.
export function WeekCard({ totalMin, goalMin }: { totalMin: number; goalMin: number }) {
  const remaining = remainingMin(totalMin, goalMin);
  const percent = achievementPercent(totalMin, goalMin);
  return (
    <View accessible accessibilityLabel={`이번 주 운동 ${formatHm(totalMin)}, 목표 ${formatHm(goalMin)}, 달성률 ${percent}퍼센트`}
      style={{ backgroundColor: color.lime, borderRadius: radius.hero, paddingVertical: 22, paddingHorizontal: 24, gap: 12 }}>
      <Text variant="itemSm" color={color.night} style={{ fontSize: 14 }}>이번 주 내 운동</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
        <Text variant="numCard" color={color.night}>{formatHm(totalMin)}</Text>
        <Text variant="body" color={color.night} style={{ fontWeight: '500' }}>/ {formatHm(goalMin)} 목표</Text>
      </View>
      <View style={{ height: 10, borderRadius: 5, backgroundColor: 'rgba(14, 15, 14, 0.18)' }}>
        <View style={{ width: `${barRatio(totalMin, goalMin) * 100}%`, height: 10, borderRadius: 5, backgroundColor: color.night }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="itemSm" color={color.night} style={{ fontSize: 14 }}>
          {remaining > 0 ? `남은 시간 ${formatHm(remaining)}` : '이번 주 목표 달성!'}
        </Text>
        <Text variant="itemSm" color={color.night} style={{ fontSize: 14 }}>달성률 {percent}%</Text>
      </View>
    </View>
  );
}

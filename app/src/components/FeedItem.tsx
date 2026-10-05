import { Pressable, View } from 'react-native';

import { color, radius, sportPalette } from '@/design/tokens';
import type { FeedItem as Item } from '@/lib/api';
import { formatHm } from '@/lib/format';
import { INTENSITY_LABEL, kstClock } from '@/lib/time';

import { Avatar } from './Avatar';
import { Text } from './Text';

export const sportHex = (key: string | null | undefined) =>
  sportPalette.find((c) => c.key === key)?.hex ?? sportPalette[0].hex;

// 기록 항목 (시안 02): 아바타, 이름, 시각·강도, 메모, 종목(종목 색), 운동 시간.
// 내 기록이면 눌러서 수정할 수 있다.
export function FeedItem({ item, mine, onPress }: { item: Item; mine: boolean; onPress?: () => void }) {
  const hex = sportHex(item.sport_color);
  const content = (
    <View style={{ backgroundColor: color.card, borderRadius: radius.card, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Avatar nickname={item.nickname} colorIndex={item.avatar_color} size={40} />
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text variant="itemSm">
          {item.nickname}{' '}
          <Text variant="micro" color={color.textMuted}>{kstClock(item.started_at)} · {INTENSITY_LABEL[item.intensity]}</Text>
        </Text>
        {item.memo ? <Text variant="caption" color={color.textSub} numberOfLines={1}>{item.memo}</Text> : null}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text variant="micro" color={hex} style={{ fontWeight: '700' }} numberOfLines={1}>{item.sport_name}</Text>
        <Text variant="numInline" style={{ fontSize: 24 }}>{formatHm(item.duration_min)}</Text>
      </View>
    </View>
  );
  if (!mine || !onPress) return content;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${item.sport_name} ${formatHm(item.duration_min)} 기록 수정`} onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      {content}
    </Pressable>
  );
}

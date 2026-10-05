import { View } from 'react-native';

import { color } from '@/design/tokens';
import type { RankRow } from '@/lib/api';
import { formatHm } from '@/lib/format';

import { Avatar } from './Avatar';
import { sportHex } from './FeedItem';
import { Text } from './Text';

// 1~3위 시상대 (시안 04): 가운데가 1위(라임 단), 왼쪽 2위, 오른쪽 3위.
// 공동 순위가 있으면 번호는 서버가 준 등수를 그대로 쓰고 단 높이는 표시 순서를 따른다.
const STEPS = [
  { height: 126, bg: color.lime, fg: color.night, rankSize: 40, timeSize: 26, avatar: 54, ring: true },
  { height: 92, bg: color.off, fg: color.text, rankSize: 30, timeSize: 20, avatar: 44, ring: false },
  { height: 72, bg: color.field, fg: color.text, rankSize: 26, timeSize: 20, avatar: 44, ring: false },
] as const;

export function Podium({ top }: { top: RankRow[] }) {
  // 화면 순서: 2위 | 1위 | 3위
  const order = [1, 0, 2];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 10, height: 216 }}>
      {order.map((idx) => {
        const row = top[idx];
        const step = STEPS[idx];
        if (!row) return <View key={idx} style={{ flex: 1 }} />;
        return (
          <View key={row.user_id} style={{ flex: 1, alignItems: 'center', gap: 6 }}
            accessible accessibilityLabel={`${row.rank}위 ${row.nickname} ${formatHm(row.total_min)}`}>
            <Avatar nickname={row.nickname} colorIndex={row.avatar_color} size={step.avatar} state={step.ring ? 'on' : 'plain'} />
            <Text variant="micro" color={row.top_sport_color ? sportHex(row.top_sport_color) : color.textMuted}
              style={{ fontWeight: '700' }} numberOfLines={1}>{row.top_sport_name ?? ' '}</Text>
            <View style={{
              width: '100%', height: step.height, borderTopLeftRadius: 16, borderTopRightRadius: 16, backgroundColor: step.bg,
              alignItems: 'center', paddingTop: 10,
            }}>
              <Text variant="numHero" color={step.fg} style={{ fontSize: step.rankSize, lineHeight: step.rankSize }}>{row.rank}</Text>
              <Text variant="numInline" color={step.fg} style={{ fontSize: step.timeSize, marginTop: 6 }}>{formatHm(row.total_min)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

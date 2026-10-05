import { View } from 'react-native';

import { color } from '@/design/tokens';
import type { RankRow } from '@/lib/api';
import { formatHm } from '@/lib/format';

import { Avatar } from './Avatar';
import { Text } from './Text';

// 4위 이하 목록 행 (시안 04). 내 행은 순위 숫자가 라임.
export function RankListRow({ row, first }: { row: RankRow; first: boolean }) {
  return (
    <View accessible accessibilityLabel={`${row.rank}위 ${row.nickname} ${formatHm(row.total_min)}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 56, paddingHorizontal: 4, borderTopWidth: first ? 0 : 1, borderTopColor: '#1E201E' }}>
      <Text variant="numRank" color={row.is_me ? color.lime : color.textMuted} style={{ width: 28, fontSize: 22 }}>{row.rank}</Text>
      <Avatar nickname={row.nickname} colorIndex={row.avatar_color} size={36} state={row.total_min > 0 ? 'plain' : 'off'} />
      <Text variant="itemSm" style={{ flex: 1 }} numberOfLines={1}>
        {row.nickname}{' '}
        {row.top_sport_name ? <Text variant="micro" color={color.textSub}>{row.top_sport_name}</Text> : null}
      </Text>
      <Text variant="numRank" style={{ fontSize: 22 }}>{formatHm(row.total_min)}</Text>
    </View>
  );
}

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Podium } from '@/components/Podium';
import { RankListRow } from '@/components/RankListRow';
import { QueryError } from '@/components/QueryError';
import { Text } from '@/components/Text';
import { color, layout, radius } from '@/design/tokens';
import type { RankPeriod } from '@/lib/api';
import { useCurrentGroup } from '@/lib/currentGroup';
import { formatHm } from '@/lib/format';
import { useGroupRanking } from '@/lib/queries';

const PERIODS: { value: RankPeriod; label: string }[] = [
  { value: 'week', label: '이번 주' },
  { value: 'month', label: '이번 달' },
];

// 랭킹보드 (시안 04). MVP는 "내 그룹"만 — 그룹별·전체 유저 탭은 MVP 이후라 보이지 않는다.
export default function Ranking() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { current } = useCurrentGroup();
  const [period, setPeriod] = useState<RankPeriod>('week');
  const ranking = useGroupRanking(current?.group_id, period);
  const rows = ranking.data ?? [];
  const me = rows.find((r) => r.is_me);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: color.night }}
      refreshControl={<RefreshControl refreshing={false} tintColor={color.lime} onRefresh={() => qc.invalidateQueries()} />}
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: layout.screenPadX, paddingBottom: layout.listBottomInset, gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="title" style={{ fontSize: 26 }}>랭킹</Text>
        <View accessibilityRole="radiogroup" accessibilityLabel="기간" style={{ flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: color.field }}>
          {PERIODS.map((p) => {
            const sel = p.value === period;
            return (
              <Pressable key={p.value} accessibilityRole="radio" accessibilityState={{ selected: sel }} onPress={() => setPeriod(p.value)}
                style={{ height: 34, paddingHorizontal: 16, borderRadius: 999, justifyContent: 'center', backgroundColor: sel ? color.lime : 'transparent' }}>
                <Text variant="caption" color={sel ? color.night : color.textSub} style={{ fontSize: 14, fontWeight: sel ? '700' : '400' }}>{p.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ height: 40, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: color.lime, justifyContent: 'center' }}>
          <Text variant="caption" color={color.lime} style={{ fontSize: 14, fontWeight: '700' }}>내 그룹</Text>
        </View>
        <Text variant="caption" color={color.textMuted} numberOfLines={1} style={{ flex: 1 }}>{current?.name ?? ''}</Text>
      </View>

      {ranking.isError && rows.length === 0 ? (
        <QueryError message="순위를 불러오지 못했어요." onRetry={() => ranking.refetch()} />
      ) : rows.length === 0 ? (
        <View style={{ backgroundColor: color.card, borderRadius: radius.card, padding: 24, alignItems: 'center', gap: 6 }}>
          <Text variant="itemSm">{ranking.isLoading ? '불러오는 중…' : '아직 순위가 없어요'}</Text>
        </View>
      ) : (
        <>
          <Podium top={rows.slice(0, 3)} />

          {me && (
            <View accessible accessibilityLabel={`크루 내 내 순위 ${rows.length}명 중 ${me.rank}위, ${formatHm(me.total_min)}`}
              style={{ backgroundColor: color.limeTint, borderWidth: 1, borderColor: color.lime, borderRadius: radius.card, paddingVertical: 14, paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ gap: 2 }}>
                <Text variant="caption" color={color.textSub}>크루 내 내 순위</Text>
                <Text variant="itemSm">{rows.length}명 중 <Text variant="numCard" color={color.lime} style={{ fontSize: 26, lineHeight: 28 }}>{me.rank}</Text>위</Text>
              </View>
              <Text variant="numCard" color={color.lime} style={{ fontSize: 40, lineHeight: 42 }}>{formatHm(me.total_min)}</Text>
            </View>
          )}

          {rows.length > 3 && (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 6 }}>
                <Text variant="micro" color={color.textMuted}>순위</Text>
                <Text variant="micro" color={color.textMuted}>운동 시간 합계</Text>
              </View>
              {rows.slice(3).map((r, i) => <RankListRow key={r.user_id} row={r} first={i === 0} />)}
            </View>
          )}
          <Text variant="micro" color={color.textDim} style={{ textAlign: 'center', paddingTop: 4 }}>
            순위는 {period === 'week' ? '월요일 새벽 3시' : '매월 1일 새벽 3시'}에 초기화돼요
          </Text>
        </>
      )}
    </ScrollView>
  );
}

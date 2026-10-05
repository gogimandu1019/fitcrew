import { useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeedItem } from '@/components/FeedItem';
import { Icon } from '@/components/Icon';
import { QueryError } from '@/components/QueryError';
import { Text } from '@/components/Text';
import { TodayMembers } from '@/components/TodayMembers';
import { WeekCard } from '@/components/WeekCard';
import { color, layout, radius } from '@/design/tokens';
import type { FeedItem as Item } from '@/lib/api';
import { useCurrentGroup } from '@/lib/currentGroup';
import { formatHm } from '@/lib/format';
import { useGroupFeed, useGroupToday, useWeekSummary } from '@/lib/queries';
import { useSession } from '@/lib/session';
import { dayLabel, fitDay, longDay } from '@/lib/time';

type Row = { kind: 'day'; key: string; day: string; total: number | null } | { kind: 'item'; key: string; item: Item };

// 홈 · 그룹 기록 (시안 02): 헤더 → 이번 주 내 운동 → 오늘 운동한 멤버 → 날짜별 피드
export default function Home() {
  const insets = useSafeAreaInsets();
  const { current } = useCurrentGroup();
  const { state } = useSession();
  const qc = useQueryClient();
  const week = useWeekSummary();
  const today = useGroupToday(current?.group_id);
  const feed = useGroupFeed(current?.group_id);
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const myId = state.status === 'ready' ? state.session.user.id : null;
  const todayDay = fitDay(new Date());

  // 날짜별로 묶는다: 날짜 머리글(총 시간) 다음에 그날의 기록들
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let day: string | null = null;
    const items = feed.data?.items ?? [];
    const lastDay = items.length ? items[items.length - 1].fit_day : null;
    for (const item of items) {
      if (item.fit_day !== day) {
        day = item.fit_day;
        // 아직 다 읽지 않은 마지막 날은 합계가 모자랄 수 있어 숨긴다.
        const partial = feed.hasNextPage && day === lastDay;
        const total = items.filter((i) => i.fit_day === day).reduce((n, i) => n + i.duration_min, 0);
        out.push({ kind: 'day', key: `d-${day}`, day, total: partial ? null : total });
      }
      out.push({ kind: 'item', key: item.workout_id, item });
    }
    return out;
  }, [feed.data, feed.hasNextPage]);

  const copyCode = async () => {
    if (!current) return;
    await Clipboard.setStringAsync(current.code);
    setNotice('초대 코드를 복사했어요.');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), 2000);
  };

  const header = (
    <View style={{ gap: 20, paddingTop: insets.top + 24 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ gap: 2, flex: 1 }}>
          <Text variant="caption" color={color.textMuted}>{longDay(todayDay)}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="크루 바꾸기" onPress={() => router.push('/groups')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
            <Text variant="headline" numberOfLines={1} style={{ flexShrink: 1 }}>{current?.name ?? ''}</Text>
            <View style={{ transform: [{ rotate: '90deg' }] }}><Icon name="chevron" size={18} color={color.textSub} /></View>
          </Pressable>
        </View>
        {current && (
          <Pressable accessibilityRole="button" accessibilityLabel={`초대 코드 ${current.code} 복사`} onPress={copyCode} hitSlop={8}
            style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: color.field }}>
            <Text variant="numInline" color={color.textSub} style={{ fontSize: 16, letterSpacing: 1 }}>{current.code}</Text>
          </Pressable>
        )}
      </View>

      {notice && <Text accessibilityLiveRegion="polite" variant="caption" color={color.textSub}>{notice}</Text>}

      <WeekCard totalMin={week.data?.total_min ?? 0} goalMin={week.data?.goal_min ?? 240} />

      {today.data && <TodayMembers members={today.data} />}

      {current && current.member_count <= 1 && (
        <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: color.line, borderRadius: radius.card, padding: 20, alignItems: 'center', gap: 6 }}>
          <Text variant="itemSm">아직 크루원이 나뿐이에요</Text>
          <Text variant="caption" color={color.textMuted} style={{ textAlign: 'center' }}>
            초대 코드 <Text variant="caption" color={color.textSub} style={{ fontWeight: '700' }}>{current.code}</Text>를 공유해서 크루원을 불러 보세요.
          </Text>
        </View>
      )}
      <View style={{ height: 4 }} />
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: color.night }}
      contentContainerStyle={{ paddingHorizontal: layout.screenPadX, paddingBottom: layout.listBottomInset, gap: 10 }}
      data={rows}
      keyExtractor={(r) => r.key}
      ListHeaderComponent={header}
      onEndReachedThreshold={0.6}
      onEndReached={() => { if (feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage(); }}
      ListFooterComponent={feed.isFetchingNextPage ? <Text variant="caption" color={color.textMuted} style={{ textAlign: 'center', paddingVertical: 12 }}>불러오는 중…</Text> : null}
      refreshControl={<RefreshControl refreshing={false} tintColor={color.lime} onRefresh={() => qc.invalidateQueries()} />}
      ListEmptyComponent={
        feed.isLoading ? null : feed.isError ? (
          <QueryError message="기록을 불러오지 못했어요." onRetry={() => feed.refetch()} />
        ) : (
          <View style={{ backgroundColor: color.card, borderRadius: radius.card, padding: 24, alignItems: 'center', gap: 6 }}>
            <Text variant="itemSm">아직 기록이 없어요</Text>
            <Text variant="caption" color={color.textMuted} style={{ textAlign: 'center' }}>아래 기록 버튼으로 오늘의 첫 불을 켜 보세요.</Text>
          </View>
        )
      }
      renderItem={({ item: row }) =>
        row.kind === 'day' ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 10 }}>
            <Text variant="itemSm">{dayLabel(row.day, todayDay)}</Text>
            {row.total !== null && <Text variant="caption" color={color.textMuted}>총 <Text variant="numSmall">{formatHm(row.total)}</Text></Text>}
          </View>
        ) : (
          <FeedItem item={row.item} mine={row.item.user_id === myId}
            onPress={() => router.push({ pathname: '/record', params: { id: row.item.workout_id } })} />
        )
      }
    />
  );
}

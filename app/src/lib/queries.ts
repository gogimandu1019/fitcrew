// 화면에서 쓰는 조회 훅. 서버가 연결되지 않은 미리보기 모드에서는 샘플 데이터를 돌려준다.
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, type FeedItem, type RankPeriod } from './api';
import { hasBackend } from './env';
import { keys } from './query';
import { useSession } from './session';
import {
  SAMPLE_ACTIVITY, SAMPLE_FEED, SAMPLE_GROUPS, SAMPLE_PRIVATE, SAMPLE_PROFILE, SAMPLE_RANKING, SAMPLE_SPORTS, SAMPLE_TODAY, SAMPLE_WEEK,
} from './sample';

// 로그인(또는 미리보기) 상태에서만 서버를 부른다.
function useSignedIn(): boolean {
  const { state } = useSession();
  return state.status === 'ready' || state.status === 'needsGroup' || state.status === 'preview';
}

export function useMyGroups() {
  const enabled = useSignedIn();
  return useQuery({ queryKey: keys.myGroups, enabled, queryFn: () => (hasBackend ? api.myGroups() : SAMPLE_GROUPS) });
}

export function useWeekSummary() {
  const enabled = useSignedIn();
  return useQuery({ queryKey: keys.weekSummary, enabled, queryFn: () => (hasBackend ? api.weekSummary() : SAMPLE_WEEK) });
}

export function useGroupToday(groupId: string | undefined) {
  return useQuery({
    queryKey: keys.today(groupId ?? ''), enabled: !!groupId,
    queryFn: () => (hasBackend ? api.groupToday(groupId!) : SAMPLE_TODAY),
  });
}

export const FEED_PAGE_SIZE = 30;

// 피드는 30개씩 이어 읽는다. 다음 페이지는 마지막 기록의 (시각, id)에서 이어진다.
export function useGroupFeed(groupId: string | undefined) {
  return useInfiniteQuery({
    queryKey: keys.feed(groupId ?? ''), enabled: !!groupId,
    initialPageParam: undefined as FeedItem | undefined,
    queryFn: ({ pageParam }) =>
      hasBackend ? api.groupFeed(groupId!, pageParam, FEED_PAGE_SIZE) : Promise.resolve(SAMPLE_FEED),
    getNextPageParam: (last) => (hasBackend && last.length === FEED_PAGE_SIZE ? last[last.length - 1] : undefined),
    select: (data) => ({ ...data, items: data.pages.flat() }),
  });
}

export function useGroupRanking(groupId: string | undefined, period: RankPeriod) {
  return useQuery({
    queryKey: keys.ranking(groupId ?? '', period), enabled: !!groupId,
    queryFn: () => (hasBackend ? api.groupRanking(groupId!, period) : SAMPLE_RANKING),
  });
}

export const myProfileKey = ['myProfile'] as const;
export function useMyProfile() {
  const enabled = useSignedIn();
  return useQuery({ queryKey: myProfileKey, enabled, retry: false, queryFn: () => (hasBackend ? api.myProfile() : SAMPLE_PROFILE) });
}

export const myPrivateKey = ['myPrivate'] as const;
export function useMyPrivate() {
  const enabled = useSignedIn();
  return useQuery({ queryKey: myPrivateKey, enabled, queryFn: () => (hasBackend ? api.myPrivate() : SAMPLE_PRIVATE) });
}

// 크루장 전용. 일반 크루원이 부르면 서버가 forbidden으로 거부한다.
export function useMemberActivity(groupId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['memberActivity', groupId ?? ''], enabled: enabled && !!groupId, retry: false,
    queryFn: () => (hasBackend ? api.memberActivity(groupId!) : SAMPLE_ACTIVITY),
  });
}

export const mySportsKey = ['mySports'] as const;
export function useMySports() {
  const enabled = useSignedIn();
  return useQuery({ queryKey: mySportsKey, enabled, queryFn: () => (hasBackend ? api.mySports() : SAMPLE_SPORTS) });
}

// 기록이 바뀌면 홈 피드·주간 누적·랭킹·그룹 전환 시트의 오늘 인원이 모두 달라지므로 한꺼번에 새로 고친다.
export function useRefreshAfterWorkout() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}
